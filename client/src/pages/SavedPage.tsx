import { useMemo, useState } from 'react';
import { Col, Container, Nav, Row, Tab } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearBookmarks, removeBookmark, selectBookmarks } from '@/store/slices/bookmarksSlice';
import {
  clearReadingHistory,
  removeReadingHistoryItem,
  selectReadingHistory,
} from '@/store/slices/interactionSlice';
import { ArticleCard } from '@/components/article/ArticleCard';
import { EmptyState } from '@/components/common/EmptyState';
import type { HistoryRange } from '@/lib/constants';
import { historyCutoff } from '@/lib/time';

type SavedTab = 'bookmarks' | 'history';

const RANGE_LABELS: Record<HistoryRange, string> = {
  today: 'Hôm nay',
  week: '7 ngày',
  all: 'Tất cả',
};

export function SavedPage() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<SavedTab>('bookmarks');
  const [range, setRange] = useState<HistoryRange>('all');
  const [cutoff, setCutoff] = useState<number | null>(null);
  const [category, setCategory] = useState('');

  const bookmarks = useAppSelector(selectBookmarks);
  const readingHistory = useAppSelector(selectReadingHistory);

  // Các chuyên mục có mặt trong lịch sử đọc — dùng làm danh sách lọc.
  const historyCategories = useMemo(() => {
    const names = new Map<string, string>();
    for (const entry of readingHistory) {
      names.set(entry.article.category, entry.article.category);
    }
    return [...names.values()];
  }, [readingHistory]);

  const filteredHistory = useMemo(
    () =>
      readingHistory.filter((entry) => {
        if (category && entry.article.category !== category) return false;
        if (cutoff === null) return true;
        const readAt = Date.parse(entry.readAt);
        if (Number.isNaN(readAt)) return false;
        return readAt >= cutoff;
      }),
    [readingHistory, category, cutoff],
  );

  // Mốc thời gian được tính lúc bấm nút nên không phụ thuộc thời điểm render.
  const applyRange = (key: HistoryRange): void => {
    setRange(key);
    setCutoff(historyCutoff(key));
  };

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Đã lưu</title>

      <h1 className="h3 mb-4">Bài đã lưu &amp; lịch sử đọc</h1>

      <Tab.Container activeKey={tab} onSelect={(key) => setTab((key as SavedTab) ?? 'bookmarks')}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="bookmarks">
              Bài đã lưu{bookmarks.length > 0 && ` (${bookmarks.length})`}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="history">
              Lịch sử đã đọc{readingHistory.length > 0 && ` (${readingHistory.length})`}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="bookmarks">
            {bookmarks.length === 0 ? (
              <EmptyState
                title="Chưa lưu bài nào"
                description="Bấm biểu tượng ghim ở góc thẻ bài để lưu lại đọc sau."
              />
            ) : (
              <>
                <div className="mb-3 d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => dispatch(clearBookmarks())}
                  >
                    Xoá tất cả bài đã lưu
                  </button>
                </div>

                <Row className="g-3">
                  {bookmarks.map((article) => (
                    <Col xs={12} md={6} lg={4} key={article.id}>
                      <div className="position-relative">
                        <ArticleCard article={article} variant="standard" showCategory />
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 m-2"
                          aria-label={`Bỏ lưu bài: ${article.title}`}
                          onClick={() => dispatch(removeBookmark(article.id))}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="history">
            {readingHistory.length === 0 ? (
              <EmptyState
                title="Chưa có lịch sử đọc"
                description="Các bài bạn mở sẽ tự động được ghi lại tại đây."
              />
            ) : (
              <>
                <div className="saved-filters mb-3">
                  <div className="saved-filters__group" role="group" aria-label="Lọc theo thời gian">
                    {(Object.keys(RANGE_LABELS) as HistoryRange[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`btn btn-sm ${range === key ? 'btn-dark' : 'btn-outline-dark'}`}
                        aria-pressed={range === key}
                        onClick={() => applyRange(key)}
                      >
                        {RANGE_LABELS[key]}
                      </button>
                    ))}
                  </div>

                  <div className="saved-filters__group">
                    <label className="visually-hidden" htmlFor="saved-filter-category">
                      Lọc theo chuyên mục
                    </label>
                    <select
                      id="saved-filter-category"
                      className="form-select form-select-sm w-auto"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      <option value="">Tất cả chuyên mục</option>
                      {historyCategories.map((slug) => (
                        <option key={slug} value={slug}>
                          {slug}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm ms-auto"
                    onClick={() => dispatch(clearReadingHistory())}
                  >
                    Xoá toàn bộ lịch sử
                  </button>
                </div>

                {filteredHistory.length === 0 ? (
                  <EmptyState
                    title="Không có bài nào khớp bộ lọc"
                    description="Hãy chọn khoảng thời gian khác hoặc bỏ bộ lọc chuyên mục."
                  />
                ) : (
                  <Row className="g-3">
                    {filteredHistory.map((entry) => (
                      <Col xs={12} md={6} lg={4} key={entry.article.id}>
                        <div className="position-relative">
                          <ArticleCard article={entry.article} variant="standard" showCategory />
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 m-2"
                            aria-label={`Xoá khỏi lịch sử: ${entry.article.title}`}
                            onClick={() => dispatch(removeReadingHistoryItem(entry.article.id))}
                          >
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}
