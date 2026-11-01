import { Container } from 'react-bootstrap';

/**
 * TODO(Frontend Feature): trang "Đọc sau" — liệt kê bài đã lưu từ `bookmarksSlice`
 * (đã đồng bộ `localStorage`) kèm nút xoá bài.
 */
export function SavedPage() {
  return (
    <Container className="py-4">
      <title>Tin tức 24h — Đã lưu</title>
      <h1 className="h3 mb-4">Bài đã lưu</h1>
      <p className="text-secondary">
        TODO(Frontend Feature): giao diện đọc sau sẽ được xây dựng ở tuần 3.
      </p>
    </Container>
  );
}
