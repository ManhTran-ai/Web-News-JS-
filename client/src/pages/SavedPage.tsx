import { useState } from 'react';
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

type SavedTab = 'bookmarks' | 'history';

export function SavedPage() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<SavedTab>('bookmarks');

  const bookmarks = useAppSelector(selectBookmarks);
  const readingHistory = useAppSelector(selectReadingHistory);

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
                <div className="mb-3 d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => dispatch(clearReadingHistory())}
                  >
                    Xoá toàn bộ lịch sử
                  </button>
                </div>

                <Row className="g-3">
                  {readingHistory.map((entry) => (
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
              </>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}
