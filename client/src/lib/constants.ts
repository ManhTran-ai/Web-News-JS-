import type { Category } from '@/types/article';

export const STORAGE_KEYS = {
  bookmarks: 'news24h:bookmarks',
  auth: 'news24h:auth',
  accounts: 'news24h:accounts',
  readingHistory: 'news24h:reading-history',
  comments: 'news24h:comments',
  theme: 'news24h:theme',
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
