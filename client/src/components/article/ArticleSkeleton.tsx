import type { ArticleCardVariant } from './ArticleCard';

interface ArticleSkeletonProps {
  variant?: ArticleCardVariant;
  count?: number;
}

function SkeletonRow() {
  return (
    <div className="article-card--row">
      <div className="skeleton skeleton--media" style={{ aspectRatio: '1 / 1' }} />
      <div className="article-card__body">
        <div className="skeleton skeleton--title" style={{ width: '90%' }} />
        <div className="skeleton skeleton--title" style={{ width: '60%' }} />
        <div className="skeleton skeleton--text" style={{ width: '45%' }} />
      </div>
    </div>
  );
}

function SkeletonBlock({ variant }: { variant: ArticleCardVariant }) {
  if (variant === 'row') return <SkeletonRow />;

  const isLead = variant === 'lead';

  return (
    <div className="article-card">
      <div className="skeleton skeleton--media" />
      <div className="article-card__body">
        <div className={`skeleton ${isLead ? 'skeleton--title-lg' : 'skeleton--title'}`} style={{ width: '95%' }} />
        <div className="skeleton skeleton--title" style={{ width: '70%' }} />
        <div className="skeleton skeleton--text" style={{ width: '85%' }} />
        <div className="skeleton skeleton--text" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export function ArticleSkeleton({ variant = 'standard', count = 1 }: ArticleSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock key={index} variant={variant} />
      ))}
    </div>
  );
}
