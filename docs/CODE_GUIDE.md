# Giải thích toàn bộ source code — Web Tin tức 24h

Tài liệu này dành cho sinh viên đang học môn Lập trình Frontend và đồ án "Tin tức 24h".
Mục tiêu: hiểu **mọi khái niệm, luồng xử lý, và từng dòng code quan trọng** trong dự án, để có thể thuyết trình hoặc mở rộng mà không cần đọc lại code từ đầu.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Quy trình chạy (dev / build / production)](#3-quy-trình-chạy-dev--build--production)
4. [Phía Server — phân tích chi tiết](#4-phía-server--phân-tích-chi-tiết)
5. [Phía Client — phân tích chi tiết](#5-phía-client--phân-tích-chi-tiết)
6. [Các luồng xử lý end-to-end](#6-các-luồng-xử-lý-end-to-end)
7. [Khái niệm Frontend cốt lõi được dùng trong dự án](#7-khái-niệm-frontend-cốt-lõi-được-dùng-trong-dự-án)
8. [Bảng tra nhanh API](#8-bảng-tra-nhanh-api)
9. [Bảo mật và hiệu năng](#9-bảo-mật-và-hiệu-năng)
10. [Câu hỏi thường gặp khi thuyết trình](#10-câu-hỏi-thường-gặp-khi-thuyết-trình)
11. [Bài tập mở rộng gợi ý](#11-bài-tập-mở-rộng-gợi-ý)
12. [Kiểm thử (Vitest)](#12-kiểm-thử-vitest)

---

## 1. Tổng quan dự án

### 1.1 Bài toán

Website tin tức tổng hợp nội dung **thật** từ RSS của 5 báo uy tín: VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet.

Điểm khác biệt so với trang tin bình thường: **nội dung bài viết hiển thị ngay trên trang của mình**, không bắt người dùng bấm sang trang báo.

### 1.2 Ràng buộc kỹ thuật (từ đề bài)

| Ràng buộc | Cài đặt trong dự án |
|---|---|
| React + TypeScript + Vite + Bootstrap 5 | `client/` |
| Node.js + Express, KHÔNG dùng database | `server/`, cache RAM + snapshot JSON |
| Client không được gọi trực tiếp RSS/trang báo (lỗi CORS) | Mọi lượt gọi đi qua `/api` |
| Phải dùng Redux Toolkit | `client/src/store/` |
| Phải dùng cả 3 khái niệm React Router: Outlet / index route / layout route | `client/src/router.tsx` |
| Server phải tự crawl/batch nội dung | `services/content.service.ts` + `content.prefetch.ts` |
| Chỉ phục vụ người dùng, không có admin | Không route/component quản trị |
| Giao diện tiếng Việt | `<html lang="vi">`, tên biến/hàm/file tiếng Anh |

### 1.3 Công nghệ dùng

**Server** (`server/package.json`):

| Thư viện | Vai trò |
|---|---|
| `express` (v5) | Framework HTTP, định tuyến |
| `rss-parser` | Parse XML RSS/Atom thành object JS |
| `jsdom` | Mô phỏng DOM để parse HTML trang báo ở Node |
| `@mozilla/readability` | Thuật toán trích nội dung chính từ trang báo (như "Reader Mode" của Chrome) |
| `sanitize-html` | Lọc HTML theo allowlist — loại bỏ script/iframe |
| `node-cache` | Cache nội dung trong RAM với TTL |
| `node-cron` | Hẹn giờ làm mới RSS |
| `zod` | Validate cấu hình env + query string |
| `helmet` | Header bảo mật (CSP, X-Frame-Options…) |
| `cors` | Kiểm soát origin được phép gọi API |
| `express-rate-limit` | Giới hạn số request/phút |
| `dotenv` | Nạp biến môi trường từ `.env` |

**Client** (`client/package.json`):

| Thư viện | Vai trò |
|---|---|
| `react` 19, `react-dom` | Thư viện UI |
| `react-router-dom` 7 | Định tuyến phía client (SPA) |
| `@reduxjs/toolkit`, `react-redux` | Quản lý state toàn cục |
| `react-bootstrap` | Bọc component Bootstrap 5 dạng React |
| `axios` | HTTP client |
| `dayjs` | Xử lý thời gian + relative time ("2 giờ trước") |
| `dompurify` | Lọc HTML lần 2 ở phía trình duyệt |
| `@fontsource/be-vietnam-pro` | Font tự host (không gọi Google Fonts) |
| `bootstrap-icons` | Icon SVG |

---

## 2. Kiến trúc tổng thể

```text
                    ┌──────────────────────────────────────────────┐
                    │  RSS chính thống của các báo                 │
                    │  vnexpress · tuoitre · thanhnien · dantri ·   │
                    │  vietnamnet                                 │
                    └───────────────────┬──────────────────────────┘
                                        │ HTTP GET (rss-parser)
    ┌───────────────────────────────────▼─────────────────────────────────────┐
    │  SERVER (Node + Express)  :4000                                         │
    │                                                                          │
    │  jobs/refresh.job ──cron 5 phút──► services/refresh.service            │
    │                                          │                           │
    │                                          ▼                           │
    │                            services/feed.service  (chuẩn hoá Article)   │
    │                                          │                           │
    │                                          ▼                           │
    │                       services/article.store  (Map trong RAM)           │
    │                                          │                           │
    │              ┌───────────────────────────┼───────────────────────┐      │
    │              ▼                           ▼                       ▼      │
    │  content.prefetch (batch 30)   snapshot.service (JSON)   cache.service│
    │              │                                             (node-cache)│
    │              ▼                                                             │
    │      content.service  (jsdom + Readability → sanitize-html)              │
    │                                                                          │
    │  routes/index ──► middlewares/validate ──► controllers ──► { data, meta }│
    └────────────────────────────────┬─────────────────────────────────────────┘
                                     │ HTTP /api/*
    ┌────────────────────────────────▼─────────────────────────────────────────┐
    │  CLIENT (React + Redux Toolkit)  :5173                                   │
    │                                                                          │
    │  page ──dispatch(thunk)──► api/endpoints ──► axios ──► server           │
    │     │                                                                    │
    │     └──useSelector──► slice (articles / categories / articleContent /    │
    │                        bookmarks)                                          │
    │                                                                          │
    │  router.tsx: RootLayout (layout route) ──► <Outlet/> ──► các page      │
    └──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Nguyên tắc bất biến

> **Client không bao giờ gọi RSS hay trang báo trực tiếp.** Mọi thứ đi qua API của server.

Lý do kỹ thuật: trình duyệt chặn CORS đối với trang báo khác domain. Ngoài ra server còn phải chịu trách nhiệm chống SSRF, cache và giới hạn tải.

### 2.2 Ba tầng lưu trữ dữ liệu

| Tầng | Công nghệ | Phạm vi | Mất khi… |
|---|---|---|---|
| 1. Danh sách bài | `Map<string, Article>` trong RAM (`article.store.ts`) | Server | Restart server (được cứu bởi snapshot) |
| 2. Nội dung bài (HTML đã crawl) | `node-cache` trong RAM (`cache.service.ts`) | Server | Hết TTL (mặc định 6 giờ) |
| 3. Bài đã lưu | `localStorage` (`bookmarksSlice.ts`) | Trình duyệt | Xoá dữ liệu trình duyệt |

Ngoài ra có `server/data/snapshot.json` — ghi bài xuống đĩa sau mỗi lần refresh, đọc lại lúc khởi động để không phải chờ 5 phút mới có dữ liệu.

---

## 3. Quy trình chạy (dev / build / production)

### 3.1 npm workspaces

`package.json` gốc khai báo `"workspaces": ["client", "server"]` → chỉ cần `npm install` ở thư mục gốc là cài cho cả hai, dùng chung `node_modules`.

```bash
npm install          # cài toàn bộ workspace
npm run dev          # server :4000 + client :5173 chạy song song (concurrently)
npm run dev:server   # chỉ server
npm run dev:client   # chỉ client
npm run build        # build server (tsc) rồi client (tsc -b && vite build)
npm start            # chạy server bản build, phục vụ cả client/dist
npm run lint         # oxlint cho cả hai
npm run typecheck    # tsc --noEmit cho cả hai
npm test             # vitest
npm run verify:feeds   # kiểm tra từng URL RSS còn sống không
npm run verify:content # thử crawl nội dung, báo tỷ lệ thành công
npm run format        # prettier
```

### 3.2 Proxy ở dev

`client/vite.config.ts`:

```ts
server: {
  port: 5173,
  strictPort: true,
  proxy: {
    '/api': { target: 'http://localhost:4000', changeOrigin: true },
  },
},
```

Nhờ proxy này, `client/src/api/http.ts` dùng `baseURL: '/api'` — **đường dẫn tương đối**. Cùng code đó chạy được ở dev và production mà không cần đổi URL:

| Môi trường | Browser gọi | Thực tế |
|---|---|---|
| dev | `http://localhost:5173/api/articles` | Vite proxy → `http://localhost:4000/api/articles` |
| production | `http://localhost:4000/api/articles` | Express tự trả |

Có thể override bằng env `VITE_API_BASE_URL` (biến `VITE_*` được Vite expose ra client).

### 3.3 Cổng cố định `strictPort: true`

Nếu 5173 bị chiếm, Vite sẽ **báo lỗi** thay vì tự nhảy sang 5174 — tránh trường hợp bạn tưởng đang sửa code cũ.

---

## 4. Phía Server — phân tích chi tiết

Cấu trúc `server/src/` phân theo **layer** (mỗi layer chỉ gọi xuống layer dưới):

```text
index.ts  (bootstrap)
   │
   ├── app.ts            (cấu hình Express app)
   ├── jobs/refresh.job.ts
   └── services/
         ├── refresh.service.ts   ← điều phối
         ├── feed.service.ts      ← tải & chuẩn hoá RSS
         ├── article.store.ts     ← kho bài trong RAM
         ├── content.prefetch.ts  ← batch crawl
         ├── content.service.ts   ← crawl 1 bài
         ├── cache.service.ts     ← cache node-cache
         └── snapshot.service.ts  ← ghi/đọc JSON
```

### 4.1 `config/env.ts` — cấu hình có kiểm tra kiểu

Dùng **Zod** để validate `process.env` lúc khởi động. Nếu env sai → in lỗi chi tiết theo từng field và `process.exit(1)` **ngay lúc khởi động**, chứ không phải lúc request đến.

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  REFRESH_CRON: z.string().default('*/5 * * * *'),
  FEED_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  RETENTION_HOURS: z.coerce.number().int().positive().default(72),
  MAX_ARTICLES: z.coerce.number().int().positive().default(1500),
  CONTENT_TTL_HOURS: z.coerce.number().int().positive().default(6),
  CONTENT_PREFETCH_COUNT: z.coerce.number().int().min(0).default(30),
  CONTENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});
```

Ba kỹ thuật đáng chú ý:

- **`z.coerce.number()`** — biến môi trường luôn là **string**. `coerce` ép sang number trước khi validate, nên `PORT=abc` sẽ bị báo lỗi thay vì âm thầm thành `NaN`.
- **`.default(...)`** — mọi biến đều tuỳ chọn, có giá trị mặc định hợp lý → chạy được ngay không cần tạo `.env`.
- **`parsed.error.flatten().fieldErrors`** — in lỗi dạng `{ PORT: ["Expected number, received string"] }` thay vì dump object Zod khó đọc.

Sau đó:

```ts
export const config = {
  port: raw.PORT,
  corsOrigins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  userAgent: 'News24hBot/1.0 (+https://github.com/23130205-dev/app-news24h) Node fetch RSS reader for education',
} as const;
```

`as const` biến object thành kiểu literal readonly → `config.port` có kiểu `4000` thay vì `number`, giúp TypeScript bắt lỗi gõ nhầm.

**User-Agent** rất quan trọng: nhiều báo chặn request không có User-Agent hoặc UA giống bot không có email/URL → sẽ trả 403. UA có dạng `Bot/1.0 (+URL)` giúp trông minh bạc và hợp lệ.

### 4.2 `config/categories.ts` — chuyên mục chuẩn hoá

```ts
export const CATEGORIES = [
  { slug: 'thoi-su', name: 'Thời sự' },
  // ... 11 chuyên mục
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
```

Kỹ thuật **derive type từ value** (mô hình "single source of truth"):

```ts
type CategorySlug = (typeof CATEGORIES)[number]['slug'];
// → 'thoi-su' | 'the-gioi' | 'kinh-doanh' | ...
```

Thêm một chuyên mục vào mảng → `CategorySlug` tự cập nhật, không cần sửa type thủ công. Tương tự:

```ts
export const CATEGORY_SLUGS: readonly string[] = CATEGORIES.map((c) => c.slug);
export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name]),
);

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value);
}
```

`isCategorySlug` là **type guard**: khi `if (isCategorySlug(x))` thì TypeScript tự hiểu `x` là `CategorySlug` bên trong nhánh. Chuyên mục `tong-hop` không có trong danh sách này — nó là feed tổng hợp, dùng để đánh dấu "bài này chỉ biết từ feed tổng hợp".

### 4.3 `config/sources.ts` — khai báo nguồn RSS

Mỗi nguồn là một entry trong `SOURCES`:

```ts
{
  id: 'vnexpress',              // khoá duy nhất, dùng cho ?source=
  name: 'VnExpress',
  homepage: 'https://vnexpress.net',
  enabled: true,                // tắt nguồn lỗi bằng cách đặt false, KHÔNG xoá
  domains: ['vnexpress.net'],   // ← cơ chế chống SSRF
  contentSelector: '.article-content',  // tuỳ chọn: fallback khi Readability trích sai
  feeds: [
    { category: 'tong-hop', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
    { category: 'thoi-su', url: 'https://vnexpress.net/rss/thoi-su.rss' },
  ],
}
```

**`domains` là cơ chế chống SSRF** — điểm bảo mật quan trọng nhất của server. Chỉ URL thuộc domain đã khai báo mới được crawl:

```ts
export function isAllowedDomain(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return enabledSources().some((source) =>
    source.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
  );
}
```

Kiểm tra `hostname === domain || hostname.endsWith('.' + domain)` — chặn đúng `evil-vnexpress.net` nhưng vẫn cho qua `news.vnexpress.net`.

**`contentSelector`** là "bản vá" cho từng nguồn: nếu Readability lấy nhầm (ví dụ bắt phần bình luận), khai báo CSS selector riêng để lấy đúng thân bài.

### 4.4 `utils/` — các hàm tiện ích thuần khiết

#### `utils/hash.ts` — sinh ID ổn định

```ts
export function articleId(canonicalLink: string): string {
  return sha1(canonicalLink).slice(0, 16);
}
```

ID bài = SHA1 của URL chuẩn hoá, cắt còn 16 ký tự. Nhờ vậy:
- Cùng một bài từ nhiều feed (tổng hợp + chuyên mục) → **cùng ID** → tự gộp, không hiện trùng.
- ID không đổi giữa các lần chạy → client có thể cache theo ID.

#### `utils/url.ts` — chuẩn hoá URL

```ts
export function canonicalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  url.hash = '';
  url.hostname = url.hostname.toLowerCase();

  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign',
                          'utm_term', 'utm_content', 'fbclid', 'gclid'];
  for (const key of trackingParams) {
    url.searchParams.delete(key);
  }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  url.searchParams.sort();
  return url.toString();
}
```

Công việc của hàm này:
1. **Chặn protocol không an toàn** — chỉ nhận `http:`/`https:` (chặn `javascript:`, `file:`, `data:`).
2. **Bỏ hash** (`#section`) — cùng bài có nhiều link khác nhau.
3. **Bỏ tham số tracking** — `?utm_source=facebook` vs `?utm_source=twitter` là cùng 1 bài.
4. **Bỏ dấu `/` cuối** — `/bai-123` và `/bai-123/` là 1 bài.
5. **Sort query params** — thứ tự tham số không quan trọng.

Sau đó URL giống nhau → SHA1 giống nhau → cùng ID.

Các hàm còn lại:
- `hostnameOf(url)` — lấy hostname an toàn.
- `isHttpUrl(url)` — kiểm tra protocol.
- `resolveUrl(relative, base)` — `new URL(relative, base)` để đổi URL tương đối (`/img/a.jpg`) thành tuyệt đối.

#### `utils/text.ts` — xử lý text tiếng Việt

```ts
export function stripHtml(input: string): string {
  const text = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return decode(text).replace(/\s+/g, ' ').trim();
}
```

Ba bước: bỏ hết tag HTML → decode HTML entity (`&amp;` → `&`) → gộp khoảng trắng.

```ts
export function toSearchText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                                   // tách dấu ra khỏi ký tự gốc
    .replace(/[̀-ͯ]/g, '')                    // xoá dấu
    .replace(/đ/g, 'd')                                // đặc biệt: đ không tách được bằng NFD
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

Đây là hàm **quan trọng nhất cho tính năng tìm kiếm**. Giải thích:

- `normalize('NFD')` — Unicode "Normalization Form D" tách ký tự có dấu thành ký tự gốc + dấu. `"ệ"` → `"e" + "̣"`.
- `.replace(/[̀-ͯ]/g, '')` — xoá vùng U+0300 đến U+036F (các dấu tổ hợp) còn sót lại.
- `.replace(/đ/g, 'd')` — **điểm mấu chốt**: `"đ"` là một ký tự riêng (LATIN SMALL LETTER D WITH STROKE), **không** tách được bằng NFD. Nếu thiếu dòng này, tìm "viet nam" sẽ không khớp "Việt Nam" vì chữ "đ" vẫn còn dấu gạch.
- `.replace(/[^a-z0-9\s-]/g, ' ')` — bỏ mọi ký tự đặc biệt.

Kết quả: `"Việt Nam"` và `"viet nam"` → cùng chuỗi `"viet nam"`. Tìm kiếm không phân biệt dấu.

Chuỗi đã chuẩn hoá được **tính trước và lưu cùng bài** (`searchText` trong `article.store`), nên lúc tìm chỉ cần `includes` — không phải chuẩn hoá lại mỗi query. Đây là kỹ thuật **precomputed index**.

#### `utils/date.ts` — chuẩn hoá ngày đăng

```ts
export function parseDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;

  return parsed.toISOString();
}
```

- Trả `null` thay vì `new Date()` (giờ hiện tại) khi ngày sai — **quy tắc quan trọng của đề bài: bỏ item thiếu title/link hoặc ngày không hợp lệ, không thay bằng giờ hiện tại**. Nếu thay bằng giờ hiện tại, bài lỗi sẽ đẩy lên đầu trang "Tin mới nhất".
- Kiểm tra năm trong khoảng 2000–2100 để loại ngày 1970 (epoch mặc định).
- `toISOString()` → luôn là UTC với định dạng thống nhất.

#### `utils/async.ts` — giới hạn độ song song

```ts
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await worker(item, index);
    }
  });

  await Promise.all(runners);
  return results;
}
```

Đây là **worker pool** tự viết, thay cho `Promise.all(items.map(...))` (sẽ bắn đồng thời 50+ request → bị báo chặn).

Cách hoạt động:
- Tạo `limit` worker ("luồng").
- Biến `cursor` là **con trỏ chung** tới phần tử kế tiếp cần xử lý.
- Mỗi worker lấy `cursor`, tăng lên, rồi `await` xử lý → trong lúc chờ, worker khác nhảy vào lấy phần tử tiếp theo.
- `results[index] = ...` giữ **đúng thứ tự** đầu vào (không phụ thuộc thứ tự hoàn thành).

> Vì sao không dùng `Promise.allSettled` như SKILL.md gợi ý? `fetchFeed` đã **tự bắt lỗi bên trong** và trả về `{ ok: false, error }` thay vì reject → dùng `Promise.all` là an toàn, một feed lỗi không làm hỏng cả đợt.

#### `utils/html.ts` — làm sạch HTML (allowlist)

```ts
const ALLOWED_TAGS = ['p','h2','h3','h4','ul','ol','li','blockquote','strong','b',
  'em','i','br','a','figure','figcaption','img','table','thead','tbody','tr','th','td'];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  figure: ['class'],
  figcaption: ['class'],
};
```

**Chiến lược allowlist (danh sách cho phép) an toàn hơn blocklist** (danh sách cấm): `script`, `iframe`, `form`, `style`… không có trong allowlist nên **tự động bị xoá**. Không thể "lọt" bằng kỹ thuật né tránh.

```ts
transformTags: {
  a: (tagName, attribs) => {
    const href = attribs.href ? resolveUrl(attribs.href, baseUrl) : null;
    const next: Record<string, string> = {};
    if (href) {
      next.href = href;
      next.target = '_blank';
      next.rel = 'noopener noreferrer';
    }
    return { tagName, attribs: next };
  },
  img: (tagName, attribs) => {
    const rawSrc = attribs.src || attribs['data-src'] || attribs['data-original'];
    const src = rawSrc ? resolveUrl(rawSrc, baseUrl) : null;
    const next: Record<string, string> = {};
    if (src) next.src = src;
    if (attribs.alt) next.alt = attribs.alt;
    if (attribs.title) next.title = attribs.title;
    return { tagName, attribs: next };
  },
}
```

Ba việc trong `transformTags`:
1. **Link ngoài**: thêm `target="_blank"` + `rel="noopener noreferrer"`.
   - `noopener`: chặn `window.opener` → tab mới không đọc được tab cũ (chống tabnabbing).
   - `noreferrer`: không gửi referrer (trang báo không biết user đến từ đâu).
2. **URL tương đối → tuyệt đối** qua `resolveUrl(src, baseUrl)` — nếu không, `<img src="/a.jpg">` sẽ hỏng vì client không có domain gốc.
3. **Ảnh lazy-load**: nhiều báo dùng `data-src` / `data-original` thay cho `src` để trì hoãn tải → đổi sang `src`.

```ts
export function textLength(html: string): number {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, '').length;
}
```

Đo **độ dài text thực** (bỏ tag + bỏ khoảng trắng) — dùng để quyết định nội dung có đủ dài hay không.

`extractMeta(html, name)` đọc thẻ `<meta>` theo 4 biến thể thứ tự thuộc tính (`property` trước/sau `content`, `name` trước/sau) vì mỗi trang báo dùng thứ tự khác nhau.

### 4.5 `services/feed.service.ts` — tải & chuẩn hoá RSS

```ts
export async function fetchFeed(source: SourceConfig, feed: FeedConfig): Promise<FeedResult>
```

**Bước 1 — tải feed:**

```ts
const response = await fetch(feed.url, {
  headers: {
    'User-Agent': config.userAgent,
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  signal: AbortSignal.timeout(config.feedTimeoutMs),
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
```

- `AbortSignal.timeout(ms)` — timeout gốc của Node 18+, hủy request sau 10 giây.
- `response.ok` kiểm tra status 200–299.

**Bước 2 — parse:** `parser.parseString(xml)` với `new Parser({ timeout })`.

**Bước 3 — chuẩn hoá từng item**, bỏ qua item lỗi và **ghi lại lý do**:

```ts
for (const raw of parsed.items as RawItem[]) {
  const title = stripHtml(raw.title ?? '').trim();
  if (!title) {
    track('thiếu tiêu đề');
    continue;
  }

  const rawLink = raw.link ?? raw.guid ?? '';
  const canonical = canonicalizeUrl(rawLink);
  if (!canonical) {
    track('link không hợp lệ');
    continue;
  }

  const publishedAt = parseDate(raw.isoDate ?? raw.pubDate);
  if (!publishedAt) {
    track('ngày đăng không hợp lệ');
    continue;
  }

  const descriptionHtml = raw.description ?? raw.content ?? raw.contentSnippet ?? '';
  const summary = stripHtml(descriptionHtml);

  items.push({
    id: articleId(canonical),
    title,
    summary,
    thumbnail: pickThumbnail(raw, descriptionHtml),
    link: canonical,
    sourceId: source.id,
    source: source.name,
    category: feed.category,
    publishedAt,
  });
}
```

Các quyết định quan trọng:
- **Bỏ item lỗi, không làm hỏng feed** — `continue` thay vì `throw`.
- **`skippedReasons`** đếm lý do bỏ → giúp debug ("feed này mất 30% bài vì thiếu ngày").
- `raw.guid` là fallback cho link — một số feed dùng `guid` làm URL.

**Bước 4 — lấy ảnh theo thứ tự ưu tiên:**

```ts
function pickThumbnail(item: RawItem, descriptionHtml: string): string | undefined {
  const candidates = [
    item.enclosure?.url,
    item['media:content']?.$?.url,
    item['media:thumbnail']?.$?.url,
  ];

  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
  }

  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descriptionHtml);
  return imgMatch?.[1];
}
```

Thứ tự: `enclosure` → `media:content` → `media:thumbnail` → `<img>` đầu tiên trong mô tả. Chỉ nhận URL `http(s)`.

**Bước 5 — bắt lỗi toàn cục:**

```ts
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    sourceId: source.id, source: source.name, category: feed.category,
    url: feed.url, ok: false, error: message,
    items: [], total: 0, skipped: 0, skippedReasons,
  };
}
```

Hàm **không bao giờ throw** — luôn trả về object có `ok`. Nhờ vậy `refresh.service` xử lý được feed lỗi mà không cần try/catch từng chỗ.

### 4.6 `services/article.store.ts` — kho bài trong RAM

Đây là "database" của dự án (dạng in-memory).

```ts
interface StoredArticle extends Article {
  searchText: string;
}

