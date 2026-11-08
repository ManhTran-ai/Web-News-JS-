# Tin tức 24h — Website tin tức tổng hợp từ RSS

Đồ án học tập: website tin tức 24h với dữ liệu **thật** lấy từ RSS của các báo uy tín
(VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet). Toàn bộ nội dung bài viết được
**hiển thị ngay trên trang của mình**, không chuyển hướng sang trang báo.

![Trang chủ](./docs/images/home.png)

<!-- TODO(Frontend Core): chụp ảnh màn hình thật sau khi dựng trang chủ ở tuần 2 -->

## 0. Trạng thái hiện tại

> **Ngày 1/11/2026 — Tuần 1.** Repo hiện chứa **phần setup workspace** để cả 3 thành viên
> chạy được dự án ngay: monorepo npm workspaces, server RSS + REST API, data layer của
> client (types / api / store / hooks), cây route React Router với `Outlet` + layout route +
> index route, component nền tảng và tài liệu API.
>
> **Các trang giao diện hiện là placeholder** kèm `TODO` ghi rõ phần việc thuộc về ai.
> Xem [Phân vùng sở hữu](#8-quy-trình-git-và-phân-vùng-sở-hữu) và
> [Lộ trình 4 tuần](#9-lộ-trình-4-tuần).

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

## 8. Quy trình Git và phân vùng sở hữu

Nhánh: `main` ← `develop` ← `feature/<tên-ngắn>`. Mỗi tính năng một PR, ít nhất một người review.
Tiền tố commit: `feat:`, `fix:`, `chore:`, `docs:`.

| Người | Phạm vi sở hữu |
|---|---|
| A — Lead/Backend | `server/**`, `package.json` gốc, `docs/API.md`; phối hợp slice `categoriesSlice` / `articleContentSlice` |
| B — Frontend Core | `client/src/router.tsx`, `layouts/**`, `pages/**`, `store/**`, `api/**` |
| C — Frontend Feature/UI | `client/src/components/**`, `hooks/**`, `styles/**`; tìm kiếm, bookmark, dark mode |

Chỉ A sửa `package.json` và lockfile ở gốc. Sửa file của người khác thì nhắn trước hoặc tách PR nhỏ.

### Quy tắc giảm xung đột

| Vấn đề | Cách xử lý |
|---|---|
| `package-lock.json` ở gốc | Chỉ A được commit lockfile. Thành viên khác khai báo dependency mới trong PR và ghi rõ trong mô tả, A sẽ cài và commit lock. |
| `client/src/styles/_variables.scss`, `_custom.scss` | Mỗi người tạo partial riêng (ví dụ `_search.scss`) và import vào `main.scss`; chỉ C gộp vào file chung. |
| `client/src/lib/constants.ts` chứa `CATEGORY_FALLBACK` | Trùng nội dung với `server/src/config/categories.ts`. Nguồn sự thật là server — nếu danh mục lệch, A sửa server trước rồi C cập nhật lại client. |
| Thêm route mới | B sở hữu `router.tsx`. C tạo component trong `components/` rồi báo B để mount. |
| Thêm component mới | C sở hữu `components/**`. B cần component thì báo C. |

## 9. Lộ trình 4 tuần

Bắt đầu 1/11/2026, kết thúc 27/11/2026.

| Tuần | Thời gian | Người A — Lead/Backend | Người B — Frontend Core | Người C — Frontend Feature/UI |
|---|---|---|---|---|
| 1 | 1/11 – 7/11 | Setup server + API (đã xong) | Setup client + route (đã xong) | Setup client + route (đã xong) |
| 2 | 8/11 – 14/11 | Thêm nguồn RSS, `/api/articles/:id/related` | Trang chủ: carousel nổi bật, lưới tin mới, khối theo chuyên mục | Trang chuyên mục + index route, bộ lọc theo nguồn |
| 3 | 15/11 – 21/11 | Chốt contract `ArticleContent`, prefetch nội dung | Trang chi tiết bài: bố cục đọc báo, skeleton, tin liên quan | Tìm kiếm (debounce, phân trang, highlight), trang `/da-luu` |
| 4 | 22/11 – 27/11 | Ổn định server, tối ưu prefetch | Dark mode, responsive 375/768/1200, tinh chỉnh trang chủ | Bookmark nút lưu trên card, hoàn thiện UX tìm kiếm |

Mỗi tuần: pull `main`, làm việc trên nhánh `feature/<tên>`, mở PR, có ít nhất một người review.

## 9. Vì sao không gọi RSS trực tiếp từ React

1. **CORS** — trình duyệt chặn `fetch` từ `vnexpress.net` sang `localhost:5173`. Chỉ server mới
   tải được feed mà không cần cấu hình CORS ở phía báo.
2. **Chuẩn hoá** — 5 báo có 5 định dạng RSS khác nhau (ngày tháng, ảnh, tóm tắt). Chuẩn hoá một
   lần ở server giúp client chỉ làm việc với một kiểu dữ liệu duy nhất.
3. **Cache và bảo vệ báo** — server gom nhiều người dùng thành một lần tải duy nhất, cache trong
   RAM, prefetch có giới hạn tốc độ. 1000 người dùng không tạo 1000 lần gọi tới báo.
4. **CORS chỉ là một phần** — nếu báo đổi định dạng feed, chỉ server cần sửa.

## 10. Vì sao vẫn đúng yêu cầu "không dùng database"

- Kho bài nằm trong `Map` của process Node (`services/article.store.ts`), tự động dọn theo
  `RETENTION_HOURS` và `MAX_ARTICLES`.
- `server/data/snapshot.json` **chỉ là bản dự phòng**: nếu nguồn RSS sập lúc khởi động thì
  server vẫn có dữ liệu cũ để hiển thị. Nó được `gitignore` và **không phải kho dữ liệu** —
  không có truy vấn, không có chỉ mục, không có ghi/xoá có chủ đích.
- Ở client, dữ liệu tồn tại trong Redux Toolkit (RAM) và `localStorage` chỉ cho danh sách bài đã lưu.

## 11. Bản quyền và cách giảm tải lên báo

Nội dung bài viết và ảnh **thuộc sở hữu của các báo gốc**. Dự án chỉ dùng cho mục đích học tập.
Mỗi bài trên trang đều hiển thị rõ nguồn, thời gian đăng và link bài gốc ở cuối bài.

Cách dự án giảm tải lên báo:

- Cache nội dung trong RAM với TTL 6 giờ — cùng một bài không bao giờ bị tải hai lần cùng lúc.
- Prefetch tối đa 3 request đồng thời, nghỉ 400ms giữa các request.
- Chỉ tải khi có người đọc thật (on-demand) ngoài phần prefetch định kỳ.
- Gửi `User-Agent` mô tả rõ để báo có thể nhận diện, không giả danh trình duyệt.
- Không có endpoint nào nhận URL tuỳ ý từ người dùng — không thể dùng server làm công cụ crawl
  bất kỳ trang nào.

## 12. Kiến trúc theo yêu cầu giảng viên

### Cây route — Outlet, index route, layout route

Định nghĩa tại `client/src/router.tsx`:

```
"/"                        element: RootLayout        ← LAYOUT ROUTE: khung chung
 ├─ index                      HomePage               ← INDEX ROUTE của "/"
 ├─ "chuyen-muc"  element: CategoryLayout          ← LAYOUT ROUTE lồng nhau
 │    ├─ index                 CategoryIndexPage     ← INDEX ROUTE của "chuyen-muc"
 │    └─ ":slug"               CategoryPage
 ├─ "bai-viet/:id"             ArticleDetailPage
 ├─ "tim-kiem"                 SearchPage
 ├─ "da-luu"                   SavedPage
 └─ "*"                        NotFoundPage
```

- **Layout route** — `RootLayout` (`client/src/layouts/RootLayout.tsx`) là route cha của toàn bộ.
  Nó chứa Navbar, `<Outlet/>`, Footer và `ScrollRestoration`. `CategoryLayout`
  (`client/src/layouts/CategoryLayout.tsx`) là layout route lồng: cột danh sách chuyên mục
  bên trái + `<Outlet/>` bên phải. Cả hai đều có **đúng một** `<Outlet/>`.
- **Index route** — `HomePage` là index route của `/`: khi vào `/` mà không chọn route con nào thì
  nội dung mặc định của `/` hiển thị. `CategoryIndexPage` là index route của `chuyen-muc`:
  vào `/chuyen-muc` sẽ thấy tổng quan tất cả chuyên mục, vào `/chuyen-muc/the-thao` sẽ thấy
  danh sách bài thể thao.
- **Outlet** — `ArticleDetailPage`, `SearchPage`, `SavedPage`, `NotFoundPage` đều được render
  vào `<Outlet/>` của `RootLayout`. Navbar và Footer chỉ nằm trong `RootLayout`, không lặp lại
  trong từng trang.

### Luồng Redux

```
Component ──dispatch──► thunk (store/slices/*.ts)
                            │
                            ▼
                    api/endpoints.ts ──► axios (api/http.ts)
                            │
                            ▼
                    server /api/*
                            │
                            ▼
              extraReducers cập nhật state ──► selector ──► useAppSelector
```

Bốn slice trong `client/src/store/slices/`:

| Slice | Nội dung |
|---|---|
| `categoriesSlice` | Danh mục bài báo: `{ items, status, error }` |
| `articlesSlice` | Entity theo `id` + `lists` theo khoá (`latest`, `featured`, `category:<slug>`, `search:<q>`), mỗi khoá có `{ ids, status, error, meta }` |
| `articleContentSlice` | `byId[id] = { status, data?, error? }`; đã có `data` thì thunk không gọi lại |
| `bookmarksSlice` | Danh sách bài đã lưu, đồng bộ `localStorage` khoá `news24h:bookmarks` |

Component chỉ dùng `useAppDispatch` / `useAppSelector` có kiểu (`client/src/store/hooks.ts`).
Thunk gọi hàm trong `api/endpoints.ts`, không gọi axios trực tiếp.

### Vì sao crawl ở server

- Trình duyệt bị CORS nên không lấy được nội dung trang báo → server là nơi duy nhất có thể tải.
- Server **crawl/batch**: sau mỗi đợt refresh RSS, prefetch trước 30 bài mới nhất
  (`services/content.prefetch.ts`), tối đa 3 request đồng thời, nghỉ giữa các request.
- Cùng một bài không bao giờ bị tải hai lần cùng lúc: các request đang chạy cho cùng một `id`
  được gộp lại (`inflight` map trong `services/content.service.ts`).
- Kết quả được làm sạch bằng `sanitize-html` với allowlist, bỏ `script`/`iframe`/`onerror`,
  ép `rel="noopener noreferrer"`, đổi URL tương đối thành tuyệt đối, đổi ảnh lazy (`data-src`)
  thành `src`.

### Xác nhận phạm vi

- **Không có trang/route quản trị**: cây route ở mục trên không có route nào cho admin,
  không có màn hình đăng nhập quản trị, không có API quản lý nội dung.
- **Không làm browser extension**: đây là website phục vụ nhiều người dùng, chạy trên
  `localhost:5173` (dev) hoặc do server phục vụ ở production.
- **Dữ liệu thật**: không có fixture hay dữ liệu bịa trong code; mọi bài đến từ RSS của các
  báo và được kiểm chứng bằng `npm run verify:feeds` / `npm run verify:content`.

### Phần còn lại do nhóm tự làm

Cây route, luồng Redux và API đã dựng xong trong tuần 1. Những phần sau **chưa làm** và là
việc của các thành viên trong lộ trình 4 tuần:

- Giao diện các trang (carousel, lưới tin, bố cục đọc báo) — hiện là placeholder kèm `TODO`.
- Dark mode, phân trang, bộ lọc theo nguồn, khối tin liên quan, bookmark trên card.
