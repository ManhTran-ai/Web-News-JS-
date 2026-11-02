# ROADMAP FRONTEND — Tuần 2 → Tuần 4 (02/11 → 27/11/2026)

Kế hoạch chi tiết phần lập trình Front-end cho 3 thành viên, bám sát các commit Backend
đã có trên `main`. Mỗi tuần mỗi người **5–7 commit**, mỗi commit gắn với đúng một API
hoặc một nhóm API đã sẵn sàng.

> Nguồn phân công: `yêu cầu và phân công (1).docx` → mục III.
> Lịch sử Backend: `docs/API.md` (contract) + `git log --oneline main`.

---

## 1. Bối cảnh: Backend đã có gì

| Tuần | Ngày | Commit backend | Thay đổi | Frontend nào bám theo |
|---|---|---|---|---|
| T2 | 02/11 | `60ebb2d` | ETag + `Cache-Control` cho endpoint danh sách | Mạnh #1 (http.ts gửi `If-None-Match`, xử lý 304) |
| T2 | 02/11 | `24abfb1` | Lọc `since` / `until` cho `/api/articles` | Mạnh #2 (endpoints.ts) |
| T2 | 03/11 | `9f97f73` | Mở rộng RSS: thêm chuyên mục **sức khỏe**, **đời sống** | Tài #6 (HomePage hiện 13 chuyên mục) |
| T2 | 03/11 | `df3949d` | Xếp hạng `score` khi tìm kiếm | Mạnh #2 tuần 3 (badge "liên quan cao") |
| T2 | 04/11 | `b082838` | Design tokens (`docs/DESIGN.md`) | Tài #1 tuần 2 |
| T2 | 04/11 | `a1e84dc` | Component nền tảng + cơ chế theme sáng/tối (`uiSlice`) | Tài #1–#2 tuần 2, Tài #2 tuần 3 |
| T2 | 05/11 | `f7b8f4e` | `POST /api/refresh` (chống chạy chồng, trả 429 `REFRESH_IN_PROGRESS`) | Mạnh #2 tuần 4 (hàng đợi + TTL) |
| T2 | 07/11 | `46a0f16` | `GET /api/articles/rss.xml` | Mạnh #1 tuần 3 |
| T3 | 12/11 | `c02fee6` | Hồ sơ `Comment` + `User` chính thức trong `server/src/types/article.ts` | Ngân #1, #4 tuần 3 |
| T3 | 13/11 | `5427ca9` | `sourcesSlice` (client) | Mạnh #4 tuần 2 (hoàn thiện) |
| T3 | 14/11 | `9899836` | `authSlice` + `interactionSlice` (client) | Ngân #1, #3 tuần 3; Tài #2 tuần 3 |
| T3 | 15/11 | `fad61d1` | Client gọi `/api/articles/rss.xml` + `/api/articles/:id/related` | Mạnh #1 tuần 3, Ngân #4 tuần 3 |
| T4 | 16/11 | `f3c1179` | Header `X-Request-Id` cho **mọi** response | Mạnh #5 tuần 4 |
| T4 | 18/11 | `c8021ad` | Prefetch nội dung song song → `/content` trả nhanh hơn | Mạnh #1 tuần 4 |
| T4 | 20/11 | `a92691d` | API contract chốt + hướng dẫn chạy | Mạnh #6 tuần 4 |
| T4 | 23/11 | `45d2a30` | Test integration cho endpoint mới | Mạnh #5 tuần 4 |
| T4 | 25/11 | `e1ba598` | Hướng dẫn phát hành + checklist bàn giao | Mạnh #6, Tài #5, Ngân #6 tuần 4 |
| T4 | 27/11 | `449accf` | Chốt phiên bản 1.0 backend | — |

### Hai ràng buộc kỹ thuật phải nhớ

1. **`GET /api/articles/:id/content` chỉ cho phép 30 request/phút.** Mọi endpoint khác là
   300 request/phút. Đây là lý do `articleContentSlice` phải cache theo `id` — bài đã mở đọc
   một lần thì lần sau lấy từ Redux, không gọi API.
2. **`POST /api/refresh` trả 429 `REFRESH_IN_PROGRESS`** nếu đang có phiên làm mới chạy.
   Không được gọi thẳng từ component; phải qua một lớp hàng đợi có TTL.

---

## 2. Quy trình làm việc

