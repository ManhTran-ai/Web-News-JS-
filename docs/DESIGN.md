# DESIGN.md — Hệ thống thiết kế cho "Tin tức 24h"

Nguồn sự thật duy nhất cho quyết định hình ảnh của dự án. Mọi giá trị ở đây được hiện thực
trong `client/src/styles/_variables.scss` (biến Sass của Bootstrap) và `client/src/styles/_custom.scss`
(biến CSS `--n24-*` + bảng màu tối). Muốn đổi palette, font hay thang chữ: sửa file này và
`_variables.scss` trong cùng một commit `style(tokens): ...`, không sửa lẻ trong từng trang.

Thứ bậc ưu tiên khi quy tắc mâu thuẫn: `news24h-dev` → `news24h-ui` → `design-taste-frontend`.

---

## 1. Hướng thiết kế

**Hướng được chọn: `accent-ladder` (app screen), seed `1616289151`, draw ngày 2026-11-04.**

Sheet đầy đủ: `node .agents/skills/design-taste-frontend/scripts/draw.mjs --show`.

### Vì sao chọn hướng này

Em deal 6 hướng ứng viên trước khi chọn:

| Hướng ứng viên | Nguồn | Vì sao không chọn |
| --- | --- | --- |
| `type-only-statement` | page mode | Màn hình đầu chỉ có chữ ở cỡ 9–14vw. Sai với brief: người đọc cần thấy tiêu đề + ảnh + nguồn ngay, mật độ cao, quét nhanh. |
| `editorial-report` | page mode | Trục dọc 42% + masthead ảnh + tiêu đề 7–9vw mang dạng một bài feature dài. Đúng giọng "biên tập" nhưng giảm mật độ và tốn nhiều màn hình cho một tin. |
| `sentence-as-layout` | page mode | Câu slogan 9–13vw làm bố cục. Trang tin tức không có slogan; nội dung là dữ liệu thật. |
| `achromatic-ledger` | app mode | Chrome không màu, mọi thứ là số và bảng. Quá "kế toán" cho một báo tin: mất hết chất biên tập mà brief yêu cầu. |
| `framed-sheet` | app mode | Khung L + sheet trắng. Đẹp nhưng tốn một lớp chrome vô nghĩa trước nội dung. |
| `accent-ladder` | app mode | **Chọn.** Đúng cơ chế của báo điện tử: một màu nhấn (đỏ báo chí) ở cỡ đầy đủ trên dấu hiệu nhỏ, bản nhạt của chính màu đó lo phần diện tích. |

`accent-ladder` được draw với `--keep palette,type` (giữ màu đỏ `#c62828` và font Be Vietnam Pro
của dự án), nên chỉ nhận về **cơ chế bố cục**, còn bảng màu và font lấy từ brand sẵn có.

### Redraw và ngoại lệ đã ghi nhận

1. **Redraw `type`**: sheet deal `Geist` + `Geist Mono`. Dự án đã có `@fontsource/be-vietnam-pro`
   (đủ subset `vietnamese`) và quy định bắt buộc tự host font tiếng Việt. Giữ `Be Vietnam Pro`
   làm font duy nhất, bỏ `Geist Mono` (nếu giữ, toàn bộ số sẽ là monospace và vi phạm luật
   "không monospace ngoài code" của taste-skill). Số dùng `font-variant-numeric: tabular-nums`
   trong chính font chữ.
2. **Redraw `palette`**: sheet deal sắc raspberry hồng. Thay bằng đỏ báo chí `#c62828` của brand,
   giữ nguyên tỷ lệ của style (màu đầy đủ chỉ trên dấu hiệu nhỏ, tints lo phần diện tích).
3. **Redraw `shell`**: sheet deal "Ruled T-frame" (sidebar 210–240px + top bar 64px). Cây route của
   dự án là layout route `RootLayout` → `CategoryLayout` với `Outlet`, không có sidebar; thêm
   sidebar sẽ phá vỡ cấu trúc route đã khóa. Dùng shell **"Open plane"**: nền trang + thanh điều
   hướng dọc (navbar) + nội dung chảy trong `Container`. Cột danh mục của `CategoryLayout` là
   thanh cuộn ngang trên mobile, không phải sidebar cố định.

### Vì sao dùng chế độ kiểm tra "app screen"

