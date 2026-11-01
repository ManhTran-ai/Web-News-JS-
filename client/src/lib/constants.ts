import type { Category } from '@/types/article';

export const STORAGE_KEYS = {
  bookmarks: 'news24h:bookmarks',
} as const;

export const PAGE_SIZE = 20;

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
