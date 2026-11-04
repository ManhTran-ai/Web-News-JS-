import { useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
  placeholderLabel?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  eager = false,
  placeholderLabel,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = failed || !src;

  if (showPlaceholder) {
    return (
      <div className={`image-placeholder ${className}`} role="img" aria-label={alt}>
        {placeholderLabel?.charAt(0).toUpperCase() ?? ''}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`article-card__media ${className}`}
    />
  );
}