Trang chủ của một cổng tin là **giao diện dữ liệu động** được làm việc chứ không phải trang đọc
một lần: người đọc quét nhanh, mật độ cao, dữ liệu thật độ dài bất kỳ. `references/app-screens.md`
mô tả đúng trường hợp này và cho phép nới các luật trang (không hero, không giới hạn số ảnh,
không sàn chuyển động, đường kẻ mảnh và nhãn nhỏ bình thường). Vì vậy em chạy:

```
node .agents/skills/design-taste-frontend/scripts/inspect.mjs --app <url>
```

Các luật của trang vẫn được giữ: tiêu đề tối đa 2 dòng, không gradient, không bóng đổ khi nghỉ,
tương phản AA ở cả hai theme, một `h1` mỗi trang.

---

## 2. Câu ý tưởng

> Trên trang này, **bản tin của năm nhà báo trở thành một mặt báo duy nhất**: tin chính đứng
> cạnh dòng thời gian, mọi bài còn lại xếp thành các cột chuyên mục như một trang nhật bản
> in, và thời gian đăng là thứ quyết định thứ tự.

**Chi tiết hóa (chi tiết mở rộng):**

- **Thứ tự do thời gian, không do thứ tự thủ công.** Bố cục toàn trang sắp xếp theo
  `publishedAt` giảm dần. Nguồn và giờ đăng luôn hiện, nên người đọc tự biết tin nào mới hơn.
- **Một mặt báo, năm giọng.** Mỗi nhà báo giữ nguyên tên và màu nhận diện riêng trong dòng meta,
  nhưng tất cả nằm trong cùng một hệ lưới và cùng một bộ chữ.
- **Nền là giấy in, không phải màn hình.** Mặt báo có nền giấy ấm, chữ đen mực, và một màu đỏ
  duy nhất cho những thứ cần nhấn: tin nóng, nút hành động, và số liệu đáng chú ý.

**Live thing (một thứ người đọc làm được):** bộ lọc theo chuyên mục ngay trên đầu trang, chọn
xong là trang tự đổi sang phần "Mới nhất" của chuyên mục đó. Nó dùng dữ liệu thật, chạy được
bằng ngón cái trên điện thoại, có dạng thay thế dạng link thường khi JavaScript tắt, và không
chắn nội dung.

---

## 3. Bảng màu

Một nền, một mực, một màu nhấn. Màu nhấn chỉ xuất hiện ở cỡ đầy đủ trên dấu hiệu nhỏ
(nhãn tin nóng, nút, số đáng chú ý); phần diện tích lớn dùng tint nhạt của chính màu đó.

### 3.1 Giao diện sáng

| Vai trò | Token | Mã | Trên nền | Tương phản |
| --- | --- | --- | --- | --- |
| Nền trang | `--n24-ground` | `#f6f5f4` | — | — |
| Bề mặt (thẻ, khối) | `--n24-surface` | `#ffffff` | ground | 1.10:1 (bề mặt) |
| Bề mặt nâng (input, hover) | `--n24-raised` | `#efedec` | surface | 1.06:1 |
| Đường kẻ / viền | `--n24-border` | `#e3e1e0` | surface | 1.18:1 (quy tắc, không phải chữ) |
| Chữ chính | `--n24-text` | `#1a1714` | surface | **17.7:1** |
| Chữ chính | `--n24-text` | `#1a1714` | ground | **16.6:1** |
| Chữ phụ | `--n24-muted` | `#55504c` | surface | **7.6:1** |
| Chữ phụ | `--n24-muted` | `#55504c` | ground | **7.1:1** |
| Chữ mờ (nguồn, giờ) | `--n24-faint` | `#6e6862` | surface | **4.8:1** |
| Màu nhấn | `--n24-accent` | `#c62828` | surface | **5.6:1** |
| Màu nhấn | `--n24-accent` | `#c62828` | ground | **5.3:1** |
| Tint màu nhấn | `--n24-accent-soft` | `#fdecec` | surface | 1.05:1 |
| Liên kết | `--n24-link` | `#b3261e` | surface | **6.5:1** |
| Trạng thái: mới | `--n24-positive` | `#1b6b3a` | surface | 5.6:1 |
| Trạng thái: cảnh báo | `--n24-warning` | `#8a5a00` | surface | 5.4:1 |
| Trạng thái: lỗi | `--n24-negative` | `#b3261e` | surface | 6.5:1 |

