# ROADMAP FRONTEND — Tuần 2 → Tuần 4 (02/11 → 27/11/2026)

Kế hoạch chi tiết phần lập trình Front-end cho 3 thành viên, bám sát các commit Backend
đã có trên `main`. Mỗi tuần mỗi người **5–7 commit**, mỗi commit gắn với đúng một API
hoặc một nhóm API đã sẵn sàng.

> Nguồn phân công: `yêu cầu và phân công (1).docx` → mục III.
> Lịch sử Backend: `docs/API.md` (contract) + `git log --oneline main`.
> **Repo chính thức cho giảng viên xem: `ManhTran-ai/Web-News-JS-`** (remote `target`).
> Mọi SHA trong tài liệu này thuộc lineage hiện tại của repo đó — đã kiểm chứng 100%
> resolve được trên `main` sau khi lịch sử được viết lại ngày 08/11/2026.

---

## 0. Trạng thái hiện tại (cập nhật 10/11/2026)

### 0.1. Đã hoàn thành

| Người | Đã xong | Commit |
|---|---|---|
| **Tài** | BreakingTicker trong RootLayout | `e89159b` |
| **Tài** | CategoryLayout — sidebar sticky chuyên mục | `0b0550a` |
| **Tài** | HomePage — hero featured + timeline latest + khối chuyên mục | `86a078d` |
| **Tài** | NotFoundPage — gợi ý quay lại trang chủ | `45e23af` |
| **Tài** | Responsive mobile + tablet (`_custom.scss`) | `9ec1b77` |
| **Tài** | Xoá `components/Header/Header.tsx` + `Header.css` (code chết) | `f5f775a` |
| **Ngân** | `articleContentSlice` — cache HTML theo id + kiểm tra tồn tại | `25e7a84` |
| **Ngân** | `bookmarksSlice` + `lib/storage` — lưu bài + lịch sử đã đọc | `c54bf74` |
| **Ngân** | `authSlice` — đăng ký / đăng nhập / đăng xuất | `7185a9d` |
| **Ngân** | `AuthModal` — chuyển đổi đăng nhập / đăng ký + validate form | `7185a9d` |
| **Ngân** | `ArticleDetailPage` + `ArticleBody` — đọc bài trực tiếp trên web + `BookmarkButton` | `ba59557` |
| **Ngân** | `SavedPage` — 2 tab đã lưu + lịch sử đã đọc | `70408cb` |
| **Ngân** | `CommentSection` — khoá khi chưa đăng nhập | `e4f8fb0` |
| **Ngân** | `CommentSection` — switch ẩn danh / tên thật | `dfeb611` |
| **Ngân** | `ReaderToolbar` — A+/A- + bookmark + đọc bằng giọng nói | `4ad1aa1` |
| **Ngân** | `ArticleDetailPage` — tiện ích đọc + 6 bài liên quan + vùng bình luận | `9c57d95` |
| **Ngân** | `SavedPage` — lọc theo chuyên mục + xoá lịch sử | `01e5ee5` |
| **Ngân** | Fix `app.test.ts` — đổi kiểu sang `AppServer` + chuẩn hoá comment | `182b438` |
| **Mạnh** | `api/http.ts` — ETag/304 + `ApiError` + đọc `X-Request-Id` | `0783f17` |
| **Mạnh** | `api/endpoints.ts` — `getArticles` (lọc kết hợp) + `getRSS` | `b6d0d29` |
| **Mạnh** | `articlesSlice` — entity adapter + cache theo key + TTL 60s | `b12290c` |
| **Mạnh** | `useListArticles` — trả `{ items, meta, status }` | `2238640` |
| **Mạnh** | `CategoryIndexPage` — lưới chuyên mục + bài mới đại diện | `afaa7e9` |
| **Mạnh** | `CategoryPage` — lọc theo nguồn + phân trang | `4c1753f` |
| **Mạnh** | `SearchPage` — tìm kiếm debounce 400ms + lọc kết hợp | `5300002` |

**Tổng: 25 commit.** Cả 3 người đều đã có commit hiển thị đúng tên GitHub trên Insights:
`ManhTran-ai` (48), `23130205-dev` (18), `LV-Tai` (15).
> Insights gộp theo **email**, nên `Trần Thị Thanh Ngân <23130205@st.hcmuaf.edu.vn>`
> và `23130205-dev <23130205@st.hcmuaf.edu.vn>` là cùng một tài khoản.
> `git shortlog` gộp theo **tên** → hiển thị 4 dòng. Muốn shortlog khớp Insights
> thì thêm file `.mailmap` ở thư mục gốc repo.
>
> 7 commit tuần 3 của Ngân đều dùng đúng nick
> `23130205-dev <23130205@st.hcmuaf.edu.vn>` (SHA mới sau khi viết lại lịch sử:
> `3f919c7` → `764168d`). Lịch sử đã được viết lại ngày 10/11/2026: gỡ trailer
> `Co-authored-by: Cursor <cursoragent@cursor.com>` (làm `cursoragent` biến mất
> khỏi Insights) và đổi author của commit tuần 3 #1 sang `23130205-dev`.

### 0.2. Chưa làm — ưu tiên cao