export class ArticleStore {
  private articles = new Map<string, StoredArticle>();
  private lastUpdatedAt = new Date().toISOString();
}
```

Dùng `Map` thay vì object thường: truy vấn O(1) bằng `id`, không cần `Object.keys()`.

`StoredArticle` mở rộng `Article` bằng `searchText` — trường nội bộ, **không bao giờ trả ra ngoài API** (xem `toPublic`).

#### `upsertMany` — gộp bài mới vào kho

```ts
for (const article of incoming) {
  const existing = this.articles.get(article.id);

  if (!existing) {
    this.articles.set(article.id, { ...article, searchText: this.buildSearchText(article) });
    added += 1;
    continue;
  }

  const merged: StoredArticle = {
    ...existing,
    ...article,
    category:
      existing.category === 'tong-hop' && article.category !== 'tong-hop'
        ? article.category
        : existing.category,
    summary: article.summary || existing.summary,
    thumbnail: article.thumbnail ?? existing.thumbnail,
    searchText: '',
  };
  merged.searchText = this.buildSearchText(merged);
  this.articles.set(article.id, merged);
}
```

**Quy tắc gộp quan trọng:** nếu bài đã có category `tong-hop` (chỉ biết từ feed tổng hợp) mà lần này xuất hiện ở feed chuyên mục → **nâng lên category chuyên mục** (cụ thể hơn). Ngược lại giữ category cũ. Nhờ vậy bài không bị mất chuyên mục chỉ vì refresh sớm hơn feed chuyên mục.

`summary: article.summary || existing.summary` — ưu tiên summary mới nếu có, không ghi đè bằng chuỗi rỗng.
`thumbnail: article.thumbnail ?? existing.thumbnail` — dùng `??` (nullish) nên giữ ảnh cũ nếu bài mới không có ảnh.

#### `prune` — dọn bài cũ

```ts
private prune(): void {
  const cutoff = Date.now() - config.retentionHours * 3600 * 1000;

  for (const [id, article] of this.articles) {
    if (new Date(article.publishedAt).getTime() < cutoff) {
      this.articles.delete(id);
    }
  }

  if (this.articles.size > config.maxArticles) {
    const sorted = [...this.articles.values()].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const keep = new Set(sorted.slice(0, config.maxArticles).map((a) => a.id));
    for (const id of this.articles.keys()) {
      if (!keep.has(id)) this.articles.delete(id);
    }
  }
}
```

Hai cơ chế giới hạn bộ nhớ:
1. **Theo thời gian**: bài cũ hơn `RETENTION_HOURS` (72h) bị xoá.
2. **Theo số lượng**: nếu vẫn > `MAX_ARTICLES` (1500), giữ lại 1500 bài mới nhất.

Hệ quả trực tiếp: `GET /api/articles/:id` có thể trả **404** cho bài cũ — client phải xử lý (đã có trong `ErrorState`).

#### `query` — lọc, sắp xếp, phân trang

```ts
query(options: QueryOptions): QueryResult {
  const { category, source, q, page, limit } = options;

  let filtered = [...this.articles.values()];

  if (category) filtered = filtered.filter((a) => a.category === category);
  if (source)   filtered = filtered.filter((a) => a.sourceId === source);
  if (q) {
    const needle = toSearchText(q);
    filtered = needle ? filtered.filter((a) => a.searchText.includes(needle)) : filtered;
  }

  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const items = filtered.slice(start, start + limit).map(this.toPublic);

  return { items, meta: { page: safePage, limit, total, totalPages, updatedAt: this.lastUpdatedAt } };
}
```

Điểm cần lưu ý:
- `safePage` **clamp** vào `[1, totalPages]` → `?page=999` không lỗi, trả trang cuối.
- `totalPages = Math.max(1, ...)` → danh sách rỗng vẫn có `totalPages: 1`.
- `query` là **một hàm duy nhất** phục vụ cả `/articles`, `/articles/latest`, `/search`. `latest()` chỉ là `query({ page: 1, limit })` — không cần code riêng.
- `map(this.toPublic)` — `toPublic` là method không dùng `this` bên trong nên truyền trực tiếp làm callback hợp lệ.

#### `featured` — bài nổi bật

```ts
featured(limit: number): Article[] {
  const sorted = this.query({ page: 1, limit: Math.max(limit * 6, 40) }).items;
  const withImage = sorted.filter((a) => a.thumbnail);
  const result: Article[] = [];
  const usedSources = new Set<string>();

  for (const article of withImage) {
    if (result.length >= limit) break;
    if (usedSources.has(article.sourceId)) continue;
    usedSources.add(article.sourceId);
    result.push(article);
  }

  for (const article of withImage) {
    if (result.length >= limit) break;
    if (result.includes(article)) continue;
    result.push(article);
  }

  return result;
}
```

**Thuật toán 2 vòng** để đảm bảo đa dạng nguồn:
1. Vòng 1: lấy bài **đầu tiên** của mỗi nguồn → kết quả "xen kẽ" 5 nguồn khác nhau.
2. Vòng 2: nếu vẫn thiếu, lấy thêm bài bất kỳ (có ảnh).

Chỉ lấy bài **có ảnh** vì bài nổi bật cần thumbnail.

#### `related` — bài liên quan

```ts
related(id: string, limit: number): Article[] {
  const target = this.articles.get(id);
  if (!target) return [];

  return this.query({ category: target.category, page: 1, limit: limit + 1 })
    .items.filter((a) => a.id !== id)
    .slice(0, limit);
}
```

Tái sử dụng `query` với `category` của bài gốc, lấy `limit + 1` rồi loại chính bài đó đi.

#### `hydrate` — nạp lại từ snapshot

```ts
hydrate(articles: Article[]): void {
  for (const article of articles) {
    this.articles.set(article.id, { ...article, searchText: this.buildSearchText(article) });
  }
  this.prune();
  this.lastUpdatedAt = new Date().toISOString();
}
```

Phải **dựng lại `searchText`** vì snapshot JSON chỉ lưu `Article` (không lưu trường nội bộ).

### 4.7 `services/cache.service.ts` — cache 2 tầng

```ts
const queryCache = new NodeCache({ stdTTL: 30, checkperiod: 30 });

