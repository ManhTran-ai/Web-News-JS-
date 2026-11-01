import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/vi';

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
