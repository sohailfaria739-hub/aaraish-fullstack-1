import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import StarRating from './StarRating';

const fmt = (n) => `Rs ${Number(n).toLocaleString('en-PK')}`;

export default function ProductCard({ product, onToggleWishlist, wished }) {
  const img = product.images?.[0];
  const discount = product.compare_price
    ? Math.round(100 - (product.price / product.compare_price) * 100)
    : null;
  const isNew = product.created_at && (Date.now() - new Date(product.created_at.replace(' ', 'T') + 'Z').getTime()) < 1000 * 60 * 60 * 24 * 14;

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-mist rounded-lg">
          {img ? (
            <img
              src={img}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/30 font-display">Aaraish</div>
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-wine text-paper text-[11px] tracking-wide px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {!discount && isNew && (
            <span className="absolute top-3 left-3 bg-gold text-ink text-[11px] tracking-wide px-2 py-1 rounded-full">
              New
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="absolute bottom-3 left-3 bg-ink/85 text-paper text-[11px] tracking-wide px-2 py-1 rounded-full">
              Only {product.stock} left
            </span>
          )}
          {onToggleWishlist && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleWishlist(product); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
              aria-label="Toggle wishlist"
            >
              <Heart size={15} className={wished ? 'fill-wine text-wine' : 'text-ink/60'} />
            </button>
          )}
        </div>
        <div className="mt-3 space-y-1">
          {product.shop_name && (
            <p className="text-[11px] uppercase tracking-widest2 text-charcoal/45">{product.shop_name}</p>
          )}
          <h3 className="font-body font-medium text-[15px] text-ink leading-snug line-clamp-1">{product.title}</h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{fmt(product.price)}</span>
            {product.compare_price && (
              <span className="text-charcoal/40 line-through text-sm">{fmt(product.compare_price)}</span>
            )}
          </div>
          {product.rating_count > 0 && <StarRating rating={product.rating} count={product.rating_count} />}
        </div>
      </Link>
    </div>
  );
}

export { fmt };
