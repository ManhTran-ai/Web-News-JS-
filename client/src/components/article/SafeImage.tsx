import { useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  ratioClass?: string;
}

const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#ececec"/><text x="50%" y="50%" text-anchor="middle" fill="#9a9a9a" font-family="sans-serif" font-size="20">Không có ảnh</text></svg>',
  );

export function SafeImage({ src, alt, className = '', ratioClass = 'ratio ratio-16x9' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${ratioClass} overflow-hidden bg-light`}>
      <img
        src={failed || !src ? PLACEHOLDER : src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`article-card__image ${className}`}
      />
    </div>
  );
}