const contentCache = new NodeCache({
  stdTTL: config.contentTtlHours * 3600,
  checkperiod: 600,
  maxKeys: 1000,
});
```

| Cache | TTL | Mục đích |
|---|---|---|
| `queryCache` | 30 giây | Cache kết quả truy vấn list (hiện chưa dùng ở controller, `clearQuery()` được gọi sau mỗi refresh) |
| `contentCache` | 6 giờ (mặc định) | Cache nội dung HTML đã crawl |

Tham số `node-cache`:
- `stdTTL` — thời gian sống (giây).
- `checkperiod` — chu kỳ quét để xoá key hết hạn (giảm rò rỉ bộ nhớ).
- `maxKeys` — giới hạn số phần tử, tự xoá key cũ nhất khi vượt.

### 4.8 `services/content.service.ts` — crawl nội dung bài (trái tim của dự án)

```ts
const MIN_TEXT_LENGTH = 400;
const inflight = new Map<string, Promise<ArticleContent>>();
```

#### Gộp request trùng lặp (`inflight`)

Đây là kỹ thuật **request coalescing / deduplication**. Nếu 5 người cùng mở cùng 1 bài chưa có trong cache, server chỉ crawl **một lần**, 4 người còn lại chờ chung promise:

```ts
export async function getContent(article: Article): Promise<ArticleContent> {
  const cached = cacheService.getContent(article.id);
  if (cached) return cached;

  const existing = inflight.get(article.id);
  if (existing) return existing;

  const task = crawl(article)
    .then((content) => {
      cacheService.setContent(article.id, content);
      return content;
    })
    .finally(() => {
      inflight.delete(article.id);
    });

  inflight.set(article.id, task);
  return task;
}
```

Luồng: kiểm tra cache → kiểm tra inflight → tạo task mới, ghi vào `inflight` → `.finally()` xoá khỏi `inflight` (kể cả khi lỗi).

> `.finally()` xoá cả khi thất bại — nếu không, một bài lỗi sẽ bị "cache" vĩnh viễn và mọi request sau đều nhận lỗi.

#### Quy trình crawl

```ts
async function crawl(article: Article): Promise<ArticleContent> {
  if (!isAllowedDomain(article.link)) {
    throw new ContentUnavailableError('Tên miền bài viết không nằm trong danh sách nguồn được phép');
  }

  const html = await downloadHtml(article.link);

  const source = findSourceById(article.sourceId);
  let rawContent: string | null = null;

  const readability = extractWithReadability(html);
  if (readability && textLength(readability.content) >= MIN_TEXT_LENGTH) {
    rawContent = readability.content;
  }

  if (!rawContent && source?.contentSelector) {
    const selected = extractWithSelector(html, source.contentSelector);
    if (selected && textLength(selected) >= MIN_TEXT_LENGTH) {
      rawContent = selected;
    }
  }

  if (!rawContent) {
    throw new ContentUnavailableError('Không trích được nội dung bài viết từ trang báo');
  }

  const contentHtml = sanitizeArticleHtml(rawContent, article.link);

  if (textLength(contentHtml) < 200) {
    throw new ContentUnavailableError('Nội dung bài viết quá ngắn sau khi làm sạch');
  }
  ...
}
```

**Chiến lược trích xuất 2 tầng:**
1. **Readability** (thuật toán Mozilla) — tự phân tích cấu trúc trang, tìm vùng nội dung chính, loại bỏ sidebar/quảng cáo/bình luận. Hoạt động tốt với ~80% bài.
2. **Fallback `contentSelector`** — nếu Readability thất bại hoặc ra nội dung quá ngắn, dùng CSS selector khai báo riêng cho nguồn đó trong `sources.ts`.

**Ba ngưỡng chất lượng:**
| Ngưỡng | Giá trị | Ý nghĩa |
|---|---|---|
| `MIN_TEXT_LENGTH` | 400 | Nội dung trích ra phải dài hơn 400 ký tự mới coi là thành công |
| (sau sanitize) | 200 | Sau khi làm sạch còn phải ≥ 200 ký tự |

Các ngưỡng này chống việc trả về trang "Paywall" hoặc trang lỗi.

**Đường dẫn bảo mật quan trọng:** kiểm tra `isAllowedDomain` **trước khi** tải — không tải thì không cần kiểm tra sau.

#### `extractWithReadability`

```ts
function extractWithReadability(html: string): { content: string; title?: string } | null {
  try {
    const dom = new JSDOM(html);
    const article = new Readability(dom.window.document).parse();
    if (!article?.content) return null;
    return { content: article.content, title: article.title ?? undefined };
  } catch {
    return null;
  }
}
```

- `JSDOM(html)` — dựng DOM tree từ chuỗi HTML trong Node (Node không có DOM sẵn).
- `new Readability(document).parse()` — thuật toán phân tích: chấm điểm từng khối nội dung, chọn khối điểm cao nhất, loại nội dung không liên quan.
- `try/catch` vì Readability có thể ném lỗi với HTML lỗi.

### 4.9 `services/content.prefetch.ts` — batch crawl trước

```ts
const PREFETCH_CONCURRENCY = 3;
const PREFETCH_DELAY_MS = 400;

