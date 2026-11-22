import { useEffect, useState } from 'react';
import { searchArticles } from '@/api/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import type { Article } from '@/types/article';

const SUGGESTION_LIMIT = 6;

export function useArticleSuggestions(keyword: string): Article[] {
  const debounced = useDebounce(keyword.trim(), SEARCH_DEBOUNCE_MS);
  const [items, setItems] = useState<Article[]>([]);
  const [lastDebounced, setLastDebounced] = useState(debounced);

  if (lastDebounced !== debounced) {
    setLastDebounced(debounced);
    setItems([]);
  }

  useEffect(() => {
    if (!debounced) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    void searchArticles(debounced, SUGGESTION_LIMIT, 1, controller.signal)
      .then((response) => {
        if (!cancelled) setItems(response.data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debounced]);

  return items;
}
