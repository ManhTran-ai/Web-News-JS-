import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectArticlesEntities, selectListIds } from '@/store/slices/articlesSlice';
import type { Article } from '@/types/article';

export function useListArticles(key: string): Article[] {
  const entities = useAppSelector(selectArticlesEntities);
  const ids = useAppSelector((state) => selectListIds(state, key));

  return useMemo(
    () =>
      ids
        .map((id) => entities[id])
        .filter((article): article is Article => article !== undefined),
    [ids, entities],
  );
}