export async function prefetchContent(): Promise<void> {
  const count = config.contentPrefetchCount;
  if (count <= 0) return;

  const cached = cacheService.contentIds();
  const pending = articleStore.recentWithoutContent(cached, count);

  if (pending.length === 0) return;

  console.log(`[prefetch] Bắt đầu tải trước ${pending.length} bài mới nhất`);

  let cursor = 0;
  let done = 0;
  let failed = 0;

  const workers = Array.from(
    { length: Math.min(PREFETCH_CONCURRENCY, pending.length) },
    async () => {
      while (cursor < pending.length) {
        const index = cursor;
        cursor += 1;
        const article = pending[index];
        if (!article) continue;

        try {
          await getContent(article);
          done += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[prefetch] Không lấy được nội dung "${article.title}": ${message}`);
        }

        await sleep(PREFETCH_DELAY_MS);
      }
    },
  );

  await Promise.all(workers);
  console.log(`[prefetch] Hoàn tất: ${done} thành công, ${failed} lỗi`);
}
```

Ba quy tắc "lịch sự" với trang báo:
1. **Concurrency = 3** — không dồn tải.
2. **`sleep(400)`** giữa các request — giãn tải.
3. **Bỏ qua lỗi** — một bài lỗi không dừng cả batch.

`recentWithoutContent(existingIds, limit)` lấy các bài mới nhất **chưa có** trong cache:

```ts
recentWithoutContent(existingIds: Set<string>, limit: number): Article[] {
  return this.query({ page: 1, limit: Math.max(limit * 3, 30) })
    .items.filter((a) => !existingIds.has(a.id))
    .slice(0, limit);
}
```

Lấy `limit * 3` rồi lọc → vì trong 30 bài mới nhất có thể đã có nhiều bài đã cache.

### 4.10 `services/snapshot.service.ts` — ghi/đọc JSON an toàn

```ts
const tempPath = `${snapshotPath}.tmp`;
await writeFile(tempPath, payload, 'utf8');
await rename(tempPath, snapshotPath);
```

**Ghi file kiểu atomic**: ghi vào file `.tmp` trước, rồi `rename()` sang file đích. `rename` trên cùng filesystem là thao tác nguyên tử (atomic) → server bị kill giữa lúc ghi **không để lại file JSON hỏng**.

`readSnapshot` bọc trong try/catch và kiểm tra shape:

```ts
const parsed: unknown = JSON.parse(raw);
if (!parsed || typeof parsed !== 'object' || ('articles' in parsed) === false) return [];
const articles = (parsed as { articles: unknown }).articles;
if (!Array.isArray(articles)) return [];
return articles as Article[];
```

Dùng `unknown` rồi thu hẹp dần (theo quy tắc "cấm `any`" của dự án).

### 4.11 `services/refresh.service.ts` — điều phối

```ts
export async function refreshAll(): Promise<RefreshSummary> {
  const sources = enabledSources();

  const tasks = sources.flatMap((source) =>
    source.feeds.map((feed) => ({ source, feed })),
  );

  const results = await mapWithConcurrency(tasks, FEED_CONCURRENCY, async ({ source, feed }) =>
    fetchFeed(source, feed),
  );
  ...
}
```

`flatMap` biến `Source[]` (mỗi nguồn có nhiều feed) thành danh sách phẳng `Task[]` — mỗi task là (nguồn, feed). Tổng cộng ~57 feed.

Sau đó:

```ts
const added = articleStore.upsertMany(allArticles);
cacheService.clearQuery();

const feedsOk = results.filter((r) => r.ok).length;
const feedsFailed = results.length - feedsOk;

lastRefreshAt = new Date().toISOString();
lastSummary = { startedAt, finishedAt: lastRefreshAt, added, feedsOk, feedsFailed, sources: [...] };

await writeSnapshot(articleStore.snapshot());

console.log(`[refresh] ${feedsOk}/${results.length} feed thành công, thêm ${added} bài, tổng ${articleStore.size}`);

void prefetchContent();

return summary;
```

Chú ý `void prefetchContent()` — có `void` để nói với TypeScript/linter "gọi nhưng không await" (fire-and-forget). Nếu `await`, refresh sẽ bị chặn thêm vài phút do crawl 30 bài.

**`getSourceStatuses()`** trả về trạng thái từng nguồn: nếu chưa refresh lần nào (`lastSummary === null`) thì tất cả `ok: false`; ngược lại lấy từ summary vừa rồi kèm số bài hiện tại.

### 4.12 `jobs/refresh.job.ts` — hẹn giờ bằng cron

```ts
let running = false;

async function runOnce(): Promise<void> {
  if (running) {
    console.log('[job] Bỏ qua vì đợt làm mới trước chưa xong');
    return;
  }
  running = true;
  try {
    await refreshAll();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[job] Làm mới thất bại: ${message}`);
  } finally {
    running = false;
  }
}

export function startRefreshJob(): void {
  if (!cron.validate(config.refreshCron)) {
    console.error(`[job] Biểu thức cron không hợp lệ: ${config.refreshCron}`);
    return;
  }

  cron.schedule(config.refreshCron, () => {
    void runOnce();
  });

  void runOnce();
}
```

**Cờ chống chạy chồng (`running`)**: nếu một đợt refresh mất > 5 phút (mạng chậm), cron sẽ kích hoạt lần nữa. Không có cờ này, sẽ có nhiều đợt chạy song song → tranh chấp ghi snapshot, dồn tải trang báo.

`cron.validate()` kiểm tra biểu thức cron trước khi đăng ký — tránh crash vì env sai.

`void runOnce()` ở cuối = **refresh ngay khi khởi động**, không phải chờ 5 phút.

### 4.13 `middlewares/` — validation và xử lý lỗi tập trung

#### `validate.ts`

```ts
export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          `Tham số truy vấn không hợp lệ: ${result.error.issues.map((i) => i.message).join(', ')}`,
        ),
      );
      return;
    }
    res.locals.parsedQuery = result.data;
    next();
  };
}
```

Đây là **middleware factory** (hàm trả về middleware):
- `safeParse` không throw → kiểm tra `result.success`.
- Khi lỗi → `next(new ApiError(...))` → chuyển sang error handler.
- Khi thành công → ghi kết quả đã parse (đã có sẵn kiểu đúng, đã coerce) vào `res.locals.parsedQuery`.

**Tại sao dùng `res.locals`?** `req.query` của Express là object `string` thô. Sau validate, ta muốn `page` là `number`, `limit` là `number` đã clamp trong khoảng 1–50. `res.locals` là nơi lưu dữ liệu trong vòng đời request mà không đụng vào `req` (Express 5 đã read-only `req.query`).

#### `error.ts` — error handler tập trung

```ts
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof Error && err.name === 'ContentUnavailableError') {
    res.status(502).json({ error: { code: 'CONTENT_UNAVAILABLE', message: err.message } });
    return;
  }

  const message = err instanceof Error ? err.message : 'Lỗi không xác định';
  console.error('[error]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}
```

Điểm mấu chốt của Express: **error handler phải có đúng 4 tham số** `(err, req, res, next)`. Nếu bỏ `_next`, Express hiểu là middleware thường → không bắt lỗi.

Mọi lỗi ra ngoài đều có **cùng một hình dạng** `{ error: { code, message } }` → client xử lý đồng nhất.

`ApiError` là class lỗi có `status` + `code`:

```ts
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
```

Kế thừa `Error` → dùng được `instanceof`, `stack`, `message`.

### 4.14 `routes/index.ts` — định tuyến

```ts
const apiRouter = Router();

apiRouter.use(apiLimiter);

apiRouter.get('/health', healthController);
apiRouter.get('/categories', categoriesController);
apiRouter.get('/sources', sourcesController);
apiRouter.post('/refresh', refreshController);

apiRouter.get('/articles/latest', validateQuery(latestQuerySchema), latestController);
apiRouter.get('/articles/featured', validateQuery(featuredQuerySchema), featuredController);
apiRouter.get('/articles/rss.xml', validateQuery(rssQuerySchema), rssController);
apiRouter.get('/articles', validateQuery(listQuerySchema), listArticlesController);
apiRouter.get('/articles/:id', getArticleController);
apiRouter.get('/articles/:id/related', validateQuery(relatedQuerySchema), relatedController);
apiRouter.get('/articles/:id/content', contentLimiter, contentController);

apiRouter.get('/search', validateQuery(searchQuerySchema), searchController);
```

**Thứ tự route rất quan trọng**: `/articles/latest` phải khai báo **trước** `/articles/:id`. Nếu ngược lại, `GET /articles/latest` sẽ bị khớp với `:id = "latest"` → trả 404 "Bài viết không tồn tại". Tương tự `/articles/rss.xml` cũng phải đứng trước `/articles/:id`, nếu không nó sẽ bị hiểu là `:id = "rss.xml"`.

**Hai tầng rate limit:**

```ts
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const contentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
```

- `/api/*`: 300 request/phút — các endpoint rẻ.
- `/api/articles/:id/content`: 30 request/phút — endpoint **đắt** (gây tải lên trang báo).

`contentLimiter` đặt ở route cụ thể nên nó **cộng dồn** vào limiter chung (cả 2 đều áp dụng).

### 4.15 `controllers/article.controller.ts`

```ts
function requireArticle(id: string): Article {
  const article = articleStore.getById(id);
  if (!article) {
    throw new ApiError(404, 'NOT_FOUND', 'Bài viết không tồn tại hoặc đã hết thời hạn lưu giữ');
  }
  return article;
}
```

**Controller không dùng try/catch** — lỗi `throw` ra, Express bắt và chuyển tới `errorHandler`. Đây là cách Express 5 xử lý lỗi: lỗi throw trong handler async sẽ tự được chuyển tiếp (Express 5 hỗ trợ promise rejection).

`paramId` xử lý trường hợp `req.params.id` là `string | string[]` (Express 5 đổi kiểu `ParamsDictionary`).

### 4.16 `app.ts` — cấu hình Express

```ts
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(cors({ origin: config.corsOrigins, credentials: false }));
app.use('/api', apiRouter);

if (isProduction) {
  app.use(express.static(clientDist, { index: false }));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
```

Điểm hay:
- `app.disable('x-powered-by')` — không tiết lộ đang dùng Express.
- **CSP tự viết** thay vì dùng default của helmet: `imgSrc` cho phép `https:` (bắt buộc vì ảnh bài từ CDN báo), `styleSrc` cho phép `'unsafe-inline'` (Bootstrap inject style).
- `crossOriginResourcePolicy: 'cross-origin'` — cho phép ảnh từ CDN khác origin hiển thị được.
- **`credentials: false`** — không dùng cookie, không cần CORS credentials.
- **SPA fallback**: mọi URL không phải `/api` → trả `index.html`. Nhờ vậy khi user F5 trên `/bai-viet/abc` (React Router route), server vẫn trả app thay vì 404. Điều kiện `req.path.startsWith('/api')` để API 404 đúng kiểu JSON.
- `/{*splat}` — cú pháp wildcard của **Express 5** (Express 4 dùng `*`).
- **Thứ tự middleware**: `notFoundHandler` và `errorHandler` đặt cuối cùng.

### 4.17 `index.ts` — bootstrap

```ts
async function bootstrap(): Promise<void> {
  const snapshot = await readSnapshot();
  if (snapshot.length > 0) {
    articleStore.hydrate(snapshot);
    console.log(`[startup] Khôi phục ${snapshot.length} bài từ snapshot`);
  }

  startRefreshJob();

  const server = app.listen(config.port, () => {
    console.log(`[startup] Server đang lắng nghe tại http://localhost:${config.port}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[shutdown] Nhận ${signal}, đang đóng server`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
```

**Graceful shutdown**: khi bấm Ctrl+C, `server.close()` dừng nhận connection mới, đợi các request đang chạy xong rồi `exit(0)`. `setTimeout(..., 5000).unref()` là **phao cứu**: nếu sau 5 giây vẫn chưa đóng thì `exit(1)`. `.unref()` để timer đó không giữ process sống.

Thứ tự khởi động rất hợp lý: **đọc snapshot TRƯỚC khi bắt đầu refresh** → server có dữ liệu ngay, không để trống 5 phút.

### 4.18 `scripts/verify-feeds.ts` và `verify-content.ts`

Hai script kiểm tra chất lượng dữ liệu thật, chạy bằng `tsx` (chạy TypeScript trực tiếp, không cần build).

`verify-feeds.ts` in bảng: nguồn, chuyên mục, trạng thái, số bài, % có ảnh, % có ngày, ngày mới nhất. **Exit code 1 nếu < 3 nguồn hoạt động** → dùng được trong CI.

`verify-content.ts` thử crawl 3 bài mỗi nguồn, đo số ký tự, số ảnh, thời gian tải. **Exit code 1 nếu một nguồn lấy được < 2/3 số bài thử** → báo để thêm `contentSelector`.

---

## 5. Phía Client — phân tích chi tiết

### 5.1 Cấu trúc thư mục

```text
client/src/
├── main.tsx              # entry point: Provider + RouterProvider
├── router.tsx            # cây route
├── api/
│   ├── http.ts           # axios instance + chuẩn hoá lỗi
│   └── endpoints.ts      # hàm gọi API (thunk gọi vào đây)
├── store/
│   ├── index.ts          # configureStore
│   ├── hooks.ts          # useAppDispatch / useAppSelector có kiểu
│   └── slices/           # categories · articles · articleContent · bookmarks
├── layouts/              # RootLayout · CategoryLayout
├── components/
│   ├── layout/           # AppNavbar · AppFooter
│   ├── article/          # ArticleCard · ArticleMeta · ArticleBody · SafeImage
│   └── common/           # Loading · ErrorState · EmptyState
├── pages/                # HomePage · CategoryIndexPage · CategoryPage
│                         # ArticleDetailPage · SearchPage · SavedPage · NotFoundPage
├── hooks/                # useDebounce · usePolling
├── lib/                  # time · constants · storage
├── types/article.ts
└── styles/               # main.scss · _variables.scss · _custom.scss
```

### 5.2 `main.tsx` — entry point

```tsx
void store.dispatch(fetchCategories());
void store.dispatch(fetchSources());

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
```

**Hai lệnh dispatch nằm TRƯỚC `createRoot().render()`** là cố ý. Đề bài yêu cầu danh sách chuyên mục và nguồn tin được gọi **1 lần duy nhất khi khởi động ứng dụng** rồi lưu vào Redux Store để dùng xuyên suốt các trang. Dispatch ở đây (thay vì trong `AppNavbar`) đảm bảo dữ liệu đã nằm trong store trước khi bất kỳ trang nào render → không có hiện tượng menu nháy rỗng rồi mới có dữ liệu.

Ba tầng provider, từ ngoài vào trong:
1. `StrictMode` — React tự phát hiện side-effect trong effect (chỉ ở dev).
2. `Provider store={store}` — cung cấp Redux cho toàn cây.
3. `RouterProvider router={router}` — render component theo URL hiện tại.

### 5.3 `router.tsx` — 3 khái niệm React Router bắt buộc

```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'chuyen-muc',
        element: <CategoryLayout />,
        children: [
          { index: true, element: <CategoryIndexPage /> },
          { path: ':slug', element: <CategoryPage /> },
        ],
      },
      { path: 'bai-viet/:id', element: <ArticleDetailPage /> },
      { path: 'tim-kiem', element: <SearchPage /> },
      { path: 'da-luu', element: <SavedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

Cây route (minh hoạ vị trí render):

```text
"/"                 → RootLayout  (Navbar + <Outlet/> + Footer + ScrollRestoration)
 ├─ index           → HomePage          ← INDEX ROUTE
 ├─ "chuyen-muc"    → CategoryLayout    (cột menu bên trái + <Outlet/>)
 │    ├─ index      → CategoryIndexPage ← INDEX ROUTE lồng
 │    └─ ":slug"    → CategoryPage
 ├─ "bai-viet/:id"  → ArticleDetailPage
 ├─ "tim-kiem"      → SearchPage
 ├─ "da-luu"        → SavedPage
 └─ "*"             → NotFoundPage
```

| Khái niệm | Áp dụng ở đâu | Ý nghĩa |
|---|---|---|
| **Layout route** | `RootLayout`, `CategoryLayout` | Đặt component khung, bên trong có `<Outlet/>` làm chỗ hiển thị con |
| **Index route** | `index: true` ở `/` và `/chuyen-muc` | Route cha hiển thị gì khi chưa chọn route con |
| **Outlet** | `<Outlet/>` trong cả 2 layout | Điểm móc nối: con render vào đây |

**Vì sao cần layout route?** Nếu đặt `<Navbar/>` trong từng page → lặp code 7 lần, đổi navbar phải sửa 7 file. Với layout route → sửa 1 file `RootLayout.tsx`.

**Vì sao cần index route?** `/chuyen-muc` không có `:slug` → cần biết hiển thị gì. Không có index route thì `CategoryLayout` sẽ render ra `<Outlet/>` rỗng.

**Vì sao cần Outlet?** Mỗi page là con của layout, render vào `<Outlet/>` của layout → cấu trúc UI lồng nhau, không phải phẳng.

### 5.4 `layouts/RootLayout.tsx`

```tsx
export function RootLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <AppFooter />
      <ScrollRestoration />
    </div>
  );
}
```

- `min-vh-100` + `flex-grow-1` → footer luôn ở đáy trang dù nội dung ngắn.
- `ScrollRestoration` (React Router 6.4+) → khi điều hướng, trang cuộn về đầu; khi bấm nút Back, trả lại vị trí đã cuộn.

### 5.5 `store/index.ts` — cấu hình Redux

```ts
export const rootReducer = {
  categories: categoriesReducer,
  sources: sourcesReducer,
  articles: articlesReducer,
  articleContent: articleContentReducer,
  bookmarks: bookmarksReducer,
  auth: authReducer,
  interaction: interactionReducer,
};

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

`RootState` và `AppDispatch` được **derive bằng `typeof`**, không viết tay → không bao giờ lệch với store thật.

Tách `rootReducer` ra khỏi `configureStore` là để **test có thể dựng lại đúng shape của store thật**
(`configureStore({ reducer: rootReducer })`). Nếu test tự tạo store với `{ sources: sourcesReducer }`
thì các selector nhận `RootState` sẽ lỗi type — đây là lý do `rootReducer` phải export.

**Vì sao có `auth` và `interaction`?** Hai slice này thuộc phần Ngân, nhưng khai báo chúng ở đây giúp:
- store có sẵn shape ổn định để mọi selector dùng chung một kiểu `RootState`;
- không phát sinh conflict khi Ngân pull code (chỉ cần điền logic vào file slice, không phải sửa `store/index.ts`);
- `AppDispatch` đã biết trước các action thunk mà Ngân sẽ thêm sau.

### 5.6 `store/hooks.ts` — hook có kiểu

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

`.withTypes<T>()` là API của React-Redux 9: giờ `useAppDispatch()` trả về `AppDispatch` (biết cả action thunk) và `useAppSelector` biết `RootState`. Không dùng `useDispatch`/`useSelector` trần trong component — đó là quy tắc của dự án.

### 5.7 `store/slices/articlesSlice.ts` — slice phức tạp nhất

#### `createEntityAdapter` — chuẩn hoá entity

```ts
const articlesAdapter = createEntityAdapter<Article>();

const initialState: ArticlesState = articlesAdapter.getInitialState({
  lists: {},
});
```

`EntityState` có dạng:

```ts
{
  ids: string[],              // danh sách id
  entities: { [id]: Article } // bản tra cứu
}
```

**Lợi ích**: bài viết được lưu **một lần duy nhất** trong `entities`. Nhiều danh sách (latest, featured, category:the-thao, search:xyz) chỉ lưu **mảng id** → không trùng lặp dữ liệu, cập nhật một bài ở mọi nơi cùng lúc.

#### Cấu trúc state

```ts
interface ListEntry {
  ids: string[];
  status: RequestStatus;
  error: string | null;
  meta: ListMeta | null;
}

interface ArticlesState extends EntityState<Article, string> {
  lists: Record<string, ListEntry>;
}
```

`lists` là **dictionary** key → entry, key sinh bằng hàm:

```ts
export const LIST_LATEST = 'latest';
export const LIST_FEATURED = 'featured';

export function listKeyCategory(category: string): string {
  return `category:${category}`;
}

export function listKeySearch(q: string): string {
  return `search:${q}`;
}
```

Key có tiền tố → tránh trùng giữa các loại danh sách.

#### `createAsyncThunk`

```ts
export const fetchLatest = createAsyncThunk('articles/fetchLatest', async (arg: number | undefined) => {
  return getLatest(arg ?? 20);
});
```

`createAsyncThunk` sinh ra 3 action: `pending`, `fulfilled`, `rejected`. Payload creator trả về dữ liệu; lỗi được bắt tự động và gói vào `action.error`.

#### `extraReducers` — xử lý 3 trạng thái

```ts
.addCase(fetchLatest.pending, (state) => {
  const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
  entry.status = 'loading';
  entry.error = null;
})
.addCase(fetchLatest.fulfilled, (state, action) => {
  const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
  entry.status = 'succeeded';
  articlesAdapter.upsertMany(state, action.payload.data);
  entry.ids = action.payload.data.map((a) => a.id);
  entry.meta = action.payload.meta;
})
.addCase(fetchLatest.rejected, (state, action) => {
  const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
  entry.status = 'failed';
  entry.error = toApiError(action.error).message;
})
```

Toàn bộ logic lặp lại cho 4 thunk → **không dùng `createSlice` cho từng list riêng**, mà dùng `extraReducers` + `builder.addCase`.

**Mẹo hữu ích**: `state.lists[KEY] ??= { ...emptyEntry }` — cú pháp `??=` gán giá trị mặc định nếu chưa có. Dùng `{ ...emptyEntry }` (spread) chứ không phải `emptyEntry` để không dùng chung cùng object tham chiếu.

**Immer**: `createSlice` tự động dùng Immer — có thể viết `entry.status = 'loading'` "trực tiếp" mà vẫn an toàn, vì Immer tạo bản sao, không mutate state gốc.

#### Selector

```ts
const selectArticlesEntities = (state: RootState) => state.articles.entities;

export const selectListEntry = (state: RootState, key: string): ListEntry =>
  state.lists[key] ?? emptyEntry;

export const EMPTY_IDS: string[] = [];

export const selectListIds = (state: RootState, key: string): string[] =>
  state.articles.lists[key]?.ids ?? EMPTY_IDS;

export const selectArticleById = (state: RootState, id: string): Article | undefined =>
  state.articles.entities[id];
```

**`EMPTY_IDS` là hằng số module-level** — quan trọng cho React-Redux: nếu selector trả về `[]` mới mỗi lần gọi, `useSelector` sẽ thấy reference khác → re-render liên tục. Trả về cùng một mảng rỗng giữ ổn định reference.

### 5.8 `store/slices/categoriesSlice.ts`

Đơn giản nhất, làm mẫu cho pattern:

```ts
interface CategoriesState {
  items: Category[];
  status: RequestStatus;
  error: string | null;
}
```

Pattern chuẩn của dự án cho một nguồn dữ liệu đơn giản:
- `items` — dữ liệu
- `status` — `'idle' | 'loading' | 'succeeded' | 'failed'`
- `error` — message để hiển thị

`RequestStatus` được định nghĩa trong `types/article.ts`:

```ts
export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
```

### 5.9 `store/slices/articleContentSlice.ts` — cache nội dung bài (trái tim của Yêu cầu 4)

```ts
export const fetchArticleContent = createAsyncThunk(
  'articleContent/fetch',
  async (id: string, { getState }) => {
    const state = getState() as { articleContent: ArticleContentState };
    const existing = state.articleContent.contentsById[id];
    if (existing?.data) return existing.data;

    return getArticleContent(id);
  },
);
```

State lưu theo `contentsById[id]`:

```ts
interface ArticleContentState {
  contentsById: Record<string, ContentEntry>;
}

interface ContentEntry {
  status: RequestStatus;
  data: ArticleContent | null;
  error: string | null;
}
```

**Cơ chế chống gọi lại (0ms)**: trước khi gọi API, kiểm tra `contentsById[id].data` đã có chưa → nếu có thì trả luôn ngay, **không gọi network**. Đây là kiểm tra **trong thunk**, tốt hơn kiểm tra trong component vì logic nằm đúng chỗ và mọi nơi gọi đều được hưởng.

Đây chính là cơ chế bảo vệ giới hạn 30 request/phút của endpoint `/content`: người dùng mở lại bài đã đọc sẽ được phục vụ từ Redux, không tạo request nào.

**Vì sao không dùng `rejectWithValue`?** `rejectWithValue` làm payload của thunk thành union (`string | ArticleContent`) → `action.payload?.id` không type-safe nữa. Thay vào đó ta dùng `action.error.message` trong `rejected` case, giữ payload thuần `ArticleContent`.

Selector bộ đếm phục vụ việc debug/theo dõi cache:

```ts
export const selectContentsById = (state: RootState) => state.articleContent.contentsById;
export const selectCachedContentCount = (state: RootState) =>
  Object.keys(state.articleContent.contentsById).length;
```

### 5.10 `store/slices/sourcesSlice.ts` — danh sách nguồn tin

Cùng pattern với `categoriesSlice`, nhưng lưu thêm metadata của từng nguồn (số bài, trạng thái `ok`, lỗi, danh sách feed):

```ts
interface SourcesState {
  items: Source[];
  status: RequestStatus;
  error: string | null;
}
```

`fetchSources` được dispatch **một lần** cùng `fetchCategories` trong `main.tsx` khi khởi động app, theo đúng yêu cầu "gọi 1 lần duy nhất → lưu vào Redux Store, sử dụng xuyên suốt các trang".

### 5.11 `store/slices/bookmarksSlice.ts` — đồng bộ localStorage

```ts
const initialState: BookmarksState = {
  items: readStorage<Article[]>(STORAGE_KEYS.bookmarks, []),
};
```

Đọc localStorage **ngay lúc khởi tạo store** → không bị "nháy" (flash) trạng thái rỗng rồi mới có dữ liệu.

```ts
reducers: {
  toggleBookmark(state, action: { payload: Article }) {
    const article = action.payload;
    const index = state.items.findIndex((item) => item.id === article.id);
    if (index >= 0) {
      state.items.splice(index, 1);
    } else {
      state.items.unshift(article);
    }
    writeStorage(STORAGE_KEYS.bookmarks, state.items);
  },
  ...
}
```

Ghi localStorage **ngay trong reducer**. Về mặt kỹ thuật, side-effect trong reducer là không đúng "thuần khiết", nhưng ở đây có chủ ý: vì Immer đã tạo bản sao mới, `state.items` lúc này là dữ liệu mới → ghi ra là đúng. Đây là cách đơn giản nhất, đánh đổi lấy sự ngắn gọn (SKILL.md cũng gợi ý "qua `store.subscribe` hoặc listener middleware").

`unshift` — bài vừa lưu lên đầu danh sách.

`lib/storage.ts` bọc localStorage trong try/catch vì:
- Safari private mode chặn localStorage.
- Quota đầy.
- `JSON.parse` lỗi nếu dữ liệu bị hỏng.

### 5.12 `api/http.ts` — axios + chuẩn hoá lỗi

```ts
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20000,
  headers: { Accept: 'application/json' },
});
```

`axios.create()` trả về instance riêng → cấu hình không ảnh hưởng axios global.

```ts
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (payload?.error) {
      return new ApiError(payload.error.code, payload.error.message, error.response?.status ?? 500);
    }
    if (error.code === 'ECONNABORTED') {
      return new ApiError('TIMEOUT', 'Yêu cầu quá thời gian chờ, vui lòng thử lại', 0);
    }
    if (!error.response) {
      return new ApiError('NETWORK_ERROR', 'Không kết nối được tới máy chủ', 0);
    }
    return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', error.response.status);
  }

  return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', 500);
}
```

**Điểm mấu chốt**: server trả `{ error: { code, message } }` với message tiếng Việt thân thiện. Hàm này bóc ra `ApiError` với `code` + `message` → UI hiển thị đúng thông báo cho từng tình huống:
- `TIMEOUT` → "Yêu cầu quá thời gian chờ"
- `NETWORK_ERROR` → "Không kết nối được tới máy chủ" (server chưa chạy)
- `CONTENT_UNAVAILABLE` → message riêng từ server
- `NOT_FOUND` → "Bài viết không tồn tại hoặc đã hết thời hạn lưu giữ"

### 5.13 `api/endpoints.ts` — lớp gọi API

```ts
export async function getLatest(limit = 20, page = 1): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/articles/latest', { params: { limit, page } });
  return response.data;
}
```

Mỗi hàm: gọi `http.get<T>()` → trả về `response.data` (đã bóc `data`/`meta` của server). **Component không bao giờ gọi axios trực tiếp** — chỉ thunk gọi vào đây. Tách lớp này giúp đổi base URL hay thêm interceptor chỉ sửa 1 file.

**Generic type `<ApiList<Article>>`** là định nghĩa kiểu của response → TypeScript kiểm tra `response.data.data` là `Article[]`, `response.data.meta` là `ListMeta`.

Danh sách đầy đủ các hàm đang có:

| Hàm | Endpoint | Trả về |
|---|---|---|
| `getCategories()` | `GET /categories` | `Category[]` |
| `getSources()` | `GET /sources` | `Source[]` |
| `getLatest(limit, page)` | `GET /articles/latest` | `ApiList<Article>` |
| `getFeatured(limit)` | `GET /articles/featured` | `ApiList<Article>` |
| `getByCategory(category, limit, page)` | `GET /articles?category=` | `ApiList<Article>` |
| `searchArticles(q, limit, page)` | `GET /search?q=` | `ApiList<Article>` |
| `getArticleById(id)` | `GET /articles/:id` | `Article` |
| `getRelated(id, limit)` | `GET /articles/:id/related` | `ApiList<Article>` |
| `getArticleContent(id)` | `GET /articles/:id/content` | `ArticleContent` |

### 5.14 `hooks/useListArticles.ts` — ghép entity + ids

```ts
export function useListArticles(key: string): Article[] {
  const entities = useAppSelector(selectArticlesEntities);
  const ids = useAppSelector((state) => selectListIds(state, key));

  return useMemo(
    () =>
      ids
        .map((id) => entities[id])
        .filter((article): article is Article => article !== undefined),
    [ids, entities],
  );
}
```

**Type guard trong `.filter()`**: `(article): article is Article => article !== undefined` — nói với TypeScript rằng sau filter, phần tử còn lại chắc chắn là `Article` (không phải `Article | undefined`).

`useMemo` tránh tạo mảng mới mỗi lần render → không gây re-render thừa cho component con.

### 5.15 `hooks/useDebounce.ts` — chống gọi API liên tục

```ts
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

**Debounce** = chỉ thực hiện sau khi ngừng thay đổi trong `delay` ms. Người dùng gõ "Việt Nam" (8 ký tự) mà không debounce → 8 request; có debounce 400ms → 1 request.

`clearTimeout` trong cleanup của `useEffect` là điểm mấu chốt: mỗi lần `value` đổi, timer cũ bị huỷ, chỉ timer mới sống sót.

### 5.16 `hooks/usePolling.ts` — tự làm mới tin

```ts
export function usePolling(callback: () => void, intervalMs: number): void {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const timer = setInterval(() => saved.current(), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}
```

**Vấn đề closure**: nếu viết thẳng `setInterval(() => callback(), intervalMs)`, callback sẽ bị "đóng băng" ở giá trị lúc khởi tạo. Dùng `useRef` để luôn lưu callback **mới nhất** mà không cần reset interval.

`intervalMs` trong deps → đổi interval sẽ tạo timer mới.

### 5.17 `components/article/ArticleBody.tsx` — điểm nhạy cảm nhất

```tsx
export function ArticleBody({ contentHtml }: ArticleBodyProps) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(contentHtml), [contentHtml]);

  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
```

`dangerouslySetInnerHTML` là cách duy nhất để render HTML từ server. Ba lớp bảo vệ:

1. **Server**: `sanitize-html` với allowlist → đã loại `script`, `iframe`, `onerror`…
2. **Client**: `DOMPurify.sanitize` → lọc lần 2 trong trình duyệt (defense in depth — phòng khi server bị bypass).
3. **CSP**: `scriptSrc: ["'self'"]` → kể cả lọt được script cũng không chạy được.

`useMemo` để không sanitize lại mỗi lần render.

**Quy tắc của dự án**: `ArticleBody` là **nơi DUY NHẤT** được dùng `dangerouslySetInnerHTML`.

### 5.18 `components/article/SafeImage.tsx`

```tsx
const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#ececec"/><text x="50%" y="50%" text-anchor="middle" fill="#9a9a9a" font-family="sans-serif" font-size="20">Không có ảnh</text></svg>',
);

export function SafeImage({ src, alt, className = '', ratioClass = 'ratio ratio-16x9' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${ratioClass} overflow-hidden bg-light`}>
      <img
        src={failed || !src ? PLACEHOLDER : src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`article-card__image ${className}`}
      />
    </div>
  );
}
```

Bốn chi tiết quan trọng:
- **Placeholder SVG inline** bằng data URI → không cần file ảnh, không cần request mạng.
- **`loading="lazy"`** → chỉ tải ảnh khi sắp lọt vào viewport → giảm tải mạng.
- **`referrerPolicy="no-referrer"`** → không gửi referrer tới CDN báo (một số CDN chặn).
- **`onError` → placeholder** → ảnh chết (link hỏng) không hiện icon vỡ.

`ratio ratio-16x9` là utility class của Bootstrap 5 giữ đúng tỉ lệ 16:9, tránh layout shift (CLS).

### 5.19 `components/article/ArticleMeta.tsx`

```tsx
<div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
  <span className="fw-semibold text-body">{source}</span>
  <span aria-hidden="true">•</span>
  <time dateTime={publishedAt} title={formatDateTime(publishedAt)}>
    {timeAgo(publishedAt)}
  </time>
  {showNew && isNew(publishedAt) && (
    <Badge bg="danger" className="text-uppercase">Mới</Badge>
  )}
</div>
```

- `<time dateTime={...}>` — ngữ nghĩa đúng, hỗ trợ SEO và screen reader.
- `aria-hidden="true"` trên dấu "•" trang trí → screen reader bỏ qua.
- Badge "Mới" khi bài < 1 giờ (`isNew`).

### 5.20 `lib/time.ts` — xử lý thời gian

```ts
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('vi');

const TZ = 'Asia/Ho_Chi_Minh';

export function timeAgo(iso: string): string {
  return dayjs(iso).fromNow();
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).tz(TZ).format('HH:mm DD/MM/YYYY');
}

export function isNew(iso: string, hours = 1): boolean {
  const published = dayjs(iso);
  if (!published.isValid()) return false;
  return dayjs().diff(published, 'hour', true) < hours;
}
```

- `relativeTime` → "3 giờ trước" (tiếng Việt nhờ `dayjs.locale('vi')`).
- `utc` + `timezone` → server trả ISO UTC, hiển thị theo giờ Việt Nam **bất kể múi giờ máy người dùng**.
- `isNew` dùng `diff(..., true)` → trả về số thập phân (1.5 giờ) để so sánh chính xác.

### 5.21 `styles/` — SCSS và Bootstrap

`_variables.scss` định nghĩa biến Bootstrap **trước khi** import Bootstrap:

```scss
$primary: #c62828;
$secondary: #37474f;
$danger: #d32f2f;
$font-family-sans-serif: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
$enable-shadows: false;
$enable-gradients: false;
```

```scss
/* main.scss */
@import 'variables';
@import 'bootstrap/scss/bootstrap';
@import 'custom';
```

**Thứ tự import là bắt buộc**: biến phải khai báo *trước* khi Bootstrap dùng chúng. Đây là cơ chế **override biến SCSS** của Bootstrap 5.

`client/vite.config.ts` cấu hình SCSS:

```ts
css: {
  preprocessorOptions: {
    scss: {
      quietDeps: true,
      silenceDeprecations: ['import', 'mixed-decls', 'color-functions', 'global-builtin'],
    },
  },
},
```

`silenceDeprecations: ['import']` — Bootstrap 5.3 vẫn dùng `@import` (đã deprecated trong Dart Sass 3.0), cần tắt cảnh báo.

### 5.22 `components/layout/AppNavbar.tsx`

```tsx
const categories = useAppSelector((state) => state.categories.items);

const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];
```

Navbar **không tự fetch** nữa. Việc gọi API đã được chuyển lên `main.tsx` (mục 5.2) để đúng yêu cầu "gọi 1 lần duy nhất khi khởi động ứng dụng" và tránh fetch trùng khi điều hướng giữa các trang.

**Fallback tĩnh**: nếu API lỗi, menu vẫn hiện 11 chuyên mục (từ `CATEGORY_FALLBACK`) thay vì trống → UI không "vỡ".

Form tìm kiếm:

```tsx
const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
  event.preventDefault();
  const trimmed = keyword.trim();
  if (!trimmed) return;
  void navigate(`/tim-kiem?q=${encodeURIComponent(trimmed)}`);
};
```

`encodeURIComponent` mã hoá khoảng trắng và ký tự đặc biệt → URL hợp lệ.

Dùng `NavLink` (không phải `Link`) để có class `active` tự động khi route đang active.

### 5.23 Các component `common/`

- `Loading.tsx` — spinner Bootstrap + nhãn.
- `ErrorState.tsx` — Alert đỏ + nút "Thử lại" (chỉ hiện nếu có `onRetry`).
- `EmptyState.tsx` — icon + tiêu đề + mô tả khi không có dữ liệu.

Ba trạng thái bắt buộc của mọi trang dữ liệu: **đang tải / lỗi / rỗng** — dựa vào `status` trong slice.

### 5.24 `components/Header/Header.tsx` — component không dùng

File này là một header đơn giản viết bằng CSS thuần (`Header.css`), **không dùng React Router, không nằm trong cây route**. Thực tế app dùng `AppNavbar` (react-bootstrap). Đây là code thừa từ giai đoạn đầu.

### 5.25 Các page hiện tại đang là "skeleton"

Các page trong `pages/` hiện chỉ là **khung TODO** (theo lộ trình học phần của đồ án), ví dụ:

```tsx
export function HomePage() {
  return (
    <Container className="py-4">
      <title>Tin tức 24h — Trang chủ</title>
      <h1 className="h3 mb-4">Trang chủ</h1>
      <p className="text-secondary">
        TODO(Frontend Core): nội dung trang chủ sẽ được xây dựng ở tuần 2.
      </p>
    </Container>
  );
}
```

**Phần server đã hoàn chỉnh**; phần client có đủ nền tảng (store, api, hook, component) nhưng chưa ghép vào page.

Lưu ý kỹ thuật: `<title>` đặt **bên trong** component — React 19 hỗ trợ render thẻ `<title>`/`<meta>` ở bất kỳ đâu trong cây component, React sẽ tự đưa lên `<head>`.

---

## 6. Các luồng xử lý end-to-end

### 6.1 Luồng A — Khởi động server

```text
npm run dev:server
  └─ tsx watch src/index.ts
       └─ createApp()                     → tạo Express app + middleware
       └─ bootstrap()
            ├─ readSnapshot()             → đọc server/data/snapshot.json
            ├─ articleStore.hydrate()     → nạp bài vào Map, dựng searchText, prune
            ├─ startRefreshJob()
            │    ├─ cron.validate()       → kiểm tra biểu thức cron
            │    ├─ cron.schedule()       → đăng ký lịch 5 phút
            │    └─ runOnce()             → refresh ngay lập tức
            └─ app.listen(4000)           → server sẵn sàng
