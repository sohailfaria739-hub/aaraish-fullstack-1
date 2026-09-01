import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(rating) ? 'fill-gold text-gold' : 'fill-transparent text-ink/20'}
          />
        ))}
      </div>
      {typeof count === 'number' && (
        <span className="text-xs text-charcoal/50">({count})</span>
      )}
    </div>
  );
}
