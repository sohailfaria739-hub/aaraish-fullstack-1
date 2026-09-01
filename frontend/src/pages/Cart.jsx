import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../components/ProductCard';

export default function Cart() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Sign in to view your bag</h1>
        <Link to="/login" className="inline-block bg-ink text-paper rounded-full px-6 py-3 text-sm hover:bg-wine">Sign in</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Your bag is empty</h1>
        <p className="text-charcoal/50 mb-6">Add something beautiful to it.</p>
        <Link to="/shop" className="inline-block bg-ink text-paper rounded-full px-6 py-3 text-sm hover:bg-wine">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">Your bag</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <div className="divide-y divide-ink/10">
          {items.map((item) => (
            <div key={item.id} className="py-6 flex gap-4">
              <Link to={`/product/${item.product_id}`} className="w-24 h-28 rounded-lg overflow-hidden bg-mist shrink-0">
                <img src={item.images?.[0]} alt={item.title} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/product/${item.product_id}`} className="font-medium text-ink hover:text-wine">{item.title}</Link>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {[item.size, item.color].filter(Boolean).join(' · ') || 'Standard'}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-charcoal/30 hover:text-wine" aria-label="Remove item">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-ink/15 rounded-full">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2" aria-label="Decrease quantity"><Minus size={12} /></button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2" aria-label="Increase quantity"><Plus size={12} /></button>
                  </div>
                  <span className="font-medium text-ink">{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-mist rounded-2xl p-6 h-fit sticky top-24">
          <h2 className="font-display text-xl text-ink mb-4">Order summary</h2>
          <div className="flex justify-between text-sm text-charcoal/70 mb-2">
            <span>Subtotal</span><span>{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-charcoal/70 mb-4">
            <span>Shipping</span><span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between font-medium text-ink text-lg border-t border-ink/10 pt-4 mb-6">
            <span>Total</span><span>{fmt(total)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-ink text-paper rounded-full py-3.5 text-sm hover:bg-wine transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