```

### 6.2 Luồng B — Refresh RSS (chạy mỗi 5 phút)

```text
refreshAll()
  ├─ enabledSources() → SOURCES.filter(s => s.enabled)
  ├─ flatMap → danh sách task (nguồn, feed)
  ├─ mapWithConcurrency(tasks, 5, fetchFeed)
  │    └─ mỗi task: fetch → rss-parser → chuẩn hoá → Article[]
  ├─ gom tất cả Article[]
  ├─ articleStore.upsertMany()   → gộp, prune, cập nhật lastUpdatedAt
  ├─ cacheService.clearQuery()
  ├─ writeSnapshot()             → ghi JSON (atomic)
  ├─ log kết quả
  └─ void prefetchContent()      → batch crawl 30 bài mới nhất (chạy nền)
```

### 6.3 Luồng C — Người dùng mở trang chủ

```text
GET / → React Router khớp "/" → RootLayout
  │
  ├─ AppNavbar: useEffect → dispatch(fetchCategories())
  │    └─ thunk → getCategories() → GET /api/categories → categoriesSlice.fulfilled
  │         └─ store.categores.items được cập nhật → menu render lại
  │
  └─ HomePage: dispatch(fetchFeatured()) + dispatch(fetchLatest())
       └─ articlesSlice.fulfilled
            ├─ articlesAdapter.upsertMany(state, data)   → lưu vào entities
            ├─ entry.ids = data.map(a => a.id)            → lưu thứ tự danh sách
            └─ entry.meta = payload.meta
       └─ useListArticles('featured') → ids.map(id => entities[id])
