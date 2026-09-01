import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { fmt } from '../components/ProductCard';

export default function Checkout() {
  const { items, total, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ shipping_name: '', shipping_address: '', shipping_city: '', shipping_phone: '', payment_method: 'cod' });
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = coupon?.discount || 0;
  const grandTotal = Math.max(0, total - discount);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setApplyingCoupon(true);
    try {
      const res = await client.post('/coupons/validate', { code: couponInput.trim(), subtotal: total });
      setCoupon({ code: res.data.coupon.code, discount: res.data.discount });
    } catch (err) {
      setCoupon(null);
      setCouponError(err.response?.data?.error || 'Could not apply that coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(''); setCouponError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const res = await client.post('/orders/checkout', { ...form, coupon_code: coupon?.code });
      await refresh();
      navigate(`/orders`, { state: { placedOrderId: res.data.order.id } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Nothing to check out</h1>
        <p className="text-charcoal/50">Your bag is empty right now.</p>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <form onSubmit={submit} className="space-y-5 max-w-lg">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Full name</label>
            <input required value={form.shipping_name} onChange={(e) => setForm((f) => ({ ...f, shipping_name: e.target.value }))}
              className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Address</label>
            <input required value={form.shipping_address} onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))}
              className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest2 text-charcoal/40">City</label>
              <input required value={form.shipping_city} onChange={(e) => setForm((f) => ({ ...f, shipping_city: e.target.value }))}
                className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Phone</label>
              <input required value={form.shipping_phone} onChange={(e) => setForm((f) => ({ ...f, shipping_phone: e.target.value }))}
                className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-2 block">Payment method</label>
            <div className="space-y-2">
              {[{ id: 'cod', label: 'Cash on delivery' }, { id: 'card', label: 'Credit / debit card (demo)' }].map((opt) => (
                <label key={opt.id} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer ${form.payment_method === opt.id ? 'border-wine bg-wine/5' : 'border-ink/15'}`}>
                  <input type="radio" name="payment" checked={form.payment_method === opt.id}
                    onChange={() => setForm((f) => ({ ...f, payment_method: opt.id }))} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-wine">{error}</p>}

          <button disabled={placing} type="submit" className="w-full bg-ink text-paper rounded-full py-3.5 text-sm hover:bg-wine transition-colors disabled:opacity-50">
            {placing ? 'Placing order…' : `Place order · ${fmt(grandTotal)}`}
          </button>
        </form>

        <div className="bg-mist rounded-2xl p-6 h-fit">
          <h2 className="font-display text-xl text-ink mb-4">Order summary</h2>
          <div className="divide-y divide-ink/10">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex items-center gap-3">
                <img src={item.images?.[0]} alt="" className="w-12 h-14 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{item.title}</p>
                  <p className="text-xs text-charcoal/50">Qty {item.quantity}</p>
                </div>
                <span className="text-sm text-ink">{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-ink/10 pt-4 mt-2">
            {coupon ? (
              <div className="flex items-center justify-between bg-wine/10 rounded-lg px-3 py-2 mb-3">
                <span className="text-sm text-wine font-medium">{coupon.code} applied</span>
                <button type="button" onClick={removeCoupon} className="text-xs text-wine underline">Remove</button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 border border-ink/15 rounded-lg px-3 py-2 text-sm bg-white uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon}
                    className="border border-ink/20 rounded-lg px-4 text-sm hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-wine mt-1.5">{couponError}</p>}
                <p className="text-[11px] text-charcoal/40 mt-1.5">Try WELCOME10, FLAT500, or EID15</p>
              </div>
            )}

            <div className="flex justify-between text-sm text-charcoal/70 mb-2">
              <span>Subtotal</span><span>{fmt(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-wine mb-2">
                <span>Discount</span><span>-{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-ink text-lg pt-2 border-t border-ink/10">
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