```bash
# Đầu tuần: lấy code mới nhất (đã có backend của tuần đó)
git clone https://github.com/ManhTran-ai/Web-News-JS-.git
cd Web-News-JS-
git checkout -b feature/<tên-của-mình>-week2

# Cuối tuần: chạy kiểm tra trước khi gửi review
npm install
npm run typecheck
npm test

git push -u origin feature/<tên-của-mình>-week2
```

- Mỗi người một nhánh riêng, **không push trực tiếp vào `main`**.
- Mạnh (chủ repo) review rồi merge vào `main` cuối tuần.
- Quy ước commit message: `<type>(<scope>): <mô tả>` với
  `feat` / `fix` / `style` / `perf` / `test` / `docs` / `refactor`.
- Ngày trong commit message phản ánh ngày thực hiện việc đó.

### Chủ sở hữu các file dùng chung

File nào có nhiều người đụng thì giao một người giữ, người khác báo trước khi sửa:

| File | Người giữ | Lý do |
|---|---|---|
| `client/src/api/endpoints.ts` | Mạnh | Cả 3 người đều gọi API |
| `client/src/api/http.ts` | Mạnh | Lớp trung tâm xử lý lỗi / ETag |
| `client/src/types/article.ts` | Mạnh | Kiểu dữ liệu dùng chung |
| `client/src/store/index.ts` | Mạnh | Khai báo reducer |
| `client/src/styles/*.scss` | Tài | Hệ thống theme |
| `client/src/components/article/ArticleCard.tsx` | Tài | Ngân dùng lại trong SavedPage |

---

## 3. TUẦN 2 — 02/11 → 08/11 — "Nền tảng & kết nối API"

### 🔵 MẠNH — Redux Core, Luồng API, Trang Chuyên Mục & Tìm Kiếm (7 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(client): api/http.ts hoan thiện - xu ly ApiError + ETag 304` | Tự lưu ETag theo URL, gửi `If-None-Match`, khi server trả 304 thì trả cache cũ không re-render | `api/http.ts` |
| 2 | `feat(client): api/endpoints.ts bo sung tham so since/until va filter` | Thêm `getArticles({ category, source, q, since, until, page, limit })` và `getRSS(category, limit)` | `api/endpoints.ts` |
| 3 | `feat(client): articlesSlice - entity adapter + cache theo key` | `createEntityAdapter` + map cache key `latest` / `featured` / `category:thoi-su` / `search:viet-nam`, lưu `lastFetched` để không gọi lại trong 60s | `store/slices/articlesSlice.ts` |
| 4 | `feat(client): categoriesSlice + sourcesSlice - goi 1 lan khi khoi dong` | Fetch một lần lúc khởi động, có `selectCategoryBySlug`, `selectSourceById` memo hóa | `store/slices/categoriesSlice.ts`, `store/slices/sourcesSlice.ts` |
| 5 | `feat(client): hooks useListArticles/useDebounce/usePolling` | `useListArticles(key, params)` trả `{ items, meta, status }`; `useDebounce` 400ms; `usePolling` 60s cho latest | `hooks/*.ts` |
| 6 | `feat(client): CategoryIndexPage - luoi chuyen muc + bai moi dai dien` | Grid Bootstrap, mỗi ô có `count` và bài mới nhất, ảnh lỗi → placeholder | `pages/CategoryIndexPage.tsx` |
| 7 | `feat(client): CategoryPage + SearchPage - loc, phan trang, tim khong dau` | Lọc theo 5 nguồn tin, phân trang theo `meta.page` / `meta.totalPages`, tìm kiếm `useDebounce` 400ms, hiển thị `meta.total` | `pages/CategoryPage.tsx`, `pages/SearchPage.tsx` |

> Commit #3 là câu trả lời cho câu hỏi của giảng viên *"Dùng Redux như thế nào để tránh gọi lại
> API và tốn bộ nhớ?"*. Nên nêu rõ cơ chế trong commit message.

