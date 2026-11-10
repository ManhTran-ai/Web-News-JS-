import type { Category } from '@/types/article';

export const STORAGE_KEYS = {
  bookmarks: 'news24h:bookmarks',
  auth: 'news24h:auth',
  accounts: 'news24h:accounts',
  readingHistory: 'news24h:reading-history',
  comments: 'news24h:comments',
  theme: 'news24h:theme',
  readerFontScale: 'news24h:reader-font-scale',
} as const;

export const PAGE_SIZE = 20;

/** Thời gian cache danh sách bài (ms) — trong 60s không gọi lại API cùng một tham số. */
export const LIST_CACHE_TTL_MS = 60_000;

/** Cache cho danh sách "mới nhất" — ngắn hơn vì được polling 60s/lần. */
export const LATEST_CACHE_TTL_MS = 30_000;

/** Số nội dung bài viết tối đa được giữ trong RAM của Redux. */
export const MAX_CACHED_CONTENTS = 50;

/** Số bài gần nhất giữ trong lịch sử đọc. */
export const MAX_READING_HISTORY = 50;

/** Số bài liên quan hiển thị dưới nội dung bài viết. */
export const RELATED_ARTICLES_COUNT = 6;

/** Thời gian cache danh sách bài liên quan (ms). */
export const RELATED_CACHE_TTL_MS = 60_000;

/** Cỡ chữ trong phần nội dung bài viết — bước nhảy mỗi lần bấm A+/A-. */
export const READER_FONT_SCALE_STEP = 0.1;
export const READER_FONT_SCALE_MIN = 0.8;
export const READER_FONT_SCALE_MAX = 1.6;

/** Khoảng thời gian lọc lịch sử đã đọc (số ngày). */
export const HISTORY_RANGE_DAYS = {
  today: 1,
  week: 7,
  all: 0,
} as const;

export type HistoryRange = keyof typeof HISTORY_RANGE_DAYS;

export const POLLING_INTERVAL_MS = 60000;

export const DEFAULT_SOURCES = [
  { id: 'vnexpress', name: 'VnExpress' },
  { id: 'tuoitre', name: 'Tuổi Trẻ' },
  { id: 'thanhnien', name: 'Thanh Niên' },
  { id: 'dantri', name: 'Dân Trí' },
  { id: 'vietnamnet', name: 'VietnamNet' },
] as const;

export const CATEGORY_FALLBACK: Category[] = [
  { slug: 'thoi-su', name: 'Thời sự', count: 0 },
  { slug: 'the-gioi', name: 'Thế giới', count: 0 },
  { slug: 'kinh-doanh', name: 'Kinh doanh', count: 0 },
  { slug: 'giai-tri', name: 'Giải trí', count: 0 },
  { slug: 'the-thao', name: 'Thể thao', count: 0 },
  { slug: 'phap-luat', name: 'Pháp luật', count: 0 },
  { slug: 'giao-duc', name: 'Giáo dục', count: 0 },
  { slug: 'suc-khoe', name: 'Sức khỏe', count: 0 },
  { slug: 'cong-nghe', name: 'Công nghệ', count: 0 },
  { slug: 'doi-song', name: 'Đời sống', count: 0 },
  { slug: 'du-lich', name: 'Du lịch', count: 0 },
];
