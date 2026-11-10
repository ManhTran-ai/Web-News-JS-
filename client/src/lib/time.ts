import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/vi';
import { HISTORY_RANGE_DAYS, type HistoryRange } from '@/lib/constants';

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

export function formatFullDate(iso: string): string {
  return dayjs(iso).tz(TZ).format('HH:mm:ss DD/MM/YYYY');
}

export function isNew(iso: string, hours = 1): boolean {
  const published = dayjs(iso);
  if (!published.isValid()) return false;
  return dayjs().diff(published, 'hour', true) < hours;
}

/**
 * Mốc thời gian bắt đầu của khoảng lọc lịch sử đọc.
 * `null` nghĩa là không lọc theo thời gian.
 */
export function historyCutoff(range: HistoryRange, now = Date.now()): number | null {
  const days = HISTORY_RANGE_DAYS[range];
  if (days === 0) return null;
  if (range === 'today') return dayjs(now).startOf('day').valueOf();
  return now - days * 86_400_000;
}