### 3.2 Giao diện tối

Bảng màu tối được viết riêng, không phải đảo màu. Nền là than đậm trung tính, không navy/slate.

| Vai trò | Token | Mã | Trên nền | Tương phản |
| --- | --- | --- | --- | --- |
| Nền trang | `--n24-ground` | `#0e0d0c` | — | — |
| Bề mặt | `--n24-surface` | `#1a1918` | ground | 1.24:1 (bề mặt) |
| Bề mặt nâng | `--n24-raised` | `#262423` | surface | 1.16:1 |
| Đường kẻ / viền | `--n24-border` | `#302e2c` | surface | 1.29:1 |
| Chữ chính | `--n24-text` | `#f4f2f0` | surface | **16.5:1** |
| Chữ chính | `--n24-text` | `#f4f2f0` | ground | **17.6:1** |
| Chữ phụ | `--n24-muted` | `#b3ada8` | surface | **7.8:1** |
| Chữ phụ | `--n24-muted` | `#b3ada8` | ground | **8.3:1** |
| Chữ mờ | `--n24-faint` | `#928c87` | surface | **5.4:1** |
| Màu nhấn | `--n24-accent` | `#ff4d4f` | surface | **6.6:1** |
| Màu nhấn | `--n24-accent` | `#ff4d4f` | ground | **7.1:1** |
| Tint màu nhấn | `--n24-accent-soft` | `#2a1518` | surface | 1.10:1 |
| Liên kết | `--n24-link` | `#ff6b6b` | surface | **7.9:1** |
| Trạng thái: mới | `--n24-positive` | `#5cc98a` | surface | 8.0:1 |
| Trạng thái: cảnh báo | `--n24-warning` | `#e0b055` | surface | 9.5:1 |
| Trạng thái: lỗi | `--n24-negative` | `#ff6b6b` | surface | 7.9:1 |

Tất cả tỷ lệ tương phản trên được tính bằng công thức WCAG 2.1 và đã kiểm tra bằng script.
Mọi cặp chữ đều trên 4.5:1 (AA). Không dùng màu nào trong bảng trên thuộc họ "terracotta",
"cream" hay "violet" mà taste-skill cấm.

---

## 4. Chữ

| Vai trò | Font | Cỡ | Line-height | Tracking | Weight |
| --- | --- | --- | --- | --- | --- |
| Tiêu đề tin chính (`lead`) | Be Vietnam Pro | `clamp(1.75rem, 1.1rem + 2.6vw, 2.75rem)` | 1.18 | -0.02em | 700 |
| Tiêu đề khối (`h2`) | Be Vietnam Pro | `clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)` | 1.25 | -0.015em | 700 |
| Tiêu đề thẻ (`standard`) | Be Vietnam Pro | 1.0625rem | 1.35 | -0.01em | 600 |
| Tiêu đề thẻ (`compact` / `row`) | Be Vietnam Pro | 1rem | 1.4 | -0.01em | 600 |
| Tóm tắt | Be Vietnam Pro | 0.9375rem | 1.55 | 0 | 400 |
| Thân bài (`.article-body`) | Be Vietnam Pro | 1.0625rem | 1.7 | 0 | 400 |
| Meta (nguồn, giờ) | Be Vietnam Pro | 0.8125rem | 1.4 | 0 | 500 |
| Nhãn / nút | Be Vietnam Pro | 0.875rem | 1.3 | 0 | 600 |

Quy tắc:

- **Một họ chữ duy nhất** cho toàn bộ sản phẩm. Không có font thứ hai, không có monospace
  (số dùng `font-variant-numeric: tabular-nums`).
- Font tự host qua `@fontsource/be-vietnam-pro`, đã kiểm tra có subset `vietnamese`
  (`vietnamese-400/500/600/700.css`) nên dấu tiếng Việt có đủ dấu chồng.
- **Dấu chồng không bị cắt**: tiêu đề `line-height ≥ 1.18`, thân bài `1.7`. Không dùng
  `line-height < 1.15` ở bất kỳ cỡ chữ tiếng Việt nào.
- Tiêu đề căn trái. Không dùng font chữ nghiêng, không tô màu một từ trong tiêu đề.
- Cỡ chữ dùng trên trang chủ (desktop): 13 / 15 / 17 / 20 / 24 / 28 / 44 px → 7 bậc, dưới trần 9.

