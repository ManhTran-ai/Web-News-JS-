import { useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addComment,
  removeComment,
  selectCommentsByArticle,
  setCommentLiked,
} from '@/store/slices/interactionSlice';
import { selectCurrentUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { AuthModal } from '@/components/common/AuthModal';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/lib/time';
import type { Comment } from '@/types/article';

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const comments = useAppSelector((state) => selectCommentsByArticle(state, articleId));

  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [comments],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed || !user) return;

    const comment: Comment = {
      id: `c_${Date.now().toString(36)}`,
      articleId,
      // Ẩn danh vẫn gắn userId để chủ bình luận xoá được bình luận của mình.
      userId: user.id,
      user: isAnonymous ? undefined : user,
      content: trimmed,
      isAnonymous,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    dispatch(addComment(comment));
    setContent('');
  };

  if (!isAuthenticated || !user) {
    return (
      <section className="comment-section" id="comments">
        <h2 className="section-header__title mb-3">Bình luận ({comments.length})</h2>

        <div className="n24-surface">
          <p className="article-card__summary">Vui lòng đăng nhập để bình luận.</p>
          <Button variant="dark" size="sm" onClick={() => setShowAuthModal(true)}>
            Đăng nhập để bình luận
          </Button>
        </div>

        {sortedComments.length > 0 && (
          <ul className="comment-list mt-4">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={null}
                onLike={() =>
                  dispatch(
                    setCommentLiked({
                      articleId,
                      commentId: comment.id,
                      liked: (comment.likes ?? 0) === 0,
                    }),
                  )
                }
              />
            ))}
          </ul>
        )}

        <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </section>
    );
  }

  return (
    <section className="comment-section" id="comments">
      <h2 className="section-header__title mb-3">Bình luận ({comments.length})</h2>

      <Form onSubmit={handleSubmit} noValidate className="n24-surface mb-4">
        <Form.Group className="mb-3" controlId="comment-content">
          <Form.Label className="visually-hidden">Nội dung bình luận</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Chia sẻ ý kiến của bạn về bài viết..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Form.Group>

        <div className="comment-form__footer">
          <Form.Check
            type="switch"
            id="comment-anonymous"
            label="Ẩn danh"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
          />

          <Button type="submit" variant="dark" size="sm" disabled={!content.trim()}>
            Gửi bình luận
          </Button>
        </div>

        <p className="article-card__summary mt-2 mb-0">
          {isAnonymous
            ? 'Bình luận sẽ hiển thị với tên "Người dùng ẩn danh".'
            : `Bình luận sẽ hiển thị với tên "${user.fullName}".`}
        </p>
      </Form>

      {sortedComments.length === 0 ? (
        <EmptyState
          title="Chưa có bình luận nào"
          description="Hãy là người đầu tiên bình luận về bài viết này."
        />
      ) : (
        <ul className="comment-list">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user.id}
              onLike={() =>
                dispatch(
                  setCommentLiked({
                    articleId,
                    commentId: comment.id,
                    liked: (comment.likes ?? 0) === 0,
                  }),
                )
              }
              onRemove={() => dispatch(removeComment({ articleId, commentId: comment.id }))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  onLike: () => void;
  onRemove?: () => void;
}

function CommentItem({ comment, currentUserId, onLike, onRemove }: CommentItemProps) {
  const authorName = comment.isAnonymous ? 'Người dùng ẩn danh' : (comment.user?.fullName ?? 'Người dùng');
  const isOwner = currentUserId !== null && comment.userId === currentUserId;
  const liked = (comment.likes ?? 0) > 0;

  return (
    <li className="comment-item">
      <div className="comment-item__head">
        <span className="comment-item__author">{authorName}</span>
        <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
      </div>

      <p className="comment-item__content">{comment.content}</p>

      <div className="comment-item__actions">
        <button
          type="button"
          className={`btn btn-sm btn-link comment-item__like${liked ? ' is-liked' : ''}`}
          aria-pressed={liked}
          onClick={onLike}
        >
          <i
            className={`bi ${liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}
            aria-hidden="true"
          />
          <span className="ms-1">{comment.likes ?? 0}</span>
        </button>

        {isOwner && onRemove && (
          <button type="button" className="btn btn-sm btn-link text-danger" onClick={onRemove}>
            Xoá
          </button>
        )}
      </div>
    </li>
  );
}
