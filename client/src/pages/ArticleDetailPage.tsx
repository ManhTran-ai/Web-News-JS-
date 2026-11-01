import { Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

/**
 * TODO(Frontend Core + Backend): trang chi tiết bài — lấy bài và dispatch
 * `fetchArticleContent(id)`, hiển thị tiêu đề, meta, ảnh và toàn bộ nội dung bài
 * ngay trên trang. Cuối bài ghi "Nguồn: <tên báo> · <thời gian>" kèm link gốc mở
 * tab mới. Khi crawl lỗi (502) hiện tóm tắt RSS + thông báo thân thiện.
 */
export function ArticleDetailPage() {
  const { id = '' } = useParams();

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Chi tiết bài</title>
      <h1 className="h3 mb-4">Chi tiết bài viết</h1>
      <p className="text-secondary">
        TODO(Frontend Core): nội dung sẽ được xây dựng ở tuần 3. (id: {id})
      </p>
    </Container>
  );
}
