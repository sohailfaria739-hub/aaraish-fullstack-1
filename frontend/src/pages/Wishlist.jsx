import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const [items, setItems] = useState(null);

  const load = () => client.get('/wishlist').then((res) => setItems(res.data.items));
  useEffect(() => { load(); }, []);

  const toggleWishlist = async (product) => {
    await client.delete(`/wishlist/${product.id}`);
    load();
  };

  if (!items) return <div className="py-32 text-center text-charcoal/40">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Your wishlist is empty</h1>
        <Link to="/shop" className="inline-block bg-ink text-paper rounded-full px-6 py-3 text-sm hover:bg-wine">Discover pieces you'll love</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} onToggleWishlist={toggleWishlist} wished />
        ))}
      </div>
    </div>
  );
}