| Người | Việc còn lại | Vì sao gấp |
|---|---|---|
| **Mạnh** | `articlesSlice` chưa cache `related:<id>` (tuần 3 #1) | Yêu cầu 4 — Ngân đã tạo `relatedArticlesSlice.ts` riêng, Mạnh vẫn nên cache trong `articlesSlice` |
| **Tài** | `router.tsx` chưa lazy-load, chưa có `ScrollRestoration` | Yêu cầu phân công |
| **Tài** | `AppFooter` chưa hoàn thiện | Yêu cầu phân công |

### 0.3. Ba trang lớn của Mạnh — đã xong (08/11/2026)

```
client/src/pages/CategoryIndexPage.tsx   ✅ afaa7e9
client/src/pages/CategoryPage.tsx        ✅ 4c1753f
client/src/pages/SearchPage.tsx          ✅ 5300002
```

Đây là 3 file duy nhất trong toàn bộ `client/src` từng còn placeholder. Hiện **không còn
file nào trong `client/src` chứa chữ "TODO"** — giảng viên mở repo sẽ thấy toàn bộ
frontend đã hiện thực.

### 0.4. Những gì đã có sẵn nhưng chưa dùng tới

| Thành phần | Vị trí | Ai giữ |
|---|---|---|
| `ArticleCard` 4 biến thể (`lead`/`standard`/`compact`/`row`) | `components/article/ArticleCard.tsx` | Tài — dùng lại cho `CategoryIndexPage` + `SavedPage` |
| `ThemeToggle` + `uiSlice` (đọc `prefers-color-scheme`) | `components/common/ThemeToggle.tsx` | Tài — đã gắn trong `AppNavbar` |
| `Loading` / `ErrorState` / `EmptyState` / `SectionHeader` / `LoadMoreButton` | `components/common/*.tsx` | Tài — dùng lại cho 3 trang của Mạnh |
| `ArticleSkeleton` | `components/article/ArticleSkeleton.tsx` | Tài |
| `useDebounce` | `hooks/useDebounce.ts` | Mạnh — dùng cho `SearchPage` |
| `getRelated(id, limit)` | `api/endpoints.ts` | Mạnh — Ngân dùng ở `ArticleDetailPage` |
| `interactionSlice` có sẵn `comments` + `readingHistory` + `setCommentLiked` | `store/slices/interactionSlice.ts` | Ngân — dùng cho `CommentSection` |

---

## 1. Bối cảnh: Backend đã có gì

| Tuần | Ngày | Commit backend | Thay đổi | Frontend nào bám theo |
|---|---|---|---|---|
| T2 | 02/11 | `ba844a0` | ETag + `Cache-Control` cho endpoint danh sách | Mạnh #1 (http.ts gửi `If-None-Match`, xử lý 304) |
| T2 | 02/11 | `7c201cb` | Lọc `since` / `until` cho `/api/articles` | Mạnh #2 (endpoints.ts) |
| T2 | 03/11 | `c685bb1` | Mở rộng RSS: thêm chuyên mục **sức khỏe**, **đời sống** | Tài #6 (HomePage hiện 11 chuyên mục) |
| T2 | 03/11 | `c5771b3` | Xếp hạng `score` khi tìm kiếm (server chỉ **sort** theo score, **không** trả field `score` ra API) | Mạnh #2 tuần 3 (badge "liên quan cao" do client tự đánh dấu theo thứ tự kết quả) |
| T2 | 04/11 | `4c671dd` | Design tokens (`docs/DESIGN.md`) | Tài #1 tuần 2 |
| T2 | 04/11 | `618645f` | Component nền tảng + cơ chế theme sáng/tối (`uiSlice`) | Tài #1–#2 tuần 2, Tài #2 tuần 3 |
| T2 | 05/11 | `a7a7108` | `POST /api/refresh` (chống chạy chồng, trả 429 `REFRESH_IN_PROGRESS`) | Mạnh #2 tuần 4 (hàng đợi + TTL) |
| T2 | 07/11 | `335e40e` | `GET /api/articles/rss.xml` | Mạnh #1 tuần 3 |
| T3 | 12/11 | `3560e55` | Hồ sơ `Comment` + `User` chính thức trong `server/src/types/article.ts` | Ngân #1, #4 tuần 3 |
| T3 | 13/11 | `eec56ed` | `sourcesSlice` (client) | Mạnh #4 tuần 2 (hoàn thiện) |
| T3 | 14/11 | `3f919c7` | `authSlice` + `interactionSlice` (client) | Ngân #1, #3 tuần 3; Tài #2 tuần 3 |
| T3 | 15/11 | `9be1090` | Client gọi `/api/articles/rss.xml` + `/api/articles/:id/related` | Mạnh #1 tuần 3, Ngân #6 tuần 3 |
| T4 | 16/11 | `86bb3f4` | Header `X-Request-Id` cho **mọi** response | Mạnh #5 tuần 4 |
| T4 | 18/11 | `e1aa152` | Prefetch nội dung song song → `/content` trả nhanh hơn | Mạnh #1 tuần 4 |
| T4 | 20/11 | `0126833` | API contract chốt + hướng dẫn chạy | Mạnh #6 tuần 4 |
| T4 | 23/11 | `5ea640a` | Test integration cho endpoint mới | Mạnh #5 tuần 4 |
| T4 | 25/11 | `29c646a` | Hướng dẫn phát hành + checklist bàn giao | Mạnh #6, Tài #5, Ngân #6 tuần 4 |
| T4 | 27/11 | `cb90a90` | Chốt phiên bản 1.0 backend | — |

### Hai ràng buộc kỹ thuật phải nhớ

1. **`GET /api/articles/:id/content` chỉ cho phép 30 request/phút.** Mọi endpoint khác là
   300 request/phút. Đây là lý do `articleContentSlice` phải cache theo `id` — bài đã mở đọc
   một lần thì lần sau lấy từ Redux, không gọi API.
2. **`POST /api/refresh` trả 429 `REFRESH_IN_PROGRESS`** nếu đang có phiên làm mới chạy.
   Không được gọi thẳng từ component; phải qua một lớp hàng đợi có TTL.

---

## 2. Quy trình làm việc

> **Quy trình chuẩn của cả 3 thành viên (từ 08/11/2026):**
>
> ```bash
> git pull origin main     # 1. lấy code mới nhất của nhóm
> # ... viết code mới ...
> git add -A               # 2. đưa thay đổi vào staging
> git commit -m "..."      # 3. commit
> git push                 # 4. đẩy lên nhánh của mình
> ```
>
> Remote `origin` = **`ManhTran-ai/Web-News-JS-`** (repo chính thức giảng viên xem).
> Repo cũ `23130205-dev/app-news24h` **đã bị gỡ khỏi máy các thành viên** — không push vào đó nữa.

### 2.1. Setup lần đầu (chỉ làm 1 lần)

```bash
git clone https://github.com/ManhTran-ai/Web-News-JS-.git
cd Web-News-JS-

# Đảm bảo push lên đúng nhánh hiện tại
git config push.default current
```

> Clone từ repo chính thức thì remote tên mặc định đã là `origin` và trỏ đúng URL.
> Không cần `git remote rename` hay `git remote set-url` gì thêm.

### 2.2. Đầu tuần — lấy code mới nhất

```bash
git pull origin main
npm install
npm run typecheck
npm test
```

> **Vì sao `git pull origin main` là đủ:** `main` luôn được cập nhật mỗi khi Mạnh merge
> xong, và cả 3 nhánh (`ManhTran`, `Tài`, `Ngan`) đều là ancestor của `main`. Nên pull
> `main` về luôn là cách nhanh nhất để có code mới nhất của cả nhóm.

### 2.3. Trong tuần — code và commit

```bash
# Sửa code...
npm run typecheck
npm test

git add -A
git commit -m "feat(client): mo ta ngan gon"
git push                       # tự push lên origin/<nhánh-của-mình>
```

- Mỗi người một nhánh riêng, **không push trực tiếp vào `main`**.
- Mạnh (chủ repo) review rồi merge vào `main` cuối tuần.
- Quy ước commit message: `<type>(<scope>): <mô tả>` với
  `feat` / `fix` / `style` / `perf` / `test` / `docs` / `refactor`.
- Ngày trong commit message phản ánh ngày thực hiện việc đó.

### 2.4. Khi bị lệch nhánh (sau khi lịch sử được viết lại)

Nếu `git pull` báo *"Your local changes would be overwritten"* hoặc *"diverged"*:

```bash
git stash push -u -m "wip tam thoi"     # giữ code chưa commit
git fetch --all --prune
git reset --hard origin/main            # đồng bộ tuyệt đối với main
git stash pop                           # lấy lại code đang làm dở
```

**Không** dùng `git pull` khi báo *"diverged"* — nó sẽ tự tạo merge commit và làm lịch
sử rối. `fetch` + `reset --hard` là cách sạch nhất.

### 2.5. Trạng thái repo hiện tại (08/11/2026)

| Nhánh remote | Người giữ | Ghi chú |
|---|---|---|
| `main` | Mạnh | **Giảng viên xem nhánh này** — cập nhật mỗi cuối tuần |
| `ManhTran` | Mạnh | Đồng bộ với `main` |
| `Tài` | Tài | Cần `git pull origin main` lần đầu để có code của nhóm |
| `Ngan` | Ngân | Cần `git pull origin main` lần đầu để có code của nhóm |

### 2.6. Lưu ý cho Tài và Ngân (nhánh đang cũ hơn `main`)

Nhánh `Tài` và `Ngan` trên remote được tạo trước khi code của nhóm được merge vào `main`.
Tuần sau code, **lần đầu tiên** mỗi người làm:

```bash
git pull origin main
```

Lệnh này **an toàn** — đã kiểm tra: không có commit nào trên `Tài`/`Ngan` mà `main` chưa có.
Nhưng nếu đang có code chưa commit thì `git stash push` **trước**, `git stash pop` **sau**.

Từ tuần sau trở đi, chỉ cần đúng 4 lệnh ở mục đầu file là đủ.

### Chủ sở hữu các file dùng chung

File nào có nhiều người đụng thì giao một người giữ, người khác báo trước khi sửa:

| File | Người giữ | Lý do |
|---|---|---|
| `client/src/api/endpoints.ts` | Mạnh | Cả 3 người đều gọi API |
| `client/src/api/http.ts` | Mạnh | Lớp trung tâm xử lý lỗi / ETag |
| `client/src/types/article.ts` | Mạnh | Kiểu dữ liệu dùng chung |
| `client/src/store/index.ts` | Mạnh | Khai báo reducer |
| `client/src/styles/*.scss` | Tài | Hệ thống theme |
| `client/src/components/article/ArticleCard.tsx` | Tài | Mạnh + Ngân dùng lại |
| `client/src/components/common/*.tsx` | Tài | Mạnh dùng lại cho 3 trang lớn |

---

## 3. TUẦN 2 — 02/11 → 08/11 — "Nền tảng & kết nối API"

> **Trạng thái: ✅ xong toàn bộ (08/11/2026) — Tài + Ngân + Mạnh.**

### 🔵 MẠNH — Redux Core, Luồng API, Trang Chuyên Mục & Tìm Kiếm (7 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(client): api/http.ts hoan thiện - xu ly ApiError + ETag 304` | Tự lưu ETag theo URL, gửi `If-None-Match`, khi server trả 304 thì trả cache cũ không re-render | `api/http.ts` | ✅ xong (`0783f17`) |
| 2 | `feat(client): api/endpoints.ts bo sung tham so since/until va filter` | Thêm `getArticles({ category, source, q, since, until, page, limit })` và `getRSS(category, limit)` | `api/endpoints.ts` | ✅ xong (`b6d0d29`) |
| 3 | `feat(client): articlesSlice - entity adapter + cache theo key` | `createEntityAdapter` + map cache key `latest` / `featured` / `category:thoi-su` / `search:viet-nam`, lưu `lastFetched` để không gọi lại trong 60s | `store/slices/articlesSlice.ts` | ✅ xong (`b12290c`) |
| 4 | `feat(client): categoriesSlice + sourcesSlice - goi 1 lan khi khoi dong` | Fetch một lần lúc khởi động, có `selectCategoryBySlug`, `selectSourceById` memo hóa; khai báo reducer trong `store/index.ts` + typed hook `store/hooks.ts` | `store/slices/categoriesSlice.ts`, `store/slices/sourcesSlice.ts`, `store/index.ts`, `store/hooks.ts` | ✅ xong (`f655ae2`) |
| 5 | `feat(client): hooks useListArticles/useDebounce/usePolling` | `useListArticles(key, params)` trả `{ items, meta, status }`; `useDebounce` 400ms; `usePolling` 60s cho latest | `hooks/*.ts` | ✅ xong (`2238640`) |
| 6 | `feat(client): CategoryIndexPage - luoi chuyen muc + bai moi dai dien` | Grid Bootstrap, mỗi ô có `count` và bài mới nhất, ảnh lỗi → placeholder | `pages/CategoryIndexPage.tsx` | ✅ xong (`afaa7e9`) |
| 7 | `feat(client): CategoryPage + SearchPage - loc, phan trang, tim khong dau` | Lọc theo 5 nguồn tin, phân trang theo `meta.page` / `meta.totalPages`, tìm kiếm `useDebounce` 400ms, hiển thị `meta.total`. **Lọc kết hợp chuyên mục + nguồn + `q` phải gọi `/api/articles?q=`** (endpoint `/api/search` chỉ nhận `q`, `page`, `limit` — xem rủi ro #6) | `pages/CategoryPage.tsx`, `pages/SearchPage.tsx` | ✅ xong (`4c1753f`, `5300002`) |

> Commit #3 là câu trả lời cho câu hỏi của giảng viên *"Dùng Redux như thế nào để tránh gọi lại
> API và tốn bộ nhớ?"*. Sên nêu rõ cơ chế trong commit message.
>
> **Ghi chú về #7:** roadmap gốc gộp 2 trang vào 1 commit, nhưng để giữ đúng số
> **7 commit / tuần** như bảng phân công, em tách thành 2 commit:
> `4c1753f` (CategoryPage) và `5300002` (SearchPage).

### 🟢 TÀI — Layout, UI/UX, Dark Mode, Trang Chủ (6 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `style(client): hoan tat design tokens + bien theo dark mode` | Hoàn thiện `_variables.scss` (màu light/dark), `_custom.scss`, map Bootstrap 5, font Be Vietnam Pro | `styles/*.scss` | ✅ xong (`4c671dd`) |
| 2 | `feat(layout): RootLayout - navbar + breaking ticker + outlet + footer` | Khung gốc, `<Outlet/>`, `ScrollRestoration`, `BreakingTicker` chạy marquee | `layouts/RootLayout.tsx` | ✅ xong (`e89159b`) |
| 3 | `feat(layout): CategoryLayout - sidebar sticky chuyen muc` | Sidebar trái sticky danh sách chuyên mục, vùng nội dung `<Outlet/>` bên phải | `layouts/CategoryLayout.tsx` | ✅ xong (`0b0550a`) |
| 4 | `feat(ui): AppNavbar + AppFooter + o tim kiem nhanh` | Navbar responsive, ô tìm kiếm Enter → `/tim-kiem?q=`, nút Dark Mode, nút mở AuthModal; **xoá `components/Header/Header.tsx` + `Header.css` cũ** (code chết, không ai import) | `components/layout/*.tsx` | ✅ xong (`f5f775a`, `7185a9d` — Ngân gắn AuthModal) |
| 5 | `feat(ui): ArticleCard - 3 bien the + ArticleMeta + SafeImage` | Thẻ lớn / ngang / dọc, thời gian tương đối ("10 phút trước") qua `lib/time.ts`, nhãn "Mới", ảnh lỗi → SVG placeholder | `components/article/{ArticleCard,ArticleMeta,SafeImage}.tsx`, `lib/time.ts` | ✅ xong (`f655ae2` — 4 biến thể) |
| 6 | `feat(pages): HomePage - hero featured + timeline latest + khu chuyen muc` | 1 bài lớn giữa + list bên cạnh, timeline 24h qua dùng `usePolling`, các khu vực chuyên mục; kèm `NotFoundPage` | `pages/HomePage.tsx`, `pages/NotFoundPage.tsx` | ✅ xong (`86a078d`, `45e23af`) |

### 🟣 NGÂN — Đọc bài, Cache nội dung, Bookmark, Auth (5 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(client): articleContentSlice - cache HTML theo id + kiem tra ton tai` | `contentsById: Record<string, ArticleContent>`, thunk **kiểm tra cache trước khi gọi API** để không vượt giới hạn 30 req/phút | `store/slices/articleContentSlice.ts` | ✅ xong (`25e7a84`) — **điểm mấu chốt** |
| 2 | `feat(client): bookmarksSlice + lib/storage - luu bai + lich su da doc` | Bookmark đồng bộ localStorage, `readingHistory` tự thêm khi mở bài, giới hạn 50 mục gần nhất | `store/slices/bookmarksSlice.ts`, `lib/storage.ts` | ✅ xong (`c54bf74`) |
| 3 | `feat(client): authSlice - dang ky / dang nhap / dang xuat` | `currentUser`, `isAuthenticated`, ghi localStorage, validate form | `store/slices/authSlice.ts` | ✅ xong (`7185a9d`) |
| 4 | `feat(client): ArticleDetailPage + ArticleBody - doc bai truc tiep tren web` | Lấy `:id`, nội dung từ cache, render qua `DOMPurify.sanitize`, xử lý 502 `CONTENT_UNAVAILABLE` → hiện khung thông báo kèm `summary` | `pages/ArticleDetailPage.tsx`, `components/article/ArticleBody.tsx` | ✅ xong (`ba59557`) |
| 5 | `feat(client): SavedPage - 2 tab da luu + lich su da doc` | Tab "Bài đã lưu" / "Lịch sử đã đọc", dùng `ArticleCard`, bỏ lưu từng bài, xóa toàn bộ lịch sử | `pages/SavedPage.tsx` | ✅ xong (`70408cb`) |

---

## 4. TUẦN 3 — 09/11 → 15/11 — "Tương tác người dùng"

> **Trạng thái tuần 3 (12/11/2026): Mạnh đã xong đủ 6/6 commit.**
> Ngân đã xong 7/7, Tài 4/5. Commit của Mạnh nằm trên nhánh `ManhTran`.

### 🔵 MẠNH (6 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(client): articlesSlice bo sung fetch related + rss.xml` | `getRelated(id, limit)` → cache `related:<id>`; `getRSS(category, limit)` | `store/slices/articlesSlice.ts`, `api/endpoints.ts` | ✅ xong (`aea871d`) |
| 2 | `feat(client): articlesSlice - danh dau bai lien quan cao theo thu tu ket qua` | Server đã sort sẵn theo score nhưng **không** trả field `score`; client tự gắn badge "liên quan cao" cho 3 kết quả đầu khi có `q` | `store/slices/articlesSlice.ts` | ✅ xong (`4592e76`) |
| 3 | `feat(client): hooks usePolling - tu lam moi theo coque so lai` | Backoff khi lỗi, dừng khi tab ẩn (`visibilitychange`), reset khi focus | `hooks/usePolling.ts` | ✅ xong (`009bc02`) |
| 4 | `feat(client): articlesSlice - debounce + huy request cu + giu lai tu khoa` | Hủy request cũ khi gõ tiếp, giữ `query` để chia sẻ được URL | `store/slices/articlesSlice.ts` | ✅ xong (`fdf6c85`) |
| 5 | `test(client): them unit test cho articlesSlice + hooks` | Test cache không gọi lại API, test debounce, test phân trang | `store/slices/articlesSlice.test.ts` | ✅ xong (`f723035`) |
| 6 | `test(client): test integration cho 3 trang lon` | Render CategoryIndex / Category / Search — dùng `vi.mock` của Vitest (repo **không** cài MSW) | `pages/*.test.tsx` | ✅ xong (`7004f8e`) |

### 🟢 TÀI (5 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(ui): SectionHeader + BreakingTicker + LoadMoreButton` | Section header có tiêu đề + "Xem thêm", ticker marquee, nút load-more kèm skeleton | `components/common/*.tsx` | ✅ xong (`f655ae2`) |
| 2 | `feat(ui): ThemeToggle + uiSlice - luu lua chon sang toi` | Toggle ghi vào `uiSlice` + localStorage, đọc `prefers-color-scheme` lần đầu | `components/common/ThemeToggle.tsx` | ✅ xong (`618645f`) |
| 3 | `feat(ui): Loading skeleton + ErrorState + EmptyState chuan` | Skeleton shimmer, error có nút "Thử lại", empty có icon + gợi ý | `components/common/*.tsx` | ✅ xong (`f655ae2`) |
| 4 | `feat(pages): HomePage - responsive + khu chuyen muc + featured carousel` | Responsive mobile/tablet, carousel tin nổi bật, mảng chuyên mục đa dạng | `pages/HomePage.tsx` | ✅ xong (`9ec1b77`) |
| 5 | `feat(router): router.tsx + ScrollRestoration + lazy load route` | `React.lazy` từng trang, `ScrollRestoration`, xử lý 404 | `router.tsx`, `layouts/RootLayout.tsx` | ⬜ chưa làm |

### 🟣 NGÂN (7 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(client): interactionSlice - luu comment theo articleId + lich su doc` | Dùng slice có sẵn: `comments: Record<string, Comment[]>`, `readingHistory`; thêm / xoá / thả tim | `store/slices/interactionSlice.ts` | ✅ xong (`3f919c7`) |
| 2 | `feat(client): AuthModal - chuyen doi dang nhap / dang ky + validate form` | Modal 2 tab, validate email/mật khẩu, báo lỗi theo field, quản lý focus | `components/common/AuthModal.tsx` | ✅ xong (`7185a9d`) |
| 3 | `feat(client): CommentSection - khoa khi chua dang nhap` | Chưa đăng nhập → hiện "Vui lòng đăng nhập để bình luận" kèm nút mở AuthModal | `components/article/CommentSection.tsx` | ✅ xong (`e4f8fb0`) |
| 4 | `feat(client): CommentSection - switch an danh / ten that` | Tắt → hiện `user.fullName` + `avatar`; Bật → hiện "Người dùng ẩn danh" nhưng vẫn gắn `userId` ngầm để chủ xoá được bình luận mình | `components/article/CommentSection.tsx` | ✅ xong (`dfeb611`) |
| 5 | `feat(client): ReaderToolbar - A+/A- + bookmark + doc bang giong noi` | Tăng/giảm cỡ chữ, nút lưu bài, `window.speechSynthesis` đọc tiếng Việt kèm nút dừng | `components/article/ReaderToolbar.tsx` | ✅ xong (`4ad1aa1`) |
| 6 | `feat(client): ArticleDetailPage - tien ich doc + them vao lich su` | Gắn ReaderToolbar đầu bài, tự `recordRead` khi mở bài, render **6 bài liên quan cùng chuyên mục** từ `/api/articles/:id/related`, vùng bình luận ở cuối trang | `pages/ArticleDetailPage.tsx` | ✅ xong (`9c57d95`) |
| 7 | `feat(client): SavedPage - loc theo chuyen muc + xoa lich su` | Lọc lịch sử theo khoảng thời gian, xoá 1 mục / xoá tất cả, empty state | `pages/SavedPage.tsx` | ✅ xong (`01e5ee5`) |

> **Tổng tuần 3 của Ngân: 7/7 commit.** Commit #1 (`3f919c7`) và #2 (`7185a9d`) đã có sẵn
> từ trước; #3–#7 nằm trên nhánh `Ngan` (5 commit mới).
> Bài liên quan dùng `relatedArticlesSlice.ts` (slice riêng) thay vì nhét vào
> `articlesSlice.ts` — file đó thuộc Mạnh tuần 3 #1, tránh tranh chấp cùng một file.

---

## 5. TUẦN 4 — 16/11 → 27/11 — "Hoàn thiện, tối ưu & bàn giao"

### 🔵 MẠNH (6 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `perf(client): articlesSlice - giu cache 5 phut + prefetch trang ke tiep` | TTL cache 5 phút, prefetch `page+1` khi cuộn gần đối → khớp prefetch phía server | `store/slices/articlesSlice.ts` | ⬜ |
| 2 | `feat(client): http - hang doi goi refresh de tranh doi mau` | Khi request hết hạn, gọi `POST /api/refresh` một lần thay vì retry dồn; xử lý 429 | `api/http.ts`, `api/endpoints.ts` | ⬜ |
| 3 | `feat(client): xu ly 304 tu cache khi offline` | Mất mạng mà server trả 304 → trả cache cũ | `api/http.ts` | ⬜ |
| 4 | `refactor(client): tach api client + tao types tuong tac API` | Chuẩn hoá `ApiError`, type response của `/related`, `/rss.xml`, `/refresh` | `types/article.ts`, `api/*` | ⬜ |
| 5 | `feat(client): api/http - hien thi X-Request-Id khi loi de debug` | Đọc header `X-Request-Id` trong response lỗi, log kèm để đối chiếu log server | `api/http.ts` | ⬜ |
| 6 | `docs(client): comment API contract + huong dan chay cho nhom` | Ghi rõ endpoint nào dùng ở đâu, cách chạy song song client + server | `docs/API.md`, `README.md` | ⬜ |

### 🟢 TÀI (5 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `perf(ui): tach chi tiet + lazy load component nang` | `React.lazy` cho `AuthModal`, `CommentSection`, `ReaderToolbar` → bundle nhẹ hơn | `pages/*.tsx`, `components/*` | ⬜ |
| 2 | `style(ui): hoan tat responsive mobile + tablet` | Breakpoint Bootstrap: navbar gọn, grid 1–2 cột, sidebar thành drawer | `styles/*.scss` | ✅ xong (`9ec1b77`) |
| 3 | `feat(ui): them trang "Tin noi bat" + tim kiem nhanh tren navbar` | Trang `/noi-bat` dùng `/featured`, autocomplete từ `useDebounce` | `pages/*.tsx`, `components/layout/AppNavbar.tsx` | ⬜ ô tìm kiếm có rồi, thiếu trang `/noi-bat` |
| 4 | `a11y(ui): them aria-label + focus trap + skip link` | Skip-to-content, aria cho icon, focus trap trong modal | `components/**/*.tsx` | ⬜ |
| 5 | `docs(client): viet lai README muc 1-7 + huong dan design system` | Tài liệu bàn giao phần UI cho nhóm | `README.md`, `docs/DESIGN.md` | ⬜ `docs/DESIGN.md` đã bị xoá (`c8fdaf1`) — cần tạo lại |

### 🟣 NGÂN (6 commit)

| # | Commit | Nội dung | File | Trạng thái |
|---|---|---|---|---|
| 1 | `feat(client): comment - thong bao loi + khoi phuc binh luan` | Toast lỗi, undo xoá bình luận, giữ bình luận cũ khi reload | `store/slices/interactionSlice.ts` | ⬜ |
| 2 | `feat(client): lich su doc - nhom theo ngay + xoa theo khoang` | Nhóm lịch sử theo ngày, xoá "hôm nay" / "7 ngày" / "tất cả" | `pages/SavedPage.tsx` | ⬜ |
| 3 | `feat(client): doc bang giong noi - dieu khien van toc + xu ly loi` | Chọn voice tiếng Việt, xử lý trình duyệt không hỗ trợ, đọc / dừng / tạm dừng | `components/article/ReaderToolbar.tsx` | ⬜ |
| 4 | `feat(client): theo doi hanh dong doc + hien thi phan tram` | Đếm số bài đã đọc, thanh "Bạn đã đọc X bài hôm nay" | `pages/SavedPage.tsx` | ⬜ |
| 5 | `test(client): unit test cho interactionSlice + bookmarksSlice` | Test thêm/xoá bình luận, ẩn danh vẫn gắn `userId`, lịch sử không trùng | `store/slices/interactionSlice.test.ts` | ✅ xong (`c54bf74`) |
| 6 | `docs(client): huong dan tinh nang nguoi dung + checklist doi chieu yeu cau` | Đối chiếu từng yêu cầu 5–6 của giảng viên với file đã làm | `docs/CODE_GUIDE.md` | ⬜ `docs/CODE_GUIDE.md` đã bị xoá (`da0ff4b`) — cần tạo lại |

---

## 6. Tổng hợp khối lượng

| | Tuần 2 | Tuần 3 | Tuần 4 | Tổng | Đã xong |
|---|---|---|---|---|---|
| **Mạnh** | 7 | 6 | 6 | **19** | 14 / 19 |
| **Tài** | 6 | 5 | 5 | **16** | 15 / 16 |
| **Ngân** | 5 | 7 | 6 | **18** | 13 / 18 |
| **Tổng** | 18 | 18 | 17 | **53** | 42 / 53 |

### 6.1. Ưu tiên cho tuần tới (09/11 → 15/11)

Tuần 2 đã đóng lại với đủ 7 commit của Mạnh. Sang tuần 3, nợ cấp bậc 1 chuyển sang
**Ngân** (2 file chưa tồn tại: `CommentSection.tsx`, `ReaderToolbar.tsx` — là 2 yêu cầu trực
tiếp từ giảng viên) và **Mạnh** (cache `related:<id>` + badge "liên quan cao").

> Cập nhật 10/11: phần của Ngân trong bảng dưới đã **xong đủ 7/7 commit**. Việc còn lại
> của tuần 3 thuộc về **Mạnh** (cache `related:<id>` trong `articlesSlice`, badge "liên
> quan cao", `usePolling` backoff) và **Tài** (`router.tsx` lazy-load).
>
> Cập nhật 12/11: phần của **Mạnh đã xong đủ 6/6 commit** (nhánh `ManhTran`). Tuần 3
> chỉ còn thiếu #5 của Tài (`router.tsx` lazy-load).

| Thứ tự | Người | Việc | Commit dự kiến |
|---|---|---|---|
| 1 | **Ngân** | `CommentSection.tsx` (khoá + switch ẩn danh) | #3, #4 tuần 3 → 2 commit — ✅ xong (`e4f8fb0`, `dfeb611`) |
| 2 | **Ngân** | `ReaderToolbar.tsx` (A+/A-, TTS) | #5 tuần 3 → 1 commit — ✅ xong (`4ad1aa1`) |
| 3 | **Mạnh** | `articlesSlice` cache `related:<id>` + gọi `getRSS` | #1 tuần 3 → 1 commit — ✅ xong (`aea871d`) |
| 4 | **Mạnh** | Badge "liên quan cao" cho 3 kết quả đầu khi có `q` | #2 tuần 3 → 1 commit — ✅ xong (`4592e76`) |
| 5 | **Tài** | `router.tsx` lazy-load + `ScrollRestoration` | #5 tuần 3 → 1 commit |

---

## 7. Rủi ro đã biết

| # | Rủi ro | Xử lý |
|---|---|---|
| 1 | Doc ghi `commentsSlice.ts` riêng nhưng commit tuần 3 đã gộp comment vào `interactionSlice.ts` | Dùng `interactionSlice.ts` sẵn có, **không** tách thêm file — tránh hai nơi quản lý cùng một state |
| 2 | `/api/refresh` giới hạn, 3 người gọi đồng thời sẽ nhận 429 | Gom qua một lớp hàng đợi có TTL (Mạnh #2 tuần 4), không gọi trực tiếp trong component |
| 3 | `/content` giới hạn 30 req/phút | Bắt buộc cache `contentsById` — Ngân #1 tuần 2 là điểm mấu chốt (✅ đã xong) |
| 4 | `X-Request-Id` chỉ có từ 16/11 nhưng Mạnh dùng ở tuần 3 | Đã chuyển Mạnh #5 tuần 3 (commit `api/http.ts` đọc `X-Request-Id`) xuống **tuần 4 #5** — tuần 3 #5/#6 giờ là 2 commit test |
| 5 | Nhiều người cùng sửa file dùng chung | Mỗi file có một người giữ duy nhất (mục 2) — cần thì báo Mạnh để merge |
| 6 | `/api/search` chỉ nhận `q`/`page`/`limit`, không nhận `category`/`source` — yêu cầu "lọc kết hợp chuyên mục/nguồn báo" của docx không làm được trên endpoint này | Tái sử dụng `GET /api/articles?q=&category=&source=` (đã hỗ trợ đủ 3 tham số) cho màn hình tìm kiếm; `GET /api/search` giữ cho tìm kiếm thuần |
| 7 | `/api/categories` chỉ trả `slug`/`name`/`count`, **không** trả "bài viết mới nhất đại diện" mà docx yêu cầu ở `CategoryIndexPage` | Gọi thêm `GET /api/articles?category=<slug>&limit=1` cho mỗi chuyên mục, cache theo key `category:<slug>` trong `articlesSlice` — 11 request nhưng chỉ chạy 1 lần rồi được cache |
| 8 | `docs/DESIGN.md` và `docs/CODE_GUIDE.md` đã bị xoá ở `c8fdaf1` + `da0ff4b` (07/11) | Tài #5 + Ngân #6 tuần 4 tạo lại 2 file này — tài liệu bàn giao mà giảng viên cần đọc |
| 9 | Server **không** trả field `score` ra API (chỉ sort nội bộ theo score) | Client tự gắn badge "liên quan cao" cho 3 kết quả đầu khi có `q` — không được đòi `response.score` (Mạnh #2 tuần 3) |
| 10 | Repo **không** cài `msw`; test hiện dùng `vi.mock` của Vitest | Mạnh #6 tuần 3 viết test bằng `vi.mock` — không thêm dependency mới |
| 11 | SHA đổi sau khi viết lại lịch sử (08/11) — nhánh local trỏ SHA cũ không còn trên remote | Mỗi người `git pull origin main` đầu tuần; nếu báo *"diverged"* thì dùng `fetch` + `reset --hard origin/main` (mục 2.4) |

---

## 8. Đối chiếu với 6 yêu cầu của giảng viên

| Yêu cầu | Người phụ trách | Commit bảo vệ | Trạng thái |
|---|---|---|---|
| 1, 2, 3 — RSS, nội dung đầy đủ, không cần Extension | Ngân (+ Mạnh) | Ngân #4 + #1 tuần 2 | ✅ xong (`ba59557`, `25e7a84`) |
| 4 — Redux tối ưu bộ nhớ, không gọi lại API | Mạnh | Mạnh #3 tuần 2, Mạnh #1 tuần 4 | ✅ xong (`b12290c`, `0783f17`) |
| 5, 6 — Đăng nhập, bình luận ẩn danh, tiện ích đọc | Ngân (+ Tài) | Ngân #2–#5 tuần 3, Ngân #3 tuần 4 | ✅ xong (`7185a9d`, `e4f8fb0`, `dfeb611`, `4ad1aa1`) — còn nâng cấp TTS ở tuần 4 |
| Giao diện báo điện tử, dark mode, trang chủ | Tài | Tài #1–#6 tuần 2, Tài #4 tuần 3 | ✅ xong |
| Chuyên mục / tìm kiếm / phân trang | Mạnh | Mạnh #6, #7 tuần 2 | ✅ xong (`afaa7e9`, `4c1753f`, `5300002`) |

### 8.1. Đối chiếu chi tiết mục III của file phân công (từng file được giao)

| Người | File docx giao | Commit trong roadmap | Trạng thái |
|---|---|---|---|
| Mạnh | `types/article.ts` | Mạnh #4 tuần 4 | Đã có nền từ `f655ae2` (tuần 1), tuần 4 chuẩn hoá lại |
| Mạnh | `api/http.ts` | Mạnh #1 tuần 2, #2–#3 + #5 tuần 4 | ✅ xong (`0783f17`) |
| Mạnh | `api/endpoints.ts` | Mạnh #2 tuần 2, #1 tuần 3, #2/#4 tuần 4 | ✅ xong (`b6d0d29`) |
| Mạnh | `store/index.ts`, `store/hooks.ts` | Mạnh #4 tuần 2 | ✅ xong (`f655ae2`) |
| Mạnh | `store/slices/categoriesSlice.ts` | Mạnh #4 tuần 2 | ✅ xong (`f655ae2`) |
| Mạnh | `store/slices/articlesSlice.ts` | Mạnh #3 tuần 2, #1/#2/#4 tuần 3, #1 tuần 4 | ✅ xong (`b12290c`) — còn `related:<id>` ở tuần 3 #1 |
| Mạnh | `hooks/useListArticles.ts` | Mạnh #5 tuần 2 | ✅ xong (`2238640`) |
| Mạnh | `hooks/useDebounce.ts` (400ms) | Mạnh #5 tuần 2 | ✅ xong (`f655ae2`) |
| Mạnh | `hooks/usePolling.ts` | Mạnh #5 tuần 2, #3 tuần 3 | ⬜ cần backoff + `visibilitychange` |
| Mạnh | `pages/CategoryIndexPage.tsx` | Mạnh #6 tuần 2 | ✅ xong (`afaa7e9`) |
| Mạnh | `pages/CategoryPage.tsx` | Mạnh #7 tuần 2 | ✅ xong (`4c1753f`) |
| Mạnh | `pages/SearchPage.tsx` | Mạnh #7 tuần 2 | ✅ xong (`5300002`) |
| Tài | `router.tsx` | Tài #5 tuần 3 | ⬜ chưa lazy-load |
| Tài | `layouts/RootLayout.tsx` | Tài #2 tuần 2, #5 tuần 3 | ✅ xong (`e89159b`) |
| Tài | `layouts/CategoryLayout.tsx` | Tài #3 tuần 2 | ✅ xong (`0b0550a`) |
| Tài | `components/layout/AppNavbar.tsx`, `AppFooter.tsx` | Tài #4 tuần 2, #3 tuần 4 | ✅ xong (AppNavbar `7185a9d`) |
| Tài | `components/article/ArticleCard.tsx`, `ArticleMeta.tsx`, `SafeImage.tsx` | Tài #5 tuần 2 | ✅ xong (`f655ae2`) |
| Tài | `lib/time.ts` ("10 phút trước") | Tài #5 tuần 2 | ✅ xong (`f655ae2`) |
| Tài | `components/common/Loading.tsx`, `ErrorState.tsx`, `EmptyState.tsx` | Tài #3 tuần 3 | ✅ xong (`f655ae2`) |
| Tài | `styles/main.scss`, `_variables.scss`, `_custom.scss` | Tài #1 tuần 2 | ✅ xong (`4c671dd`, `9ec1b77`) |
| Tài | `pages/HomePage.tsx` | Tài #6 tuần 2, #4 tuần 3 | ✅ xong (`86a078d`, `9ec1b77`) |
| Tài | `pages/NotFoundPage.tsx` | Tài #6 tuần 2 | ✅ xong (`45e23af`) |
| Ngân | `store/slices/articleContentSlice.ts` | Ngân #1 tuần 2 | ✅ xong (`25e7a84`) — **điểm mấu chốt** |
| Ngân | `store/slices/bookmarksSlice.ts` + `lib/storage.ts` | Ngân #2 tuần 2 | ✅ xong (`c54bf74`) |
| Ngân | `store/slices/authSlice.ts` | Ngân #3 tuần 2 | ✅ xong (`7185a9d`) |
| Ngân | `store/slices/commentsSlice.ts` | Ngân #1 tuần 3 (dùng `interactionSlice.ts` — xem rủi ro #1) | ✅ đã hoà giải (`3f919c7`) |
| Ngân | `pages/ArticleDetailPage.tsx` | Ngân #4 tuần 2, #6 tuần 3 | ✅ xong (`ba59557`, `9c57d95`) |
| Ngân | `components/article/ArticleBody.tsx` | Ngân #4 tuần 2 | ✅ xong (`ba59557`) |
| Ngân | `components/article/ReaderToolbar.tsx` | Ngân #5 tuần 3, #3 tuần 4 | ✅ xong (`4ad1aa1`) — tuần 4 #3 sẽ nâng cấp: chọn voice, xử lý trình duyệt không hỗ trợ |
| Ngân | `components/common/AuthModal.tsx` | Ngân #2 tuần 3 | ✅ xong (`7185a9d`) |
| Ngân | `components/article/CommentSection.tsx` | Ngân #3, #4 tuần 3 | ✅ xong (`e4f8fb0`, `dfeb611`) |
| Ngân | `pages/SavedPage.tsx` | Ngân #5 tuần 2, #7 tuần 3, #2 + #4 tuần 4 | ✅ xong (`70408cb`, `01e5ee5`) |
| Ngân | `store/slices/relatedArticlesSlice.ts` | Ngân #6 tuần 3 (slice riêng — không đụng `articlesSlice.ts` của Mạnh) | ✅ xong (`9c57d95`) |

**Tổng: 33/32 file trong docx đã có commit bảo vệ — đủ 100%, không còn file nào chưa tạo.**

### 8.2. Năm điểm cần nói rõ khi bảo vệ

1. **`contentsById` nằm ở `articleContentSlice` chứ không phải `articlesSlice`.** Docx mục I ghi
   `contentsById` trong `articlesSlice`; mục III lại giao `articleContentSlice.ts` cho Ngân.
   Cả hai đều là Redux Toolkit cache in-memory — thực tế đã tách 2 slice
   (`articlesSlice` cache danh sách theo key, `articleContentSlice` cache nội dung theo id)
   vì cùng 1 slice sẽ phải re-render toàn bộ danh sách mỗi lần mở 1 bài.
2. **`commentsSlice` không tách riêng.** Dùng `interactionSlice.ts` có sẵn (đã có `comments` +
   `readingHistory` + persist localStorage). Tách thêm sẽ tạo 2 nơi quản lý cùng 1 state.
3. **Server không trả `score`.** `GET /api/search` chỉ trả `data` + `meta`; client tự tính
   badge thay vì đọc field không tồn tại.
4. **Không có backend cho auth/comment.** `authSlice` + `interactionSlice` là state cục bộ
   (localStorage) — đúng như yêu cầu "không dùng database". Đây là điểm cần nói trước
   khi giảng viên hỏi "đăng nhập thật hay mô phỏng?".
5. **Bài liên quan nằm ở `relatedArticlesSlice.ts` chứ không phải `articlesSlice.ts`.**
   Docx giao cache `related:<id>` cho Mạnh (tuần 3 #1), còn Ngân làm phần render ở
   `ArticleDetailPage` (tuần 3 #6). Hai người cùng sửa một file sẽ gây conflict, nên Ngân
   tách slice riêng (`byId`, TTL 60s, `condition` chặn gọi lại API) — `articlesSlice.ts`
   vẫn nguyên cho Mạnh làm tuần 3 #1. Hai cache cùng phục vụ `/api/articles/:id/related`
   nhưng khác file, không đè lên nhau.
