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
| 429 | `REFRESH_IN_PROGRESS` | Đang làm mới dữ liệu, thử lại sau |
| 502 | `CONTENT_UNAVAILABLE` | Không crawl được nội dung bài từ trang báo |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước |

### Header chung

Mọi response đều có `X-Request-Id` để đối chiếu log server. Các endpoint trả danh sách
kèm `ETag` và `Cache-Control`; gửi lại `If-None-Match` đúng ETag sẽ nhận `304 Not Modified`.

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
| `since` | ISO datetime | — | chỉ lấy bài đăng từ thời điểm này trở đi |
| `until` | ISO datetime | — | chỉ lấy bài đăng trước thời điểm này |
| `page` | number ≥ 1 | `1` | số trang |
| `limit` | number 1–50 | `20` | số bài mỗi trang |

> Khi có `q`, kết quả được xếp hạng theo độ liên quan (trùng tiêu đề > trùng tóm tắt)
> rồi mới tới thời gian đăng.

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

---

## `GET /api/articles/rss.xml`

Feed RSS tổng hợp của chính website, dùng để đăng ký nguồn hoặc import vào trình đọc.
Nhận `limit` (mặc định `20`, tối đa `50`) và `category`.

```bash
curl "http://localhost:4000/api/articles/rss.xml?limit=10&category=the-thao"
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tin tức 24h</title>
    <link>http://localhost:4000</link>
    <description>Tổng hợp tin tức từ VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet</description>
    <language>vi</language>
    <item>
      <title>Tiêu đề bài viết</title>
      <link>http://localhost:4000/bai-viet/676da4cfe208015e</link>
      <guid isPermaLink="false">676da4cfe208015e</guid>
      <pubDate>Sun, 01 Nov 2026 09:12:00 GMT</pubDate>
      <category>Thể thao</category>
      <source url="https://vnexpress.net/bai-viet-123.html">VnExpress</source>
      <description><![CDATA[Tóm tắt bài viết.]]></description>
    </item>
  </channel>
</rss>
```

---

## `POST /api/refresh`

Buộc server quét lại toàn bộ RSS, cập nhật store và ghi snapshot. Server cũng tự gọi
endpoint này theo lịch `REFRESH_CRON` (mặc định `*/5 * * * *`).

Nếu đang có một lượt refresh chạy, trả về `429 REFRESH_IN_PROGRESS`.

```bash
curl -X POST "http://localhost:4000/api/refresh"
```

```json
{
  "data": {
    "startedAt": "2026-11-01T12:10:07.894Z",
    "finishedAt": "2026-11-01T12:10:12.301Z",
    "added": 118,
    "feedsOk": 59,
    "feedsFailed": 0,
    "sources": [{ "id": "vnexpress", "name": "VnExpress", "ok": true, "count": 300 }]
  }
}
```

---

## Endpoint nào dùng ở đâu trong client

Mỗi endpoint chỉ được gọi qua `client/src/api/endpoints.ts` — component không gọi `axios`
trực tiếp. Dưới đây là mapping từ endpoint → hàm gọi → thunk → slice → nơi dùng.

| Endpoint | Hàm trong `api/endpoints.ts` | Thunk (Redux) | Slice | Nơi dùng |
|---|---|---|---|---|
| `GET /api/health` | — | — | — | Chưa dùng ở client (dành cho kiểm tra server) |
| `GET /api/categories` | `getCategories()` | `fetchCategories` | `categoriesSlice` | `main.tsx` (tải 1 lần khi khởi động) · `pages/CategoryIndexPage.tsx` |
| `GET /api/sources` | `getSources()` | `fetchSources` | `sourcesSlice` | `main.tsx` (tải 1 lần khi khởi động) · bộ lọc nguồn ở `pages/CategoryPage.tsx` |
| `GET /api/articles/latest` | `getLatest()` | `fetchLatest` | `articlesSlice` | `layouts/RootLayout.tsx` (dải tin mới nhất, polling 60s) |
| `GET /api/articles/featured` | `getFeatured()` | `fetchFeatured` | `articlesSlice` | `pages/HomePage.tsx` (carousel tin nổi bật) |
| `GET /api/articles` | `getArticles()` | `fetchByCategory`, `fetchCategoryLatest`, `queryArticles`, `prefetchNextPage`, `prefetchNextQueryPage` | `articlesSlice` | `pages/CategoryPage.tsx` · `pages/CategoryIndexPage.tsx` · `pages/SearchPage.tsx` · `pages/HomePage.tsx` |
| `GET /api/articles/:id` | `getArticleById()` | `fetchArticleById` | `articlesSlice` | `pages/ArticleDetailPage.tsx` |
| `GET /api/articles/:id/related` | `getRelated()` | `fetchRelated` → `fetchRelatedArticles` | `articlesSlice` → `relatedArticlesSlice` | `pages/ArticleDetailPage.tsx` (mục "Bài liên quan") |
| `GET /api/articles/:id/content` | `getArticleContent()` | `fetchArticleContent` | `articleContentSlice` | `pages/ArticleDetailPage.tsx` → `components/article/ArticleBody.tsx` |
| `GET /api/articles/rss.xml` | `getRSS()` | `fetchRSS` | `articlesSlice` (`rssFeeds`) | `pages/CategoryPage.tsx` (mục "Nguồn RSS của chuyên mục") |
| `GET /api/search?q=` | `searchArticles()` | `searchArticles` | `articlesSlice` | Tìm kiếm thuần (không lọc thêm) |
| `POST /api/refresh` | `callRefresh()` trong `api/refreshQueue.ts` | `refreshArticles` | `articlesSlice` | Gọi gián tiếp qua `api/refreshQueue.ts` khi request GET lỗi |
| `POST /api/auth/password-reset/request` | `requestPasswordResetCode()` | `sendResetCode` | `authSlice` | `components/common/AuthModal.tsx` |
| `POST /api/auth/password-reset/verify` | `verifyPasswordResetCode()` | `submitResetPassword` | `authSlice` | `components/common/AuthModal.tsx` |

