import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function Boutique() {
  const { sellerId } = useParams();
  const { user } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    client.get(`/sellers/${sellerId}`).then((res) => setSeller(res.data.seller)).catch(() => setNotFound(true));
    client.get('/products', { params: { sellerId, limit: 24 } }).then((res) => setProducts(res.data.products));
  }, [sellerId]);

  useEffect(() => {
    if (user) client.get('/wishlist').then((res) => setWishlistIds(new Set(res.data.items.map((p) => p.id))));
  }, [user]);

  const toggleWishlist = async (product) => {
    if (!user) return;
    if (wishlistIds.has(product.id)) {
      await client.delete(`/wishlist/${product.id}`);
      setWishlistIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
    } else {
      await client.post(`/wishlist/${product.id}`);
      setWishlistIds((prev) => new Set(prev).add(product.id));
    }
  };

  if (notFound) return <div className="container-px py-24 text-center text-charcoal/50">This boutique couldn't be found.</div>;
  if (!seller) return <div className="py-32 text-center text-charcoal/40">Loading…</div>;

  return (
    <div>
      <div className="bg-mist border-b border-ink/10">
        <div className="container-px py-12 flex items-center gap-5">
          <img src={seller.avatar} alt="" className="w-20 h-20 rounded-full ring-4 ring-white" />
          <div>
            <h1 className="font-display text-3xl text-ink">{seller.shop_name || seller.name}</h1>
            <p className="text-sm text-charcoal/60 mt-1">
              {seller.product_count} listings
              {seller.avg_rating > 0 && <> · {seller.avg_rating}★ ({seller.review_count} reviews)</>}
            </p>
          </div>
        </div>
      </div>
      <div className="container-px py-10">
        {products.length === 0 ? (
          <p className="text-center py-16 text-charcoal/50">This boutique hasn't listed anything yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onToggleWishlist={user ? toggleWishlist : undefined} wished={wishlistIds.has(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
