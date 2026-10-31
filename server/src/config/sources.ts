import type { CategorySlug } from './categories.js';

export interface FeedConfig {
  category: CategorySlug | 'tong-hop';
  url: string;
}

export interface SourceConfig {
  id: string;
  name: string;
  homepage: string;
  enabled: boolean;
  domains: string[];
  contentSelector?: string;
  feeds: FeedConfig[];
}

export const SOURCES: SourceConfig[] = [
  {
    id: 'vnexpress',
    name: 'VnExpress',
    homepage: 'https://vnexpress.net',
    enabled: true,
    domains: ['vnexpress.net', 'vnexpress.net.vn'],
    feeds: [
      { category: 'tong-hop', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
      { category: 'thoi-su', url: 'https://vnexpress.net/rss/thoi-su.rss' },
      { category: 'the-gioi', url: 'https://vnexpress.net/rss/the-gioi.rss' },
      { category: 'kinh-doanh', url: 'https://vnexpress.net/rss/kinh-doanh.rss' },
      { category: 'giai-tri', url: 'https://vnexpress.net/rss/giai-tri.rss' },
      { category: 'the-thao', url: 'https://vnexpress.net/rss/the-thao.rss' },
      { category: 'phap-luat', url: 'https://vnexpress.net/rss/phap-luat.rss' },
      { category: 'giao-duc', url: 'https://vnexpress.net/rss/giao-duc.rss' },
      { category: 'suc-khoe', url: 'https://vnexpress.net/rss/suc-khoe.rss' },
      { category: 'cong-nghe', url: 'https://vnexpress.net/rss/so-hoa.rss' },
      { category: 'doi-song', url: 'https://vnexpress.net/rss/doi-song.rss' },
      { category: 'du-lich', url: 'https://vnexpress.net/rss/du-lich.rss' },
    ],
  },
  {
    id: 'tuoitre',
    name: 'Tuổi Trẻ',
    homepage: 'https://tuoitre.vn',
    enabled: true,
    domains: ['tuoitre.vn'],
    feeds: [
      { category: 'tong-hop', url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss' },
      { category: 'thoi-su', url: 'https://tuoitre.vn/rss/thoi-su.rss' },
      { category: 'the-gioi', url: 'https://tuoitre.vn/rss/the-gioi.rss' },
      { category: 'kinh-doanh', url: 'https://tuoitre.vn/rss/kinh-doanh.rss' },
      { category: 'giai-tri', url: 'https://tuoitre.vn/rss/giai-tri.rss' },
      { category: 'the-thao', url: 'https://tuoitre.vn/rss/the-thao.rss' },
      { category: 'phap-luat', url: 'https://tuoitre.vn/rss/phap-luat.rss' },
      { category: 'giao-duc', url: 'https://tuoitre.vn/rss/giao-duc.rss' },
      { category: 'cong-nghe', url: 'https://tuoitre.vn/rss/nhip-song-so.rss' },
      { category: 'du-lich', url: 'https://tuoitre.vn/rss/du-lich.rss' },
    ],
  },
  {
    id: 'thanhnien',
    name: 'Thanh Niên',
    homepage: 'https://thanhnien.vn',
    enabled: true,
    domains: ['thanhnien.vn'],
    feeds: [
      { category: 'tong-hop', url: 'https://thanhnien.vn/rss/home.rss' },
      { category: 'thoi-su', url: 'https://thanhnien.vn/rss/thoi-su.rss' },
      { category: 'the-gioi', url: 'https://thanhnien.vn/rss/the-gioi.rss' },
      { category: 'kinh-doanh', url: 'https://thanhnien.vn/rss/kinh-te.rss' },
      { category: 'giai-tri', url: 'https://thanhnien.vn/rss/giai-tri.rss' },
      { category: 'the-thao', url: 'https://thanhnien.vn/rss/the-thao.rss' },
      { category: 'phap-luat', url: 'https://thanhnien.vn/rss/thoi-su/phap-luat.rss' },
      { category: 'giao-duc', url: 'https://thanhnien.vn/rss/giao-duc.rss' },
      { category: 'suc-khoe', url: 'https://thanhnien.vn/rss/suc-khoe.rss' },
      { category: 'cong-nghe', url: 'https://thanhnien.vn/rss/cong-nghe.rss' },
      { category: 'doi-song', url: 'https://thanhnien.vn/rss/doi-song.rss' },
      { category: 'du-lich', url: 'https://thanhnien.vn/rss/du-lich.rss' },
    ],
  },
  {
    id: 'dantri',
    name: 'Dân Trí',
    homepage: 'https://dantri.com.vn',
    enabled: true,
    domains: ['dantri.com.vn'],
    feeds: [
      { category: 'thoi-su', url: 'https://dantri.com.vn/rss/thoi-su.rss' },
      { category: 'the-gioi', url: 'https://dantri.com.vn/rss/the-gioi.rss' },
      { category: 'kinh-doanh', url: 'https://dantri.com.vn/rss/kinh-doanh.rss' },
      { category: 'giai-tri', url: 'https://dantri.com.vn/rss/giai-tri.rss' },
      { category: 'the-thao', url: 'https://dantri.com.vn/rss/the-thao.rss' },
      { category: 'phap-luat', url: 'https://dantri.com.vn/rss/phap-luat.rss' },
      { category: 'giao-duc', url: 'https://dantri.com.vn/rss/giao-duc.rss' },
      { category: 'suc-khoe', url: 'https://dantri.com.vn/rss/suc-khoe.rss' },
      { category: 'cong-nghe', url: 'https://dantri.com.vn/rss/cong-nghe.rss' },
      { category: 'doi-song', url: 'https://dantri.com.vn/rss/doi-song.rss' },
      { category: 'du-lich', url: 'https://dantri.com.vn/rss/du-lich.rss' },
    ],
  },
  {
    id: 'vietnamnet',
    name: 'VietnamNet',
    homepage: 'https://vietnamnet.vn',
    enabled: true,
    domains: ['vietnamnet.vn'],
    feeds: [
      { category: 'tong-hop', url: 'https://vietnamnet.vn/rss/tin-tuc.rss' },
      { category: 'thoi-su', url: 'https://vietnamnet.vn/rss/thoi-su.rss' },
      { category: 'the-gioi', url: 'https://vietnamnet.vn/rss/the-gioi.rss' },
      { category: 'kinh-doanh', url: 'https://vietnamnet.vn/rss/kinh-doanh.rss' },
      { category: 'giai-tri', url: 'https://vietnamnet.vn/rss/giai-tri.rss' },
      { category: 'the-thao', url: 'https://vietnamnet.vn/rss/the-thao.rss' },
      { category: 'phap-luat', url: 'https://vietnamnet.vn/rss/phap-luat.rss' },
      { category: 'giao-duc', url: 'https://vietnamnet.vn/rss/giao-duc.rss' },
      { category: 'suc-khoe', url: 'https://vietnamnet.vn/rss/suc-khoe.rss' },
      { category: 'cong-nghe', url: 'https://vietnamnet.vn/rss/cong-nghe.rss' },
      { category: 'doi-song', url: 'https://vietnamnet.vn/rss/doi-song.rss' },
      { category: 'du-lich', url: 'https://vietnamnet.vn/rss/du-lich.rss' },
    ],
  },
];

export const enabledSources = (): SourceConfig[] => SOURCES.filter((s) => s.enabled);

export function findSourceById(id: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === id);
}

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