```

### 6.4 Luồng D — Người dùng mở chi tiết bài (quan trọng nhất)

```text
GET /bai-viet/abc123
  │
  ├─ ArticleDetailPage: useParams() → id = 'abc123'
  ├─ dispatch(fetchArticleById('abc123'))  → GET /api/articles/abc123 → articlesSlice
  ├─ dispatch(fetchArticleContent('abc123'))
  │    ├─ thunk kiểm tra store: đã có content? → có thì trả luôn
  │    └─ getArticleContent('abc123') → GET /api/articles/abc123/content
  │         │
  │         └─ SERVER: contentController
  │              ├─ requireArticle(id) → 404 nếu không có
  │              └─ getContent(article)
  │                   ├─ cacheService.getContent(id)  → có? trả luôn
  │                   ├─ inflight.get(id)              → đang crawl? chờ chung
  │                   └─ crawl(article)
  │                        ├─ isAllowedDomain(link)     → 502 nếu domain lạ
  │                        ├─ downloadHtml(link)         → fetch + timeout 15s
  │                        ├─ extractWithReadability()   → jsdom + Readability
  │                        ├─ fallback contentSelector  → nếu Readability fail
  │                        ├─ sanitizeArticleHtml()      → allowlist
  │                        ├─ textLength >= 200?         → 502 nếu quá ngắn
  │                        └─ cacheService.setContent()
  │
  └─ render: <ArticleBody contentHtml={...} /> → DOMPurify → dangerouslySetInnerHTML
