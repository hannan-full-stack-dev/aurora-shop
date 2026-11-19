import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14 }) {
  return (
    <span className="rating" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(value) ? 'on' : ''} />
        ))}
      </span>
      <span className="rating-num">{value.toFixed(1)}</span>
      {count != null && <span className="rating-count">({count})</span>}
    </span>
  );
}