---

## 5. Khoảng cách và bo góc

**Lưới**: một hệ lưới duy nhất, Bootstrap 5 `Container` (`max-width` 1320px ở `xxl`).
Margin ngoài cố định: 16px ở `xs`, 24px ở `md` trở lên.

**Thang khoảng cách** (nhân 4px, dùng biến `$spacer` của Bootstrap):

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--n24-space-1` | 4px | khoảng cách trong một cụm nhỏ |
| `--n24-space-2` | 8px | giữa tiêu đề và dòng meta |
| `--n24-space-3` | 12px | trong một thẻ |
| `--n24-space-4` | 16px | giữa các thẻ cạnh nhau |
| `--n24-space-5` | 24px | giữa các khối cùng cấp |
| `--n24-space-6` | 32px | padding trong của khối |
| `--n24-space-7` | 48px | khoảng cách giữa các khối tin |
| `--n24-space-8` | 64px | khoảng cách giữa các phần trang |

Khoảng cách **giữa hai phần** lớn hơn rõ rệt khoảng cách **bên trong** một phần:
64px cho phần, 24px cho trong phần.

**Bo góc**: chọn cặp chặt, quyết định một lần cho cả sản phẩm.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--n24-radius-card` | 8px | thẻ bài, panel |
| `--n24-radius-control` | 6px | nút, ô nhập |
| `--n24-radius-chip` | 4px | nhãn nhỏ |
| `--n24-radius-pill` | 999px | nút tròn, chỉ dùng cho điều khiển tròn |

Ảnh dùng góc vuông (`--n24-radius-card` không áp cho `SafeImage`), nhất quán với 73% site được
nghiên cứu.

---

## 6. Quy tắc chuyển động