### 🟢 TÀI — Layout, UI/UX, Dark Mode, Trang Chủ (6 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `style(client): hoan tat design tokens + bien theo dark mode` | Hoàn thiện `_variables.scss` (màu light/dark), `_custom.scss`, map Bootstrap 5, font Be Vietnam Pro | `styles/*.scss` |
| 2 | `feat(layout): RootLayout - navbar + breaking ticker + outlet + footer` | Khung gốc, `<Outlet/>`, `ScrollRestoration`, `BreakingTicker` chạy marquee | `layouts/RootLayout.tsx` |
| 3 | `feat(layout): CategoryLayout - sidebar sticky chuyen muc` | Sidebar trái sticky danh sách chuyên mục, vùng nội dung `<Outlet/>` bên phải | `layouts/CategoryLayout.tsx` |
| 4 | `feat(ui): AppNavbar + AppFooter + o tim kiem nhanh` | Navbar responsive, ô tìm kiếm Enter → `/tim-kiem?q=`, nút Dark Mode, nút mở AuthModal (chờ Ngân) | `components/layout/*.tsx` |
| 5 | `feat(ui): ArticleCard - 3 bien the + ArticleMeta + SafeImage` | Thẻ lớn / ngang / dọc, thời gian tương đối ("10 phút trước"), nhãn "Mới", ảnh lỗi → SVG placeholder | `components/article/{ArticleCard,ArticleMeta,SafeImage}.tsx` |
| 6 | `feat(pages): HomePage - hero featured + timeline latest + khu chuyen muc` | 1 bài lớn giữa + list bên cạnh, timeline 24h qua dùng `usePolling`, các khu vực chuyên mục; kèm `NotFoundPage` | `pages/HomePage.tsx`, `pages/NotFoundPage.tsx` |

### 🟣 NGÂN — Đọc bài, Cache nội dung, Bookmark, Auth (5 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(client): articleContentSlice - cache HTML theo id + kiem tra ton tai` | `contentsById: Record<string, ArticleContent>`, thunk **kiểm tra cache trước khi gọi API** để không vượt giới hạn 30 req/phút | `store/slices/articleContentSlice.ts` |
| 2 | `feat(client): bookmarksSlice + lib/storage - luu bai + lich su da doc` | Bookmark đồng bộ localStorage, `readingHistory` tự thêm khi mở bài, giới hạn 50 mục gần nhất | `store/slices/bookmarksSlice.ts`, `lib/storage.ts` |
| 3 | `feat(client): authSlice - dang ky / dang nhap / dang xuat` | `currentUser`, `isAuthenticated`, ghi localStorage, validate form | `store/slices/authSlice.ts` |
| 4 | `feat(client): ArticleDetailPage + ArticleBody - doc bai truc tiep tren web` | Lấy `:id`, nội dung từ cache, render qua `DOMPurify.sanitize`, xử lý 502 `CONTENT_UNAVAILABLE` → hiện khung thông báo kèm `summary` | `pages/ArticleDetailPage.tsx`, `components/article/ArticleBody.tsx` |
| 5 | `feat(client): SavedPage - 2 tab da luu + lich su da doc` | Tab "Bài đã lưu" / "Lịch sử đã đọc", dùng `ArticleCard`, bỏ lưu từng bài, xóa toàn bộ lịch sử | `pages/SavedPage.tsx` |

---

## 4. TUẦN 3 — 09/11 → 15/11 — "Tương tác người dùng"

### 🔵 MẠNH (6 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(client): articlesSlice bo sung fetch related + rss.xml` | `getRelated(id, limit)` → cache `related:<id>`; `getRSS(category, limit)` | `store/slices/articlesSlice.ts`, `api/endpoints.ts` |
| 2 | `feat(client): articlesSlice - tu cham diem relevance + hien thi score` | Đọc `score` từ response search, hiển thị badge "liên quan cao" | `store/slices/articlesSlice.ts` |
| 3 | `feat(client): hooks usePolling - tu lam moi theo coche so lai` | Backoff khi lỗi, dừng khi tab ẩn (`visibilitychange`), reset khi focus | `hooks/usePolling.ts` |
| 4 | `feat(client): articlesSlice - debounce + huy request cu + giu lai tu khoa` | Hủy request cũ khi gõ tiếp, giữ `query` để chia sẻ được URL | `store/slices/articlesSlice.ts` |
| 5 | `feat(client): api/http - hien thi X-Request-Id khi loi de debug` | Đọc header `X-Request-Id` trong response lỗi, log kèm để đối chiếu log server | `api/http.ts` |
| 6 | `feat(client): them unit test cho articlesSlice + hooks` | Test cache không gọi lại API, test debounce, test phân trang | `store/slices/articlesSlice.test.ts` |

