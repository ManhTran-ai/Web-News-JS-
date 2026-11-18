# Hướng dẫn tính năng người dùng — Website Tin tức 24h

Tài liệu này mô tả **toàn bộ tính năng phía người dùng** của client, cách chạy thử từng
tính năng, và checklist đối chiếu với các yêu cầu của giảng viên.

> Phần server (bóc RSS, crawl nội dung) xem [`docs/API.md`](./API.md).
> Phần design token của hệ thống giao diện nằm ở `client/src/styles/_variables.scss` và
> `client/src/styles/_custom.scss`.

---

## 1. Tổng quan: các nhóm tính năng

| Nhóm | Màn hình | File chính | Ghi chú |
|---|---|---|---|
| Đọc bài | `/bai-viet/:id` | `pages/ArticleDetailPage.tsx` | Nội dung đầy đủ render ngay trong trang |
| Đăng nhập / đăng ký | Modal trên navbar | `components/common/AuthModal.tsx` | Tài khoản lưu cục bộ (`localStorage`) |
| Bình luận | Cuối bài viết | `components/article/CommentSection.tsx` | Hỗ trợ ẩn danh, có "Hoàn tác" khi xoá |
| Lưu bài | `/da-luu` | `pages/SavedPage.tsx` | 2 tab: bài đã lưu + lịch sử đọc |
| Tiện ích đọc | Đầu bài viết | `components/article/ReaderToolbar.tsx` | A+/A−, bookmark, đọc bằng giọng nói |
| Tìm kiếm | `/tim-kiem` | `pages/SearchPage.tsx` | Debounce 400 ms |
| Chuyên mục | `/chuyen-muc`, `/chuyen-muc/:slug` | `pages/CategoryIndexPage.tsx`, `pages/CategoryPage.tsx` | Lọc theo nguồn + phân trang |

---

## 2. Đọc bài — nội dung đầy đủ, không cần Extension

**Yêu cầu 1, 2, 3 của giảng viên.**

Mở `/bai-viet/<id>`. Client gọi `GET /api/articles/:id/content`; server crawl trang báo,
trích xuất bằng Readability rồi làm sạch bằng `sanitize-html`.

```text
pages/ArticleDetailPage.tsx
├── dispatch(fetchArticleContent(id))      → store/slices/articleContentSlice.ts
│     └── thunk kiểm tra cache theo id TRƯỚC khi gọi API
├── <ArticleBody contentHtml=... />         → DOMPurify.sanitize() trước khi render
├── 502 CONTENT_UNAVAILABLE                 → hiện khung thông báo + tóm tắt bài
└── <ReaderToolbar />                       → tiện ích đọc (mục 4)
```

**Vì sao phải cache theo id:** endpoint `/content` chỉ cho phép **30 request/phút** (các
endpoint khác là 300). Bài đã mở một lần thì lần sau lấy từ Redux, không gọi API.

---

## 3. Đăng nhập / đăng ký

**Yêu cầu 5.**

- Nút "Đăng nhập" trên navbar mở `AuthModal` (2 tab: đăng nhập / đăng ký).
- Validate: email đúng định dạng, mật khẩu ≥ 6 ký tự, họ tên bắt buộc khi đăng ký.
- Báo lỗi theo từng field, không reload trang.

> **Cần nói trước khi giảng viên hỏi:** backend tuần 2 chưa có endpoint
> `/api/auth/*`. Vì vậy `authSlice` lưu tài khoản cục bộ trong `localStorage` (mật khẩu
> chỉ băm nhẹ, **không phải** chuẩn bảo mật) — đúng yêu cầu "không dùng database".

---

## 4. Bình luận (có ẩn danh) — Yêu cầu 5, 6

**Yêu cầu 6 của giảng viên.**

- Chưa đăng nhập → hiện "Vui lòng đăng nhập để bình luận" kèm nút mở `AuthModal`.
- Bật/tắt công tắc **Ẩn danh**:
  - Tắt → hiện `user.fullName` + avatar.
  - Bật → hiện "Người dùng ẩn danh", **nhưng vẫn gắn `userId` ẩn** để chủ bình luận
    vẫn xoá/thích được bình luận của chính mình.
- **Thông báo lỗi dạng toast** — dùng `components/common/Toast.tsx`.
- **Hoàn tác khi xoá**: xoá bình luận hiện toast "Đã xoá bình luận." kèm nút "Hoàn tác".
  Bình luận đã xoá được giữ trong `interactionSlice.lastDeleted` (kèm `localStorage`) nên
  vẫn hoàn tác được sau khi reload trang.

