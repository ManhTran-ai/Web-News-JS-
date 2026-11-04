import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  to?: string;
  linkLabel?: string;
}

export function SectionHeader({ title, to, linkLabel = 'Xem thêm' }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {to && (
        <Link className="section-header__link" to={to}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