### 🟢 TÀI (5 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(ui): SectionHeader + BreakingTicker + LoadMoreButton` | Section header có tiêu đề + "Xem thêm", ticker marquee, nút load-more kèm skeleton | `components/common/*.tsx` |
| 2 | `feat(ui): ThemeToggle + uiSlice - luu lua chon sang toi` | Toggle ghi vào `uiSlice` + localStorage, đọc `prefers-color-scheme` lần đầu | `components/common/ThemeToggle.tsx` |
| 3 | `feat(ui): Loading skeleton + ErrorState + EmptyState chuan` | Skeleton shimmer, error có nút "Thử lại", empty có icon + gợi ý | `components/common/*.tsx` |
| 4 | `feat(pages): HomePage - responsive + khu chuyen muc + featured carousel` | Responsive mobile/tablet, carousel tin nổi bật, mảng chuyên mục đa dạng | `pages/HomePage.tsx` |
| 5 | `feat(router): router.tsx + ScrollRestoration + lazy load route` | `React.lazy` từng trang, `ScrollRestoration`, xử lý 404 | `router.tsx`, `layouts/RootLayout.tsx` |

### 🟣 NGÂN (7 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(client): interactionSlice - luu comment theo articleId + lich su doc` | Dùng slice có sẵn: `comments: Record<string, Comment[]>`, `readingHistory`; thêm / xoá / thả tim | `store/slices/interactionSlice.ts` |
| 2 | `feat(client): AuthModal - chuyen doi dang nhap / dang ky + validate form` | Modal 2 tab, validate email/mật khẩu, báo lỗi theo field, quản lý focus | `components/common/AuthModal.tsx` *(tạo mới)* |
| 3 | `feat(client): CommentSection - khoa khi chua dang nhap` | Chưa đăng nhập → hiện "Vui lòng đăng nhập để bình luận" kèm nút mở AuthModal | `components/article/CommentSection.tsx` *(tạo mới)* |
| 4 | `feat(client): CommentSection - switch an danh / ten that` | Tắt → hiện `user.fullName` + `avatar`; Bật → hiện "Người dùng ẩn danh" nhưng vẫn gắn `userId` ngầm để chủ xoá được bình luận mình | `components/article/CommentSection.tsx` *(tạo mới)* |
| 5 | `feat(client): ReaderToolbar - A+/A- + bookmark + doc bang giong noi` | Tăng/giảm cỡ chữ, nút lưu bài, `window.speechSynthesis` đọc tiếng Việt kèm nút dừng | `components/article/ReaderToolbar.tsx` *(tạo mới)* |
| 6 | `feat(client): ArticleDetailPage - tien ich doc + them vao lich su` | Gắn ReaderToolbar đầu bài, tự `recordRead` khi mở bài, vùng bình luận ở cuối trang | `pages/ArticleDetailPage.tsx` |
| 7 | `feat(client): SavedPage - loc theo chuyen muc + xoa lich su` | Lọc lịch sử theo khoảng thời gian, xoá 1 mục / xoá tất cả, empty state | `pages/SavedPage.tsx` |

---

## 5. TUẦN 4 — 16/11 → 27/11 — "Hoàn thiện, tối ưu & bàn giao"

### 🔵 MẠNH (6 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `perf(client): articlesSlice - giu cache 5 phut + prefetch trang ke tiep` | TTL cache 5 phút, prefetch `page+1` khi cuộn gần cuối → khớp prefetch phía server | `store/slices/articlesSlice.ts` |
| 2 | `feat(client): http - hang doi goi refresh de tranh doi mau` | Khi request hết hạn, gọi `POST /api/refresh` một lần thay vì retry dồn; xử lý 429 | `api/http.ts`, `api/endpoints.ts` |
| 3 | `feat(client): xu ly 304 tu cache khi offline` | Mất mạng mà server trả 304 → trả cache cũ | `api/http.ts` |
| 4 | `refactor(client): tach api client + tao types tuong tac API` | Chuẩn hoá `ApiError`, type response của `/related`, `/rss.xml`, `/refresh` | `types/article.ts`, `api/*` |
| 5 | `test(client): test integration cho 3 trang lon` | Render CategoryIndex / Category / Search với MSW mock | `pages/*.test.tsx` |
| 6 | `docs(client): comment API contract + huong dan chay cho nhom` | Ghi rõ endpoint nào dùng ở đâu, cách chạy song song client + server | `docs/API.md`, `README.md` |

### 🟢 TÀI (5 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `perf(ui): tach chi tiet + lazy load component nang` | `React.lazy` cho `AuthModal`, `CommentSection`, `ReaderToolbar` → bundle nhẹ hơn | `pages/*.tsx`, `components/*` |
| 2 | `style(ui): hoan tat responsive mobile + tablet` | Breakpoint Bootstrap: navbar gọn, grid 1–2 cột, sidebar thành drawer | `styles/*.scss` |
| 3 | `feat(ui): them trang "Tin noi bat" + tim kiem nhanh tren navbar` | Trang `/noi-bat` dùng `/featured`, autocomplete từ `useDebounce` | `pages/*.tsx`, `components/layout/AppNavbar.tsx` |
| 4 | `a11y(ui): them aria-label + focus trap + skip link` | Skip-to-content, aria cho icon, focus trap trong modal | `components/**/*.tsx` |
| 5 | `docs(client): viet lai README muc 1-7 + huong dan design system` | Tài liệu bàn giao phần UI cho nhóm | `README.md`, `docs/DESIGN.md` |

