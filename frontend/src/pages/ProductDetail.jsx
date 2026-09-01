import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StarRating from '../components/StarRating';
import ProductCard, { fmt } from '../components/ProductCard';
import { addRecentlyViewed, getRecentlyViewed } from '../utils/recentlyViewed';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [data, setData] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [status, setStatus] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    setStatus('');
    setActiveImg(0);
    client.get(`/products/${id}`).then((res) => {
      setData(res.data);
      setSize(res.data.product.sizes?.[0] || '');
      setColor(res.data.product.colors?.[0] || '');
      addRecentlyViewed(res.data.product.id);
    });

    const ids = getRecentlyViewed().filter((rid) => rid !== Number(id));
    if (ids.length > 0) {
      client.get('/products', { params: { ids: ids.join(','), limit: ids.length } })
        .then((res) => setRecentlyViewed(res.data.products));
    } else {
      setRecentlyViewed([]);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      client.get('/wishlist').then((res) => setWished(res.data.items.some((p) => p.id === Number(id))));
    }
  }, [user, id]);

  if (!data) return <div className="py-32 text-center text-charcoal/40">Loading…</div>;
  const { product, reviews, related } = data;

  const handleAdd = async () => {
    if (!user) return navigate('/login');
    await addToCart(product.id, qty, size, color);
    setStatus('added');
    setTimeout(() => setStatus(''), 2000);
  };

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    if (wished) { await client.delete(`/wishlist/${product.id}`); setWished(false); }
    else { await client.post(`/wishlist/${product.id}`); setWished(true); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    await client.post(`/products/${product.id}/reviews`, reviewForm);
    const res = await client.get(`/products/${id}`);
    setData(res.data);
    setReviewForm({ rating: 5, comment: '' });
  };

  return (
    <div className="container-px py-10">
      <div className="text-xs text-charcoal/40 mb-6 flex gap-2">
        <Link to="/shop" className="hover:text-wine">Shop</Link>
        {product.category_name && <><span>/</span><Link to={`/shop?category=${product.category_slug}`} className="hover:text-wine">{product.category_name}</Link></>}
      </div>

      <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
        <div>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-mist">
            <img src={product.images[activeImg]} alt={product.title} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-24 rounded-lg overflow-hidden ring-2 ${i === activeImg ? 'ring-wine' : 'ring-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.shop_name && (
            <Link to={`/boutique/${product.seller_id}`} className="text-xs uppercase tracking-widest2 text-wine hover:underline">
              {product.shop_name}
            </Link>
          )}
          <h1 className="font-display text-3xl sm:text-4xl text-ink mt-2">{product.title}</h1>
          <div className="mt-3">
            <StarRating rating={product.rating} count={product.rating_count} size={16} />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="font-display text-2xl text-ink">{fmt(product.price)}</span>
            {product.compare_price && <span className="text-charcoal/40 line-through">{fmt(product.compare_price)}</span>}
          </div>

          <p className="text-charcoal/70 mt-5 leading-relaxed">{product.description}</p>

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-full border text-sm ${size === s ? 'bg-ink text-paper border-ink' : 'border-ink/15 text-charcoal/70 hover:border-ink/40'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-4 py-2 rounded-full border text-sm ${color === c ? 'bg-ink text-paper border-ink' : 'border-ink/15 text-charcoal/70 hover:border-ink/40'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center border border-ink/15 rounded-full">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3" aria-label="Decrease quantity"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="p-3" aria-label="Increase quantity"><Plus size={14} /></button>
            </div>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 bg-ink text-paper rounded-full py-3.5 font-body text-sm hover:bg-wine transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? 'Out of stock' : status === 'added' ? 'Added to bag ✓' : 'Add to bag'}
            </button>
            <button onClick={toggleWishlist} className="p-3.5 rounded-full border border-ink/15 hover:border-wine" aria-label="Wishlist">
              <Heart size={18} className={wished ? 'fill-wine text-wine' : 'text-ink/60'} />
            </button>
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-wine mt-2">Only {product.stock} left in stock</p>
          )}

          <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-ink/10 text-center text-xs text-charcoal/60">
            <div className="flex flex-col items-center gap-2"><Truck size={18} /> Fast delivery</div>
            <div className="flex flex-col items-center gap-2"><RotateCcw size={18} /> Easy returns</div>
            <div className="flex flex-col items-center gap-2"><ShieldCheck size={18} /> Secure checkout</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20 max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-6">Reviews ({reviews.length})</h2>
        {reviews.length === 0 && <p className="text-charcoal/50 text-sm mb-8">No reviews yet — be the first to share your fit.</p>}
        <div className="space-y-6 mb-10">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-ink/10 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <img src={r.user_avatar} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-ink">{r.user_name}</p>
                  <StarRating rating={r.rating} size={12} />
                </div>
              </div>
              {r.comment && <p className="text-sm text-charcoal/70">{r.comment}</p>}
            </div>
          ))}
        </div>

        {user && (
          <form onSubmit={submitReview} className="bg-mist rounded-2xl p-6">
            <p className="font-medium text-ink mb-3">Write a review</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))} aria-label={`${n} stars`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" className={n <= reviewForm.rating ? 'fill-gold' : 'fill-ink/15'}>
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L6 21l1.6-7L2.2 9.2l7.1-.6L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="How was the fit, fabric, and delivery?"
              className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm bg-white"
              rows={3}
            />
            <button type="submit" className="mt-3 bg-ink text-paper rounded-full px-5 py-2.5 text-sm hover:bg-wine transition-colors">
              Submit review
            </button>
          </form>
        )}
      </div>

      {related?.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl text-ink mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl text-ink mb-6">Recently viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