### Quy tắc bắt buộc khi thêm endpoint mới

1. Thêm hàm gọi vào `client/src/api/endpoints.ts` — không gọi `http` trực tiếp trong component.
2. Thêm type phản hồi vào `client/src/types/api.ts` (`ApiListResponse<T>`, `ApiItemResponse<T>`).
3. Thêm thunk trong slice tương ứng và khai báo `condition` để không gọi lại khi cache còn hiệu lực.
4. Nếu muốn hiển thị lỗi, dùng `toApiError(error).message` — không tự parse `error.response`.

---

## Chạy song song client + server

### Yêu cầu

- Node.js ≥ 22.12.0, npm ≥ 10.
- Cần Internet để tải RSS và crawl nội dung bài.

### Cài đặt một lần ở thư mục gốc

```bash
npm install
```

Không cần `npm install` riêng trong `client/` hay `server/` — repo dùng npm workspaces.

### Chạy cả hai cùng lúc

```bash
npm run dev
```

Lệnh này chạy song song hai tiến trình:

| Tiến trình | Cổng | Nhiệm vụ |
|---|---|---|
| server | `4000` | Đọc RSS, crawl nội dung, phục vụ `/api/*` |
| client | `5173` | Giao diện React; Vite proxy `/api` → `http://localhost:4000` |

Mở trình duyệt tại <http://localhost:5173>. Không mở trực tiếp `http://localhost:4000`
để xem giao diện — cổng đó chỉ phục vụ API (trừ bản production đã build).

### Chạy riêng từng phần

```bash
npm run dev:server   # chỉ server :4000
npm run dev:client   # chỉ client :5173
```

Chạy riêng hữu ích khi một bên đang sửa mà bên kia cần giữ nguyên, ví dụ server đang
re-crawl nội dung (cất 30 bài mới nhất) mà vẫn muốn sửa giao diện.

### Kiểm tra server đã sẵn sàng

```bash
curl http://localhost:4000/api/health
```

Server chạy được khi `status` là `ok` và `articleCount` khác `0` (số bài đã nạp từ
snapshot `server/data/snapshot.json` hoặc từ lượt refresh đầu tiên).

### Thứ tự khởi động đề xuất cho nhóm

1. `npm run dev:server` trước — đợi log `[refresh]` báo feed thành công.
2. `npm run dev:client` sau — client cần server sẵn sàng để lần tải đầu tiên có dữ liệu.
3. Nếu client báo "Không kết nối được tới máy chủ", kiểm tra server còn chạy ở cổng `4000`.

### Cấu hình cổng khác

Đổi cổng server thì phải đổi cả `CORS_ORIGINS` và proxy của Vite:

```bash
PORT=5000 CORS_ORIGINS=http://localhost:5173 npm run dev:server
```

```bash
VITE_API_BASE_URL=http://localhost:5000/api npm run dev:client
```

### Lệnh kiểm tra trước khi commit

```bash
npm run typecheck   # kiểu TypeScript cho cả client và server
npm run lint        # oxlint
npm test            # vitest
```

Cả ba lệnh phải qua trước khi tạo PR.

---

## Ghi chú khi báo lỗi

Mọi response có header `X-Request-Id`. Khi báo lỗi, gửi kèm mã này để đối chiếu với
log server. Server ghi log theo format
`[request] <requestId> <method> <path> -> <status> (<thời gian>ms)`
(xem `server/src/middlewares/request-context.ts`).

Client hiển thị mã trong thông báo lỗi: `Không lấy được nội dung (Mã yêu cầu: req-abc-123)`.
Log phía client ghi kèm `X-Request-Id` tương ứng:

```text
[api] GET /api/articles/a1/content thất bại (502) — X-Request-Id: req-abc-123
```
