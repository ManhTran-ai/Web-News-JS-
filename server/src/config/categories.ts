export const CATEGORIES = [
  { slug: 'thoi-su', name: 'Thời sự' },
  { slug: 'the-gioi', name: 'Thế giới' },
  { slug: 'kinh-doanh', name: 'Kinh doanh' },
  { slug: 'giai-tri', name: 'Giải trí' },
  { slug: 'the-thao', name: 'Thể thao' },
  { slug: 'phap-luat', name: 'Pháp luật' },
  { slug: 'giao-duc', name: 'Giáo dục' },
  { slug: 'suc-khoe', name: 'Sức khỏe' },
  { slug: 'cong-nghe', name: 'Công nghệ' },
  { slug: 'doi-song', name: 'Đời sống' },
  { slug: 'du-lich', name: 'Du lịch' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS: readonly string[] = CATEGORIES.map((c) => c.slug);

export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name]),
);

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value);
}