Chuyển động ít và có mục đích, đúng mức "chuyển động thấp" của brief.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--n24-motion-fast` | 120ms | đổi màu nền, màu chữ khi hover |
| `--n24-motion-base` | 180ms | nút, thẻ bài khi hover/focus |
| `--n24-motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` | easing chuẩn |

Quy tắc:

- Chỉ chuyển động `transform` và `opacity`. Không chuyển động thuộc tính `width`, `height`,
  `top`, `left`.
- Không có hiệu ứng cuộn nặng, không video nền, không hiệu ứng "fade in" cho cả khối.
- Mọi chuyển động bị tắt khi `prefers-reduced-motion: reduce`; nội dung phải hiện đầy đủ
  trong điều kiện đó.
- `BreakingTicker` dừng chạy khi con trỏ hover, khi focus vào, và khi `prefers-reduced-motion: reduce`.

---

## 7. Danh mục component và biến thể

| Component | Biến thể | Ghi chú |
| --- | --- | --- |
| `article/ArticleCard` | `lead`, `standard`, `compact`, `row` | `lead` là tin chính (ảnh lớn + tiêu đề 44px); `standard` là thẻ 16:9; `compact` không ảnh hoặc ảnh nhỏ 96px; `row` là hàng ngang ảnh trái chữ phải |
| `article/ArticleMeta` | — | nguồn + giờ đăng tương đối + nhãn "Mới" dưới 1 giờ |
| `article/SafeImage` | — | tỉ lệ cố định 16:9, `loading="lazy"`, `referrerPolicy="no-referrer"`, placeholder thiết kế sẵn khi lỗi |
| `article/ArticleSkeleton` | theo `variant` của thẻ | cùng kích thước thẻ thật, không làm nhảy bố cục |
| `article/ArticleBody` | — | nơi duy nhất dùng `dangerouslySetInnerHTML`, HTML đã qua server + DOMPurify |
| `common/SectionHeader` | — | tiêu đề khối (h2) + liên kết "Xem thêm" |
| `common/Loading` | — | trạng thái đang tải |
| `common/ErrorState` | — | thông báo lỗi + nút "Thử lại" |
| `common/EmptyState` | — | trạng thái rỗng |
| `common/LoadMoreButton` | — | nút tải thêm, kèm trạng thái đang tải |
| `common/ThemeToggle` | — | đổi sáng/tối/system, trong Navbar |
| `common/BreakingTicker` | — | dải tin nóng cuộn ngang, tự dừng khi hover/focus/reduced-motion |
| `layout/AppNavbar` | — | wordmark, danh mục, ô tìm kiếm, nút theme |
| `layout/AppFooter` | — | ghi nguồn và bản quyền |
| `store/slices/uiSlice` | `theme`: `light` \| `dark` \| `system` | lưu `localStorage`, mặc định theo `prefers-color-scheme` |

Mỗi component có đủ ba trạng thái: **đang tải**, **lỗi** (có nút thử lại), **rỗng**.

---

## 8. Quy tắc tiêu đề, ảnh và placeholder

### Tiêu đề

- Tiêu đề dùng `line-clamp` để không bao giờ vỡ bố cục:
  - `lead`: tối đa **3 dòng** (`--n24-clamp-lead`)
  - `standard`, `compact`, `row`: tối đa **2 dòng** (`--n24-clamp-2`)
- **Tuyệt đối không cắt, viết lại hay rút gọn tiêu đề trong dữ liệu.** Độ dài là dữ liệu thật.
- Nếu tiêu đề dài hơn số dòng cho phép, dấu `…` do CSS thêm vào, người đọc vẫn mở được
  bài đầy đủ.
- Một `h1` mỗi trang. Tiêu đề khối dùng `h2`, tiêu đề thẻ dùng `h3`.
- Không có "eyebrow": không nhãn nhỏ viết hoa phía trên tiêu đề. Chuyên mục hiện trong dòng
  meta cạnh nguồn và giờ đăng.

### Ảnh

- Trong khu vực tin chỉ dùng **thumbnail thật của bài** (`article.thumbnail`). Không ảnh stock.
- `SafeImage` giữ tỉ lệ 16:9 bằng `aspect-ratio` để không dịch bố cục khi ảnh tải xong.
- Ảnh đầu tiên trên màn hình đầu: `loading="eager"` + `fetchpriority="high"`, các ảnh sau là `lazy`.
- Không đặt chữ lên ảnh. Không lớp phủ chữ gradient.
- Ảnh thiếu hoặc lỗi: hiện **placeholder thiết kế sẵn** — khối nền `--n24-raised` với chữ
  cái đầu của tên nguồn, không dùng ảnh ngẫu nhiên, không dùng icon.

### Placeholder

- Dùng cho ảnh lỗi, bài thiếu tóm tắt, bài thiếu ảnh.
- Skeleton (`ArticleSkeleton`) dùng nền `--n24-raised`, **không shimmer gradient**.

---

## 9. Những điều cấm

Áp dụng cho toàn bộ giao diện, kiểm bằng `lint.mjs` và `inspect.mjs`:

1. Không gradient (nền, nút, chữ, thẻ).
2. Không bóng đổ khi nghỉ; bóng chỉ dành cho menu, hộp thoại, popover.
3. Không nhãn nhỏ viết hoa, letter-spacing rộng.
4. Không số thứ tự kiểu "01 / 02 / 03".
5. Không đường kẻ mảnh làm ngăn cách nội dung; tách vùng bằng khoảng trắng và khác biệt nền.
6. Không nền kính (backdrop blur), không thanh điều hướng dạng pill.
7. Không emoji, không khối gradient trang trí, không dashboard giả bằng thanh xám.
8. Không tô màu/nghiêng một từ trong tiêu đề.
9. Không thẻ có icon ở trên, không hàng loạt thẻ giống hệt nhau.
10. Không monospace ngoài khối code.
11. Không có chữ trắng mờ trên nền ảnh mà không có nền đặc phía sau.
12. Không dùng màu tím/indigo, không dùng cặp kem + gỉ sắt.
13. Không để tiêu đề vượt quá 2 dòng (3 dòng riêng cho tin chính).
14. Không tràn ngang, không chữ áp sát mép màn hình (margin tối thiểu 16px trên mobile).

---

## 10. Chạy kiểm tra

```bash
# gate của taste-skill (chế độ app screen, đã bật tự động nhờ .taste-skill/direction.json)
node .agents/skills/design-taste-frontend/scripts/lint.mjs client/src
node .agents/skills/design-taste-frontend/scripts/inspect.mjs --app http://localhost:5173/

# gate của dự án
npm run typecheck
npm run lint
npm test
npm run build
```

Chạy `inspect` trên **bản build production** (`npm run build -w client` rồi `vite preview`) trước
khi chốt, vì minifier có thể thay đổi CSS so với dev server.
