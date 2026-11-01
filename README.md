# Tin tức 24h — Website tin tức tổng hợp từ RSS

Đồ án học tập: website tin tức 24h với dữ liệu **thật** lấy từ RSS của các báo uy tín
(VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet). Toàn bộ nội dung bài viết được
**hiển thị ngay trên trang của mình**, không chuyển hướng sang trang báo.

![Trang chủ](./docs/images/home.png)

## 1. Giới thiệu

| Thành phần | Công nghệ |
|---|---|
| `client/` | React 19 + TypeScript + Vite 8 + Bootstrap 5 (SCSS) + Redux Toolkit + React Router 7 |
| `server/` | Node.js 22+ + Express 5 + `rss-parser` + `jsdom` + `@mozilla/readability` + `sanitize-html` |
| Cơ sở dữ liệu | **Không dùng database** — cache trong RAM + snapshot JSON dự phòng |

Điểm khác biệt so với một trang tin bình thường: phần lớn trang tin chỉ đưa **tiêu đề + ảnh +
link**, người dùng phải bấm sang trang báo. Đồ án này **crawl toàn bộ nội dung bài** ở phía
server rồi render ngay trong trang, kèm dòng ghi nguồn và link bài gốc ở cuối bài.

## 2. Kiến trúc

```
                    ┌─────────────────────────────────────────────┐
                    │  RSS chính thống của các báo                 │
                    │  vnexpress.net · tuoitre.vn · thanhnien.vn   │
                    │  dantri.com.vn · vietnamnet.vn               │
                    └───────────────────┬─────────────────────────┘
                                        │ HTTP GET (rss-parser)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SERVER (Node + Express)  :4000                                        │
│                                                                          │
│  jobs/refresh.job ──► services/refresh.service                          │
│        (cron 5 phút)        │                                           │
│                             ▼                                           │
│                    services/feed.service  ── chuẩn hoá Article          │
│                             │                                           │
│                             ▼                                           │
│                    services/article.store (Map trong RAM)               │
│                             │                                           │
│                             ├──► services/content.prefetch (batch 30)   │
│                             │            │                             │
│                             │            ▼                             │
│                             │    services/content.service              │
│                             │      jsdom + Readability → sanitize-html  │
│                             │            │                             │
│                             │            ▼                             │
│                             │    services/cache.service (node-cache)   │
│                             │                                           │
│                             └──► services/snapshot.service (JSON)      │
│                                                                          │
│  routes/index ──► controllers ──► JSON { data, meta }                  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTP /api/*
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT (React + Redux Toolkit)  :5173                                   │
│                                                                          │
│  page ──dispatch(thunk)──► api/endpoints ──► axios ──► server          │
│    │                                                                     │
│    └──useSelector──► slice (articles / categories / articleContent /     │
│                         bookmarks)                                       │
│                                                                          │
│  router.tsx: RootLayout (layout route) ──► Outlet ──► các page         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Nguyên tắc bất biến:** client **không bao giờ** gọi RSS hay trang báo trực tiếp, mọi thứ
đi qua API của server.

## 3. Yêu cầu môi trường

| Thành phần | Yêu cầu |
|---|---|
| Node.js | ≥ 22.12.0 (khuyến nghị 22 LTS trở lên; Vite 8 cần `^20.19.0 \|\| >=22.12.0`) |
| npm | ≥ 10 |
| Trình duyệt | Bất kỳ trình duyệt hiện đại nào |
| Mạng | Cần kết nối Internet để tải RSS và crawl nội dung |

Biến môi trường của server (xem `server/.env.example`, tất cả đều tuỳ chọn):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `4000` | Cổng server |
| `CORS_ORIGINS` | `http://localhost:5173` | Danh sách origin được phép (phân tách bằng dấu phẩy) |
| `REFRESH_CRON` | `*/5 * * * *` | Lịch làm mới RSS |
| `FEED_TIMEOUT_MS` | `10000` | Timeout tải feed |
| `RETENTION_HOURS` | `72` | Thời gian giữ bài trong RAM |
| `MAX_ARTICLES` | `1500` | Số bài tối đa trong RAM |
| `CONTENT_TTL_HOURS` | `6` | TTL cache nội dung bài |
| `CONTENT_PREFETCH_COUNT` | `30` | Số bài crawl trước sau mỗi đợt refresh |
| `CONTENT_TIMEOUT_MS` | `15000` | Timeout crawl trang báo |

## 4. Cài đặt và chạy

