import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsBookmarked, toggleBookmark } from '@/store/slices/bookmarksSlice';
import type { Article } from '@/types/article';

interface BookmarkButtonProps {
  article: Article;
  className?: string;
}

export function BookmarkButton({ article, className = '' }: BookmarkButtonProps) {
  const dispatch = useAppDispatch();
  const isBookmarked = useAppSelector((state) => selectIsBookmarked(state, article.id));

  return (
    <button
      type="button"
      className={`btn btn-sm btn-outline-dark ${className}`.trim()}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Bỏ lưu bài' : 'Lưu bài đọc sau'}
      onClick={() => dispatch(toggleBookmark(article))}
    >
      <i
        className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
        aria-hidden="true"
      />
      <span className="ms-1">{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
    </button>
  );
}