```

### 6.5 Luồng E — Tìm kiếm không phân biệt dấu

```text
Người dùng gõ "viet nam" vào ô tìm kiếm
  ├─ onChange → setKeyword → giá trị hiển thị cập nhật ngay (controlled input)
  ├─ useDebounce(keyword, 400) → sau 400ms ngừng gõ mới cập nhật
  ├─ dispatch(searchArticles({ q: 'viet nam' }))
  │    └─ GET /api/search?q=viet%20nam
  │         └─ server: toSearchText('viet nam') = 'viet nam'
  │              └─ so với searchText của mỗi bài (đã bỏ dấu lúc lưu)
  │                   └─ bài tiêu đề "Việt Nam" → searchText = 'viet nam' → KHỚP
  ├─ articlesSlice lưu vào lists['search:viet nam']
  └─ render danh sách kết quả
```

**Điểm hay:** việc bỏ dấu diễn ra **1 lần khi lưu bài** (server) và **1 lần khi có query** (server). Client không cần biết.

### 6.6 Luồng F — Xử lý lỗi

```text
Bất kỳ lỗi nào ở server:
  throw ApiError / ContentUnavailableError / Error
      ↓
  Express bắt (Express 5 tự chuyển tiếp lỗi trong async handler)
      ↓
  errorHandler(err, req, res, next)
      ├─ ApiError              → res.status(err.status).json({ error: { code, message } })
      ├─ ContentUnavailableError → 502 CONTENT_UNAVAILABLE
      └─ lỗi khác               → 500 INTERNAL_ERROR + console.error
      ↓
  axios nhận response có status ≠ 2xx → ném AxiosError
      ↓
  toApiError(error) → ApiError { code, message, status }
      ↓
  thunk rejected → slice gán entry.status = 'failed', entry.error = message
      ↓
  Component render <ErrorState message={entry.error} onRetry={...} />
```

---

## 7. Khái niệm Frontend cốt lõi được dùng trong dự án

### 7.1 React

**Function component + Hooks**
```tsx
export function HomePage() { ... }
```
Dự án dùng 100% function component (không class component). Hook chỉ dùng trong function component.

**Controlled component** — input do React quản lý:
```tsx
const [keyword, setKeyword] = useState('');
<Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} />
```

**Props**: khai báo bằng `interface`, truyền xuống:
```tsx
interface ArticleCardProps { article: Article; }
export function ArticleCard({ article }: ArticleCardProps) { ... }
```

**`useEffect`** — chạy side-effect sau render:
```tsx
useEffect(() => {
  if (categories.length === 0) void dispatch(fetchCategories());
}, [categories.length, dispatch]);
```
- Mảng `deps` = giá trị phụ thuộc. Effect chạy lại khi deps đổi.
- `cleanup` function trả về để dọn (clearTimeout, clearInterval, hủy fetch).

**`useMemo`** — ghi nhớ kết quả tính toán:
```tsx
const safeHtml = useMemo(() => DOMPurify.sanitize(contentHtml), [contentHtml]);
```

**`useRef`** — giữ giá trị không gây re-render:
```tsx
const saved = useRef(callback);
```

### 7.2 TypeScript

- **Generic**: `createAsyncThunk<Returned, Arg, ThunkConfig>`
- **Type guard**: `isCategorySlug(value): value is CategorySlug`
- **`unknown` thay `any`**: `catch (error)` → `error instanceof Error ? error.message : String(error)`
- **Derive type từ value**: `type CategorySlug = (typeof CATEGORIES)[number]['slug']`
- **`??` vs `||`**: `??` chỉ thay khi `null`/`undefined`; `||` thay cả khi `''`, `0`, `false`
  - `summary: article.summary || existing.summary` → dùng `||` (chuỗi rỗng cũng không giữ được)
  - `thumbnail: article.thumbnail ?? existing.thumbnail` → dùng `??` (giữ ảnh cũ nếu mới là `undefined`)
- **`as const`**: giữ kiểu literal, readonly
- **Non-null assertion `!`**: `state.lists[LIST_LATEST]!` — dùng khi đã chắc chắn có

### 7.3 Redux Toolkit

| Khái niệm | Dùng ở đâu |
|---|---|
| `configureStore` | `store/index.ts` |
| `createSlice` | 4 slice |
| `createAsyncThunk` | 6 thunk |
| `extraReducers` + `builder.addCase` | xử lý pending/fulfilled/rejected |
| `createEntityAdapter` | `articlesSlice` — chuẩn hoá entity |
| `createSelector` | có thể dùng cho memoization |

**Luồng chuẩn:**
```text
Component → dispatch(thunk) → thunk gọi api/endpoints → axios → server
                                                              ↓
