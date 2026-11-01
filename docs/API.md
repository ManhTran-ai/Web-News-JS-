# API — Tin tức 24h

Tất cả endpoint đều là `GET` và nằm dưới tiền tố `/api`.
Base URL khi chạy dev: `http://localhost:4000` (client Vite proxy `/api` sang server này).

## Quy ước phản hồi

Danh sách trả về `{ data, meta }`, chi tiết một đối tượng trả về `{ data }`.

```ts
interface ListMeta {
  page: number;      // trang hiện tại (1-based)
  limit: number;     // số bài mỗi trang
  total: number;     // tổng số bài khớp điều kiện
  totalPages: number;
  updatedAt: string; // ISO timestamp lúc dữ liệu được cập nhật
}
```

Lỗi trả về `{ error: { code, message } }`:

| HTTP | `error.code` | Ý nghĩa |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu hoặc sai tham số truy vấn |
| 404 | `NOT_FOUND` | Bài viết không tồn tại hoặc đã hết hạn lưu giữ |
| 502 | `CONTENT_UNAVAILABLE` | Không crawl được nội dung bài từ trang báo |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước |

---

## `GET /api/health`

Trạng thái server, số bài đang lưu và trạng thái từng nguồn tin.

```json
{
  "status": "ok",
  "uptime": 8123.4,
  "lastRefreshAt": "2026-11-01T12:10:07.894Z",
  "articleCount": 1500,
  "sources": [
    {
      "id": "vnexpress",
      "name": "VnExpress",
      "ok": true,
      "count": 300,
      "error": null
    }
  ]
}
```

---

## `GET /api/categories`

Danh sách 11 chuyên mục chuẩn kèm số bài đang có trong RAM.

```json
{
  "data": [
    { "slug": "thoi-su", "name": "Thời sự", "count": 142 },
    { "slug": "the-gioi", "name": "Thế giới", "count": 96 }
  ]
}
```

---

## `GET /api/sources`

Danh sách nguồn tin kèm trạng thái, số bài và toàn bộ feed đang dùng.

```json
{
  "data": [
    {
      "id": "vnexpress",
      "name": "VnExpress",
      "homepage": "https://vnexpress.net",
      "enabled": true,
      "count": 300,
      "ok": true,
      "error": null,
      "feeds": [
        { "category": "thoi-su", "url": "https://vnexpress.net/rss/thoi-su.rss" }
      ]
    }
  ]
}
```

---

## `GET /api/articles`

Danh sách bài, có thể lọc theo `category`, `source`, `q` và phân trang.

| Query | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `category` | string | — | slug chuyên mục, xem `/api/categories` |
| `source` | string | — | id nguồn, xem `/api/sources` |
| `q` | string | — | từ khoá, không phân biệt dấu tiếng Việt |
| `page` | number ≥ 1 | `1` | số trang |
| `limit` | number 1–50 | `20` | số bài mỗi trang |

```bash
curl "http://localhost:4000/api/articles?category=the-thao&limit=5"
```

```json
{
  "data": [
    {
      "id": "676da4cfe208015e",
      "title": "Mẹ đặt mục tiêu IELTS 8.0 cho con gái 6 tuổi",
      "summary": "Tóm tắt từ RSS của bài viết.",
      "thumbnail": "https://cdn2.vncdn.net/.../thumb.jpg",
      "link": "https://vnexpress.net/bai-viet-123.html",
      "sourceId": "vnexpress",
      "source": "VnExpress",
      "category": "giai-tri",
      "publishedAt": "2026-11-01T09:12:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 42,
    "totalPages": 9,
    "updatedAt": "2026-11-01T12:10:07.894Z"
  }
}
```

---

## `GET /api/articles/latest`

Bài mới nhất, sắp theo thời gian đăng giảm dần. Nhận `page` và `limit` (mặc định `20`).

```bash
curl "http://localhost:4000/api/articles/latest?limit=10"
```

Phản hồi giống `GET /api/articles`.

---

## `GET /api/articles/featured`

Bài nổi bật: có ảnh và xen kẽ nhiều nguồn. Nhận `limit` (mặc định `10`).

```bash
curl "http://localhost:4000/api/articles/featured?limit=6"
```

---

## `GET /api/articles/:id`

Chi tiết một bài.

```bash
curl "http://localhost:4000/api/articles/676da4cfe208015e"
```

```json
{
  "data": {
    "id": "676da4cfe208015e",
    "title": "Mẹ đặt mục tiêu IELTS 8.0 cho con gái 6 tuổi",
    "summary": "Tóm tắt từ RSS của bài viết.",
    "thumbnail": "https://cdn2.vncdn.net/.../thumb.jpg",
    "link": "https://vnexpress.net/bai-viet-123.html",
    "sourceId": "vnexpress",
    "source": "VnExpress",
    "category": "giai-tri",
    "publishedAt": "2026-11-01T09:12:00.000Z"
  }
}
```

---

## `GET /api/articles/:id/related`

Bài liên quan (cùng chuyên mục). Nhận `limit` (mặc định `6`, tối đa `6`).

```bash
curl "http://localhost:4000/api/articles/676da4cfe208015e/related?limit=4"
```

---

## `GET /api/articles/:id/content`

**Nội dung đầy đủ của bài** — server crawl trang báo, trích xuất bằng Readability rồi làm
sạch bằng `sanitize-html`. Không có `script`, `iframe`, hay thuộc tính `onerror`; URL
tương đối đã đổi thành tuyệt đối; ảnh lazy (`data-src`) đã đổi thành `src`.

Nếu nội dung đã có trong cache thì trả về ngay, không crawl lại. Nếu crawl lỗi →
`502 CONTENT_UNAVAILABLE`.

> Endpoint này bị giới hạn 30 request/phút (các endpoint khác là 300 request/phút).

```bash
curl "http://localhost:4000/api/articles/676da4cfe208015e/content"
```

```json
{
  "data": {
    "id": "676da4cfe208015e",
    "contentHtml": "<figure><img src=\"https://cdn2.vncdn.net/.../hero.jpg\"><figcaption>Ảnh minh hoạ</figcaption></figure><p>Nội dung bài viết...</p>",
    "author": "Nguyễn Văn A",
    "leadImage": "https://cdn2.vncdn.net/.../hero.jpg",
    "fetchedAt": "2026-11-01T12:10:12.301Z"
  }
}
```

---

## `GET /api/search`

Tìm kiếm toàn văn trên tiêu đề + tóm tắt, **không phân biệt dấu tiếng Việt**
(`"viet nam"` khớp với `"Việt Nam"`).

| Query | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `q` | có | — | từ khoá tìm kiếm |
| `page` | không | `1` | số trang |
| `limit` | không | `20` | số bài mỗi trang |

```bash
curl "http://localhost:4000/api/search?q=vi%E1%BB%87t%20nam&limit=5"
```

Phản hồi giống `GET /api/articles`.