```text
store/slices/interactionSlice.ts
├── comments: Record<articleId, Comment[]>
├── commentError: string | null            → toast lỗi
└── lastDeleted: DeletedComment | null     → dữ liệu cho nút "Hoàn tác"
```

---

## 5. Tiện ích đọc — Yêu cầu 6

**Yêu cầu 6 của giảng viên.** Nằm ở đầu bài viết, component `ReaderToolbar`:

| Nút | Việc |
|---|---|
| A− / A+ | Đổi cỡ chữ phần nội dung (0.8× → 1.6×), lưu vào `localStorage` |
| Bookmark | Lưu/bỏ lưu bài |
| Đọc bằng giọng nói | Dùng `window.speechSynthesis` đọc nội dung bài |

Nâng cấp tuần 4 của tính năng đọc bằng giọng nói:

- **Chọn giọng tiếng Việt** — dropdown lọc theo `voice.lang` bắt đầu bằng `vi`
  (`lib/speech.ts` → `pickVietnameseVoices`). Danh sách voice được nạp bất đồng bộ nên
  component lắng nghe thêm sự kiện `voiceschanged`.
- **Tốc độ đọc** — slider 0.5× → 2×, gán vào `utterance.rate`.
- **Xử lý lỗi rõ ràng** — hiện thông báo khi trình duyệt không hỗ trợ `speechSynthesis`,
  khi chưa có nội dung để đọc, hoặc khi phát âm lỗi. Bỏ qua lỗi `canceled`/`interrupted`
  (do người dùng bấm Dừng).
- **Ba trạng thái rõ ràng**: đọc / tạm dừng / dừng.

---

## 6. Bài đã lưu & lịch sử đọc — `/da-luu`

**Yêu cầu 5.** Hai tab:

### Tab "Bài đã lưu"
Danh sách bài đã ghim. Bấm biểu tượng thùng rác ở góc thẻ để bỏ lưu, nút "Xoá tất cả
bài đã lưu" ở góc phải.

### Tab "Lịch sử đã đọc"
- **Nhóm theo ngày**: "Hôm nay", "Hôm qua", hoặc ngày cụ thể (`DD/MM/YYYY`) — dùng
  `lib/time.ts` → `historyDayLabel`.
- **Lọc theo khoảng thời gian**: "Hôm nay" / "7 ngày" / "Tất cả" (dùng `historyCutoff`).
- **Lọc theo chuyên mục**: dropdown lấy danh sách chuyên mục có trong lịch sử.
- **Xoá theo khoảng**: "Xoá hôm nay" / "Xoá 7 ngày" / "Xoá tất cả" — reducer
  `clearReadingHistoryByRange` chỉ xoá các mục nằm trong khoảng đã chọn.
- Xoá từng mục bằng biểu tượng thùng rác.

### Thanh theo dõi hành động đọc
Component `ReadStats` ở đầu trang hiện **"Bạn đã đọc X bài hôm nay"** kèm thanh phần trăm
tính theo mục tiêu `DAILY_READING_GOAL` (mặc định 10 bài/ngày).

---

## 7. Tìm kiếm, chuyên mục, phân trang

- **Tìm kiếm** (`/tim-kiem?q=`): debounce 400 ms (`useDebounce`), lọc kết hợp chuyên mục +
  nguồn báo + từ khoá → gọi `GET /api/articles?q=&category=&source=`.
  > Endpoint `/api/search` chỉ nhận `q`/`page`/`limit`, nên màn hình tìm kiếm dùng
  > `GET /api/articles` để lọc kết hợp được.
- **Chuyên mục** (`/chuyen-muc`): lưới 11 chuyên mục kèm bài mới nhất đại diện.
- **Trang chuyên mục** (`/chuyen-muc/:slug`): lọc theo nguồn báo + phân trang theo
  `meta.page` / `meta.totalPages`.
- **Trang chủ**: hero bài nổi bật + timeline bài mới nhất (polling 60 s) + khối chuyên mục.

---

## 8. Cache & giới hạn API — Yêu cầu 4

**Yêu cầu 4 của giảng viên.**