```bash
npm install          # cài toàn bộ workspace (client + server)
npm run dev          # chạy server :4000 và client :5173 cùng lúc
```

Mở trình duyệt tại <http://localhost:5173>.

Chạy riêng từng phần:

```bash
npm run dev:server   # chỉ server
npm run dev:client   # chỉ client
```

Chạy bản production:

```bash
npm run build        # build server rồi client
npm start            # server :4000 phục vụ cả API và client đã build
```

## 5. Bảng lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm install` | Cài toàn bộ workspace |
| `npm run dev` | Chạy server (:4000) + client (:5173) đồng thời |
| `npm run dev:server` / `npm run dev:client` | Chạy riêng từng phần |
| `npm run build` | Build server rồi client |
| `npm start` | Chạy server bản build (phục vụ cả `client/dist`) |
| `npm run lint` | Chạy oxlint cho cả client và server |
| `npm run typecheck` | Kiểm tra kiểu TypeScript cho cả hai |
| `npm test` | Chạy test (vitest) |
| `npm run verify:feeds` | Kiểm tra từng URL RSS: sống không, số bài, ảnh, ngày mới nhất |
| `npm run verify:content` | Thử crawl nội dung vài bài mỗi nguồn, báo tỷ lệ lấy được |
| `npm run format` | Format bằng prettier |

## 6. Danh sách API

Tất cả endpoint GET, tiền tố `/api`. Xem chi tiết tại [`docs/API.md`](./docs/API.md).

| Endpoint | Mô tả |
|---|---|
| `GET /api/health` | Trạng thái server, số bài, trạng thái từng nguồn |
| `GET /api/categories` | Danh sách chuyên mục kèm số bài |
| `GET /api/sources` | Danh sách nguồn tin kèm trạng thái |
| `GET /api/articles` | Danh sách bài, lọc theo `category`, `source`, `q` |
| `GET /api/articles/latest` | Bài mới nhất |
| `GET /api/articles/featured` | Bài nổi bật (có ảnh, xen kẽ nhiều nguồn) |
| `GET /api/articles/:id` | Chi tiết một bài |
| `GET /api/articles/:id/related` | Bài liên quan (cùng chuyên mục) |
| `GET /api/articles/:id/content` | **Nội dung đầy đủ** của bài (crawl nếu chưa có trong cache) |
| `GET /api/search?q=` | Tìm kiếm, không phân biệt dấu tiếng Việt |

Mã lỗi: `VALIDATION_ERROR` 400 · `NOT_FOUND` 404 · `CONTENT_UNAVAILABLE` 502 · `INTERNAL_ERROR` 500.

## 7. Thêm một nguồn RSS mới

1. Mở `server/src/config/sources.ts`.
2. Thêm một entry vào mảng `SOURCES`:

```ts
{
  id: 'ten-bao',              // khoá duy nhất, dùng trong URL /api/articles?source=
  name: 'Tên Báo Hiển Thị',
  homepage: 'https://tenbao.vn',
  enabled: true,
  domains: ['tenbao.vn'],     // danh sách domain hợp lệ — dùng để chặn SSRF
  contentSelector: '.article-content',  // tuỳ chọn, chỉ điền nếu Readability trích sai
  feeds: [
    { category: 'thoi-su', url: 'https://tenbao.vn/rss/thoi-su.rss' },
    { category: 'tong-hop', url: 'https://tenbao.vn/rss/tin-moi-nhat.rss' },
  ],
}
```

3. `category` phải là một trong các slug chuẩn trong `server/src/config/categories.ts`
   (`thoi-su`, `the-gioi`, `kinh-doanh`, `giai-tri`, `the-thao`, `phap-luat`, `giao-duc`,
   `suc-khoe`, `cong-nghe`, `doi-song`, `du-lich`) hoặc `tong-hop` cho feed tổng hợp.
4. Kiểm tra feed hoạt động: `npm run verify:feeds`.
5. Kiểm tra crawl nội dung: `npm run verify:content`. Nếu một nguồn lấy được nội dung dưới
   2/3 số bài thử, thêm `contentSelector` cho nguồn đó rồi chạy lại.
6. Nếu feed lỗi, đặt `enabled: false` (giữ lại trong file để tham khảo) thay vì xoá.

> Lưu ý: `domains` là **cơ chế chống SSRF**. Server chỉ crawl URL thuộc domain đã khai báo,
> nên bắt buộc phải khai báo đầy đủ cho nguồn mới.