### 🟣 NGÂN (6 commit)

| # | Commit | Nội dung | File |
|---|---|---|---|
| 1 | `feat(client): comment - thong bao loi + khoi phuc binh luan` | Toast lỗi, undo xoá bình luận, giữ bình luận cũ khi reload | `store/slices/interactionSlice.ts` |
| 2 | `feat(client): lich su doc - nhom theo ngay + xoa theo khoang` | Nhóm lịch sử theo ngày, xoá "hôm nay" / "7 ngày" / "tất cả" | `pages/SavedPage.tsx` |
| 3 | `feat(client): doc bang giong noi - dieu khien van toc + xu ly loi` | Chọn voice tiếng Việt, xử lý trình duyệt không hỗ trợ, đọc / dừng / tạm dừng | `components/article/ReaderToolbar.tsx` |
| 4 | `feat(client): theo doi hanh dong doc + hien thi phan tram` | Đếm số bài đã đọc, thanh "Bạn đã đọc X bài hôm nay" | `pages/SavedPage.tsx` |
| 5 | `test(client): unit test cho interactionSlice + bookmarksSlice` | Test thêm/xoá bình luận, ẩn danh vẫn gắn `userId`, lịch sử không trùng | `store/slices/interactionSlice.test.ts` |
| 6 | `docs(client): huong dan tinh nang nguoi dung + checklist doi chieu yeu cau` | Đối chiếu từng yêu cầu 5–6 của giảng viên với file đã làm | `docs/CODE_GUIDE.md` |

---

## 6. Tổng hợp khối lượng

| | Tuần 2 | Tuần 3 | Tuần 4 | Tổng |
|---|---|---|---|---|
| **Mạnh** | 7 | 6 | 6 | **19** |
| **Tài** | 6 | 5 | 5 | **16** |
| **Ngân** | 5 | 7 | 6 | **18** |
| **Tổng** | 18 | 18 | 17 | **53** |

---

## 7. Rủi ro đã biết

| # | Rủi ro | Xử lý |
|---|---|---|
| 1 | Doc ghi `commentsSlice.ts` riêng nhưng commit tuần 3 đã gộp comment vào `interactionSlice.ts` | Dùng `interactionSlice.ts` sẵn có, **không** tách thêm file — tránh hai nơi quản lý cùng một state |
| 2 | `/api/refresh` giới hạn, 3 người gọi đồng thời sẽ nhận 429 | Gom qua một lớp hàng đợi có TTL (Mạnh #2 tuần 4), không gọi trực tiếp trong component |
| 3 | `/content` giới hạn 30 req/phút | Bắt buộc cache `contentsById` — Ngân #1 tuần 2 là điểm mấu chốt |
| 4 | `X-Request-Id` chỉ có từ 16/11 nhưng Mạnh dùng ở tuần 3 | Đã chuyển Mạnh #5 tuần 3 xuống tuần 4 (commit #5 tuần 4) |
| 5 | Nhiều người cùng sửa file dùng chung | Mỗi file có một người giữ duy nhất (mục 2) — cần thì báo Mạnh để merge |

---

## 8. Đối chiếu với 6 yêu cầu của giảng viên

| Yêu cầu | Người phụ trách | Commit bảo vệ |
|---|---|---|
| 1, 2, 3 — RSS, nội dung đầy đủ, không cần Extension | Ngân (+ Mạnh) | Ngân #4 (tuần 2), Ngân #1 (tuần 2) |
| 4 — Redux tối ưu bộ nhớ, không gọi lại API | Mạnh | Mạnh #3 (tuần 2), Mạnh #1 (tuần 4) |
| 5, 6 — Đăng nhập, bình luận ẩn danh, tiện ích đọc | Ngân (+ Tài) | Ngân #2–#5 (tuần 3), Ngân #3 (tuần 4) |
| Giao diện báo điện tử, dark mode, trang chủ | Tài | Tài #1–#6 (tuần 2), Tài #4 (tuần 3) |
| Chuyên mục / tìm kiếm / phân trang | Mạnh | Mạnh #6, #7 (tuần 2) |