Component ← useSelector ← slice.extraReducers ← action fulfilled/rejected
```

**Nguyên tắc:**
- Component **không** gọi axios.
- Thunk **không** tự cập nhật state — chỉ trả về payload; slice mới lo mutate state.
- Không lưu state có thể suy ra được (`isBookmarked` suy ra từ `items` → dùng selector, không lưu riêng).

### 7.4 React Router v7

| API | Công dụng |
|---|---|
| `createBrowserRouter` | Tạo router bằng object (không phải JSX) |
| `RouterProvider` | Render router vào DOM |
| `Outlet` | Điểm hiển thị route con trong layout |
| `index: true` | Index route |
| `useParams()` | Đọc `:id`, `:slug` |
| `useSearchParams()` | Đọc/ghi query string |
| `useNavigate()` | Điều hướng bằng code |
| `Link` / `NavLink` | Link nội bộ (NavLink có trạng thái active) |
| `ScrollRestoration` | Quản lý vị trí cuộn |

### 7.5 Bootstrap 5 + react-bootstrap

- **Grid**: `Container` → `Row` → `Col` (12 cột, `lg={3}` / `lg={9}` → 3/9 cột từ breakpoint `lg`).
- **Utility class**: `d-flex`, `flex-column`, `justify-content-center`, `gap-2`, `py-4`, `mb-3`, `text-secondary`, `h-100`.
- **Breakpoint**: `sm` 576px, `md` 768px, `lg` 992px, `xl` 1200px.
- **react-bootstrap**: component Bootstrap dạng React, hỗ trợ props như `bg`, `variant`, `expand`.

### 7.6 Các khái niệm khác

| Khái niệm | Ứng dụng |
|---|---|
| **Debounce** | `useDebounce` — giảm request khi gõ |
| **Polling** | `usePolling` — tự làm mới tin mới mỗi 60s |
| **Request coalescing** | `inflight` Map — gộp request trùng |
| **Worker pool** | `mapWithConcurrency` — giới hạn độ song song |
| **Atomic write** | `writeFile` + `rename` cho snapshot |
| **Allowlist sanitization** | `sanitize-html` |
| **Defense in depth** | sanitize server + DOMPurify client + CSP |
| **Type guard** | `isCategorySlug`, filter type predicate |
| **Derived state** | `useListArticles` tính từ `ids` + `entities` |
| **Stable reference** | `EMPTY_IDS` hằng số trong selector |

---

## 8. Bảng tra nhanh API

| Endpoint | Query | Trả về |
|---|---|---|
| `GET /api/health` | — | `{ status, uptime, lastRefreshAt, articleCount, sources[] }` |
| `GET /api/categories` | — | `{ data: Category[] }` (11 chuyên mục + count) |
| `GET /api/sources` | — | `{ data: Source[] }` (kèm feeds, trạng thái) |
| `GET /api/articles` | `category`, `source`, `q`, `page`, `limit` | `{ data, meta }` |
| `GET /api/articles/latest` | `page`, `limit` | `{ data, meta }` |
| `GET /api/articles/featured` | `limit` | `{ data, meta }` |
| `GET /api/articles/:id` | — | `{ data: Article }` |
| `GET /api/articles/:id/related` | `limit` (≤6) | `{ data, meta }` |
| `GET /api/articles/:id/content` | — | `{ data: ArticleContent }` (30 req/phút) |
| `GET /api/search` | `q` (bắt buộc), `page`, `limit` | `{ data, meta }` |
| `GET /api/articles/rss.xml` | `limit`, `category` | RSS 2.0 (XML) |
| `POST /api/refresh` | — | `{ data: RefreshSummary }` (quét lại toàn bộ RSS) |

**Mã lỗi:**

| HTTP | `code` | Nguyên nhân |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Query sai kiểu / thiếu `q` |
| 404 | `NOT_FOUND` | Bài không tồn tại hoặc đã hết retention |
| 429 | `REFRESH_IN_PROGRESS` | Đang có một lượt refresh chạy |
| 502 | `CONTENT_UNAVAILABLE` | Không crawl được nội dung |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước |

---

## 9. Bảo mật và hiệu năng

### 9.1 Bảo mật

| Vấn đề | Cách xử lý |
|---|---|
| **XSS** từ nội dung crawl | allowlist `sanitize-html` (server) + DOMPurify (client) + CSP |
| **SSRF** (server bị lợi dụng để tải URL nội bộ) | `isAllowedDomain` chặn URL ngoài danh sách nguồn |
| **Protocol nguy hiểm** (`javascript:`, `file:`) | `canonicalizeUrl` chỉ nhận http(s) |
| **Abuse API** | `express-rate-limit`: 300/phút chung, 30/phút cho `/content` |
| **CORS** | whitelist origin qua `CORS_ORIGINS` |
| **Lộ thông tin công nghệ** | `app.disable('x-powered-by')` |
| **Clickjacking** | helmet `frameAncestors: ["'self'"]` |
| **Nhập liệu không hợp lệ** | Zod validate query + env |
| **DoS bằng request nặng** | timeout cho mọi fetch, giới hạn concurrency, cache + inflight dedupe |

### 9.2 Hiệu năng

| Kỹ thuật | Chi tiết |
|---|---|
| Cache nội dung | `node-cache`, TTL 6h, max 1000 phần tử |
| Gộp request trùng | `inflight` Map trong `content.service.ts` |
| Prefetch | Crawl trước 30 bài mới sau mỗi refresh → user thấy nội dung ngay |
| Precomputed search index | `searchText` tính 1 lần khi lưu |
| Xếp hạng kết quả tìm kiếm | Điểm theo vị trí trùng trong tiêu đề/tóm tắt, cộng điểm recency |
| HTTP cache phía server | `ETag` + `Cache-Control` cho các endpoint danh sách → `304 Not Modified` |
| Entity adapter | Mỗi bài lưu 1 lần dù xuất hiện ở nhiều danh sách |
| Lazy image | `loading="lazy"` |
| Giới hạn bộ nhớ | `prune()` theo thời gian + số lượng |
| Rate limit | Chặn crawl quá nhiều |
| Chống refresh trùng lặp | `refreshing` flag → `429 REFRESH_IN_PROGRESS` |
| Code splitting | Có thể thêm `React.lazy` cho các page (chưa làm) |

---

## 10. Câu hỏi thường gặp khi thuyết trình

**Hỏi:** Tại sao không dùng database?
**Đáp:** Đề bài cấm database. Dữ liệu là feed RSS tự làm mới — không cần lưu lâu dài. Giải pháp: `Map` trong RAM (truy vấn O(1)) + `node-cache` cho nội dung + snapshot JSON để không mất dữ liệu khi restart. Đánh đổi: mất dữ liệu khi restart nếu chưa có snapshot, và bài cũ hơn 72h bị xoá.

**Hỏ:** Vì sao cần `inflight` Map?
**Đáp:** Tránh crawl cùng một bài nhiều lần khi nhiều user mở cùng bài chưa có trong cache. Thay vì mỗi request tạo một promise crawl riêng, ta lưu promise vào `inflight` và cho các request sau chờ chung. `.finally()` xoá entry sau khi xong (kể cả khi lỗi) để lần sau có thể thử lại.

**Hỏ:** Vì sao dùng `res.locals` thay vì `req.query`?
**Đáp:** `req.query` của Express là string thô. Sau khi Zod parse, ta muốn `page`/`limit` là number đã clamp. `res.locals` là nơi lưu dữ liệu trong vòng đời request mà không sửa `req` (Express 5 đã read-only `req.query`).

**Hỏ:** Vì sao server dùng `fetch` thay vì `axios`?
**Đáp:** Node 22 có `fetch` sẵn trong global scope (undici) → không cần thêm dependency. `AbortSignal.timeout()` tích hợp sẵn cho timeout. Client dùng axios vì cần interceptor và API quen thuộc hơn ở trình duyệt.

**Hỏ:** `upsertMany` xử lý trùng lặp thế nào?
**Đáp:** ID = SHA1 của URL chuẩn hoá → cùng bài từ nhiều feed có cùng ID → `Map.set` ghi đè. Riêng `category` có quy tắc riêng: nếu bản cũ là `tong-hop` mà bản mới là chuyên mục cụ thể → nâng lên chuyên mục (cụ thể hơn). `summary` dùng `||` (bản mới rỗng thì giữ bản cũ), `thumbnail` dùng `??`.

**Hỏ:** Vì sao tìm kiếm không phân biệt dấu?
**Đáp:** `toSearchText()` bỏ dấu bằng `normalize('NFD')` + xoá U+0300–U+036F, riêng chữ `đ` thì `.replace(/đ/g, 'd')` vì NFD không tách được nó. Chuỗi đã bỏ dấu được tính trước và lưu cùng bài (`searchText`) → lúc query chỉ cần `includes`.

**Hỏ:** Vì sao route `/articles/latest` phải đặt trước `/articles/:id`?
**Đáp:** Express so khớp route theo thứ tự khai báo. Nếu `:id` đứng trước, `GET /articles/latest` sẽ khớp với `id = "latest"` → 404. Vì vậy route tĩnh luôn khai báo trước route động.

**Hỏ:** `index route` khác `layout route` thế nào?
**Đáp:** Layout route quy định **khung** (chứa `<Outlet/>`) — ví dụ `RootLayout` (Navbar/Footer) và `CategoryLayout` (cột menu). Index route quy định **nội dung mặc định** khi URL khớp route cha mà chưa chọn route con — ví dụ `/` → `HomePage`, `/chuyen-muc` → `CategoryIndexPage`.

**Hỏ:** `usePolling` dùng `useRef` để làm gì?
**Đáp:** Tránh hiện tượng "stale closure". Nếu viết `setInterval(() => callback(), ms)`, callback bị đóng băng ở giá trị lúc khởi tạo interval → gọi nhầm callback cũ. `useRef` lưu callback mới nhất, `saved.current()` luôn gọi bản mới.

**Hỏ:** Vì sao có 2 lớp sanitize?
**Đáp:** Defense in depth. Server sanitize (allowlist) là lớp chính. Client thêm DOMPurify phòng khi server bị bypass hoặc cache bị nhiễm. CSP là lớp thứ ba: `scriptSrc: ["'self'"]` chặn mọi script không cùng origin.

**Hỏi:** `entity adapter` giải quyết vấn đề gì?
**Đáp:** Một bài có thể xuất hiện ở nhiều danh sách (latest, featured, category:thoi-su, search:abc). Nếu lưu trực tiếp object trong từng mảng → trùng dữ liệu, cập nhật một chỗ không đồng bộ chỗ khác. Entity adapter lưu 1 bản trong `entities`, các danh sách chỉ giữ mảng `id` → luôn đồng bộ, tiết kiệm bộ nhớ.

**Hỏ:** Tìm kiếm có phân biệt "Việt" và "Việt Nam" không?
**Đáp:** Có. Với `q`, `article.store.ts` không chỉ `includes` mà còn chấm điểm: trùng cả tiêu đề `+10`, trùng đầu tiêu đề `+6`, khớp trọn vẹn `+8`, trùng tóm tắt `+3`, trùng tên báo `+1`, cộng thêm điểm recency. Nhờ vậy bài có tiêu đề chứa từ khoá sẽ nổi lên trên bài chỉ nhắc từ khoá trong tóm tắt.

**Hỏ:** `ETag` hoạt động thế nào?
**Đáp:** `sendCachedJson` băm SHA1 phần body thành ETag dạng `W/"..."`, gắn `Cache-Control: public, max-age=N`. Khi client gửi `If-None-Match` trùng ETag đó, server trả `304 Not Modified` với body rỗng → browser dùng bản cache, không tải lại dữ liệu.

**Hỏ:** Vì sao `main.tsx` dispatch `fetchCategories` và `fetchSources`?
**Đáp:** Đề bài yêu cầu "gọi 1 lần duy nhất khi khởi động ứng dụng → lưu vào Redux Store, sử dụng xuyên suốt". Dispatch ở `main.tsx` (thay vì trong `AppNavbar`) đảm bảo dữ liệu có sẵn trước khi bất kỳ trang nào render, và không gọi lại API mỗi lần điều hướng.

**Hỏ:** `rootReducer` khác gì so với khai báo reducer inline?
**Đáp:** `rootReducer` được export riêng để test dựng lại store với **đúng shape** của store thật (`configureStore({ reducer: rootReducer })`). Nếu test tự tạo store với một phần reducer, các selector nhận `RootState` sẽ không type-safe.

**Hỏ:** `authSlice` và `interactionSlice` thuộc phần ai?
**Đáp:** Theo phân công, `authSlice` (đăng nhập/đăng ký) và `interactionSlice` (bình luận, lịch sử đọc) thuộc phần Ngân. Mạnh khai báo chúng trong `store/index.ts` và cung cấp sẵn shape + selector cơ bản để: (1) `RootState` ổn định cho mọi thành viên, (2) Ngân chỉ cần điền logic vào file slice mà không phải sửa file store → không phát sinh conflict khi pull code.

---

## 11. Bài tập mở rộng gợi ý

1. **Hoàn thiện `HomePage`**: carousel tin nổi bật (`fetchFeatured`), cột "Tin mới nhất" (`fetchLatest`), khối theo chuyên mục, skeleton + trạng thái rỗng/lỗi, responsive 375/768/1200.
2. **`ArticleDetailPage`**: dispatch `fetchArticleById` + `fetchArticleContent`, render `ArticleBody`, footer ghi nguồn + link gốc, xử lý 502 bằng `summary` RSS.
3. **`CategoryPage`**: đọc `:slug`, dispatch `fetchByCategory`, lưới bài + phân trang.
4. **`SearchPage`**: `useDebounce` + đồng bộ `?q=` với URL, highlight từ khoá.
5. **`SavedPage`**: đọc `bookmarksSlice`, nút xoá.
6. **Dark mode**: đặt `data-bs-theme` trên `<html>`, dùng biến `--bs-*`.
7. **Tối ưu**: `React.lazy` + `Suspense` cho các page, `createSelector` memoize.
8. **Thêm nguồn RSS**: theo mục 7 trong `README.md`, chạy `npm run verify:feeds` và `verify:content`.

---

## 12. Kiểm thử (Vitest)

Dự án dùng **Vitest** chạy trên cả `client/src` và `server/src` (cấu hình ở `vitest.config.ts`).

```bash
npm test                              # chạy toàn bộ
npx vitest run server/src             # chỉ phần server
npx vitest run server/src/services/article.store.test.ts   # 1 file
npm run typecheck                    # kiểm tra kiểu (client + server)
npm run lint                         # oxlint
```

### 12.1 Vì sao test quan trọng ở đồ án này

Không có database, nên nhiều logic (chuẩn hoá URL, tính id, xếp hạng tìm kiếm, prune bài cũ) nằm trong hàm thuần — **test được dễ dàng và nhanh**. Những chỗ dễ sai nhất đều đã có test:

| File test | Bao phủ |
|---|---|
| `server/src/utils/url.test.ts` | Chuẩn hoá URL, chặn `javascript:`, chống domain giả mạo |
| `server/src/utils/text.test.ts` | Bỏ dấu tiếng Việt, cắt chuỗi |
| `server/src/utils/async.test.ts` | Giới hạn concurrency, giữ thứ tự kết quả |
| `server/src/config/sources.test.ts` | 11 chuyên mục, 5 nguồn phủ hết chuyên mục, allowlist domain |
| `server/src/services/article.store.test.ts` | Upsert, phân trang, lọc, xếp hạng tìm kiếm, prune |
| `server/src/services/feed.service.test.ts` | Đọc RSS, bỏ item lỗi, id ổn định, xử lý lỗi mạng |
| `server/src/services/content.service.test.ts` | Strip script/iframe, lazy image, chặn SSRF, gộp request |
| `server/src/services/cache.service.test.ts` | Cache 2 tầng |
| `server/src/services/snapshot.service.test.ts` | Ghi/đọc snapshot |
| `server/src/app.test.ts` | Tích hợp 10+ endpoint, validation, ETag/304 |
| `server/src/middlewares/request-context.test.ts` | `X-Request-Id`, log request |
| `client/src/store/slices/*.test.ts` | Reducer, thunk, cache, selector của từng slice |

### 12.2 Ba kiểu test được dùng trong dự án

**Test hàm thuần** — không cần mock:

```ts
expect(toSearchText('Thủ đô Hà Nội')).toBe('thu do ha noi');
```

**Test service có I/O** — stub `fetch` bằng `vi.stubGlobal`:

```ts
vi.stubGlobal('fetch', vi.fn(async () => ({
  ok: true, status: 200, text: async () => makeHtml('<article>...</article>'),
})));

const content = await getContent(makeArticle({ id: 'c1' }));
expect(content.contentHtml).not.toContain('<script');
```

**Test Redux slice** — dựng store thật với `rootReducer` rồi dispatch thunk:

```ts
const store = configureStore({ reducer: rootReducer });
vi.mocked(getSources).mockResolvedValue([source]);

await store.dispatch(fetchSources());

expect(selectSourcesStatus(store.getState())).toBe('succeeded');
```

> **Lưu ý quan trọng:** test phải dùng `rootReducer` (export từ `store/index.ts`), không tự tạo store với một phần reducer. Selector có kiểu `RootState` sẽ không type-safe nếu thiếu slice khác.

### 12.3 Test tích hợp API

`server/src/app.test.ts` khởi động Express trên **cổng ngẫu nhiên** (`listen(0)`) nên không đụng port 4000 khi đang chạy dev:

```ts
const server = await new Promise((resolve) => {
  const s = createApp().listen(0, () => resolve(s));
});
```

Nhờ vậy có thể chạy `npm test` song song với `npm run dev` mà không xung đột.

---

*Tài liệu này được viết dựa trên trạng thái source code hiện tại của repo `app-news24h`.*
