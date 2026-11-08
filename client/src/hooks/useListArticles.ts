import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectArticlesEntities, selectListEntry, selectListIds } from '@/store/slices/articlesSlice';
import type { Article, ListMeta, RequestStatus } from '@/types/article';

export interface ArticleList {
  items: Article[];
  meta: ListMeta | null;
  status: RequestStatus;
  error: string | null;
  isLoading: boolean;
  isEmpty: boolean;
}

/**
 * Đọc một danh sách đã cache trong `articlesSlice`.
 * Trả về cả `meta` để trang dùng phân trang và tổng số kết quả.
 */
export function useListArticles(key: string): ArticleList {
  const entities = useAppSelector(selectArticlesEntities);
  const ids = useAppSelector((state) => selectListIds(state, key));
  const entry = useAppSelector((state) => selectListEntry(state, key));

  const items = useMemo(
    () =>
      ids
        .map((id) => entities[id])
        .filter((article): article is Article => article !== undefined),
    [ids, entities],
  );

  return {
    items,
    meta: entry.meta,
    status: entry.status,
    error: entry.error,
    isLoading: entry.status === 'loading',
    isEmpty: entry.status === 'succeeded' && items.length === 0,
  };
}
