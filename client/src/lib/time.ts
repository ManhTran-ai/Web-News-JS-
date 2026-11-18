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

/** Nhãn nhóm ngày cho lịch sử đọc — "Hôm nay", "Hôm qua" hoặc ngày cụ thể. */
export function historyDayLabel(iso: string, now = Date.now()): string {
  const date = dayjs(iso);
  if (!date.isValid()) return 'Không rõ ngày';

  const today = dayjs(now).startOf('day');
  const target = date.startOf('day');

  if (target.isSame(today, 'day')) return 'Hôm nay';
  if (target.isSame(today.subtract(1, 'day'), 'day')) return 'Hôm qua';

  return date.format('DD/MM/YYYY');
}

/** Kiểm tra một mốc thời gian có nằm trong ngày hôm nay hay không. */
export function isToday(iso: string, now = Date.now()): boolean {
  const date = dayjs(iso);
  if (!date.isValid()) return false;
  return date.startOf('day').isSame(dayjs(now).startOf('day'), 'day');
}