| Cơ chế | Nơi thực hiện |
|---|---|
| ETag + `If-None-Match`, xử lý 304 | `api/http.ts` |
| Cache danh sách theo key, TTL 60 s | `store/slices/articlesSlice.ts` |
| Cache nội dung bài theo id (giới hạn 30 req/phút) | `store/slices/articleContentSlice.ts` |
| Cache bài liên quan theo id | `store/slices/relatedArticlesSlice.ts` |
| Hủy request cũ khi gõ từ khoá mới | `articlesSlice` + `AbortController` |
| Backoff + dừng polling khi tab ẩn | `hooks/usePolling.ts` |

Kết quả: mỗi bài chỉ gọi API `/content` **một lần duy nhất** trong phiên làm việc, không
tốn bộ nhớ không cần thiết.

---

## 9. Checklist đối chiếu yêu cầu của giảng viên

| # | Yêu cầu | Hiện thực ở đâu | Trạng thái |
|---|---|---|---|
| 1 | Có RSS tổng hợp của chính website | Server `GET /api/articles/rss.xml`; client `api/endpoints.ts` → `getRSS()` | ✅ |
| 2 | Hiển thị **nội dung đầy đủ** của bài, không phải chỉ tiêu đề + link | `pages/ArticleDetailPage.tsx` + `components/article/ArticleBody.tsx` | ✅ |
| 3 | Không cần cài Extension | Toàn bộ nội dung đã nằm trong API `/content` của server | ✅ |
| 4 | Redux tối ưu bộ nhớ, không gọi lại API | `articlesSlice` (TTL + cache theo key), `articleContentSlice` (cache theo id), `api/http.ts` (ETag/304) | ✅ |
| 5 | Có đăng nhập / đăng ký | `store/slices/authSlice.ts` + `components/common/AuthModal.tsx` | ✅ |
| 6 | Bình luận ẩn danh + tiện ích đọc | `components/article/CommentSection.tsx`, `components/article/ReaderToolbar.tsx` | ✅ |

### Ghi chú cần nói rõ khi bảo vệ

1. **`contentsById` nằm ở `articleContentSlice`, không phải `articlesSlice`.** Đề bài ghi
   `contentsById` trong `articlesSlice`; mục phân công lại giao `articleContentSlice.ts`.
   Tách là đúng: cùng một slice sẽ re-render toàn bộ danh sách mỗi lần mở một bài.
2. **`commentsSlice` không tách riêng.** Dùng `interactionSlice.ts` có sẵn — tránh hai nơi
   quản lý cùng một state.
3. **Server không trả field `score`.** Client tự gắn badge "liên quan cao" cho 3 kết quả
   đầu khi có `q`, không đòi `response.score`.
4. **Không có backend cho auth/comment.** `authSlice` + `interactionSlice` là state cục bộ
   (`localStorage`) — đúng yêu cầu "không dùng database".
5. **Bài liên quan nằm ở `relatedArticlesSlice.ts`** (slice riêng) để không tranh chấp
   `articlesSlice.ts` với phần cache danh sách.

---

## 10. Chạy thử từng tính năng

```bash
npm install
npm run dev          # server :4000 + client :5173
```

| Kiểm tra | Cách làm | Kết quả mong đợi |
|---|---|---|
| Đọc bài | Mở một bài ở trang chủ | Nội dung hiện ngay, không phải chuyển trang |
| Nội dung lỗi | Mở bài mà server không crawl được | Hiện khung thông báo + tóm tắt |
| Đăng ký | Navbar → Đăng nhập → tab Đăng ký | Đăng ký được, tên hiện trên navbar |
| Bình luận ẩn danh | Bật công tắc "Ẩn danh" rồi gửi | Hiện "Người dùng ẩn danh" |
| Hoàn tác xoá | Xoá bình luận của mình | Toast "Đã xoá bình luận." + nút "Hoàn tác" |
| Giọng đọc | Mở bài, chọn giọng trong dropdown, bấm "Đọc bằng giọng nói" | Đọc nội dung bằng giọng tiếng Việt |
| Lịch sử đọc | Đọc vài bài → `/da-luu` → tab "Lịch sử đã đọc" | Bài được nhóm theo ngày, thanh phần trăm chạy |
| Xoá theo khoảng | Tab lịch sử → "Xoá hôm nay" | Chỉ mục hôm nay bị xoá |
| Tìm kiếm | Gõ từ khoá vào ô trên navbar | Danh sách lọc sau 400 ms |
| Dark mode | Nút theme trên navbar | Đổi sáng/tối, giữ lựa chọn sau reload |

Kiểm tra chất lượng:

```bash
npm run typecheck
npm test
npm run lint
```
