import { useAppSelector } from '@/store/hooks';
import { selectTodayReadCount } from '@/store/slices/interactionSlice';
import { DAILY_READING_GOAL } from '@/lib/constants';

interface ReadStatsProps {
  /** Mục tiêu số bài đọc mỗi ngày — mặc định lấy từ hằng số cấu hình. */
  goal?: number;
}

/** Thanh tiến độ số bài đã đọc trong ngày. */
export function ReadStats({ goal = DAILY_READING_GOAL }: ReadStatsProps) {
  const todayCount = useAppSelector(selectTodayReadCount);
  const percent = Math.min(100, Math.round((todayCount / goal) * 100));

  return (
    <section className="read-stats" aria-label="Theo dõi hành động đọc">
      <p className="read-stats__text">
        Bạn đã đọc <strong>{todayCount}</strong> bài hôm nay
      </p>

      <div
        className="read-stats__bar"
        role="progressbar"
        aria-label="Tiến độ đọc hôm nay"
        aria-valuenow={todayCount}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <span className="read-stats__bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <span className="read-stats__goal">
        Mục tiêu {goal} bài · {percent}%
      </span>
    </section>
  );
}
