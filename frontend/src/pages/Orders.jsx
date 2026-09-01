import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { fmt } from '../components/ProductCard';

const statusColor = {
  pending: 'bg-gold/20 text-gold',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return <p className="text-xs text-red-600 mt-2">This item was cancelled.</p>;
  }
  const activeIndex = STEPS.indexOf(status);
  return (
    <div className="flex items-center mt-2 mb-1">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${i <= activeIndex ? 'bg-wine' : 'bg-ink/15'}`} />
            <span className={`text-[10px] mt-1 capitalize whitespace-nowrap ${i <= activeIndex ? 'text-wine' : 'text-charcoal/35'}`}>{step}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 mx-1 ${i < activeIndex ? 'bg-wine' : 'bg-ink/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    client.get('/orders/mine').then((res) => setOrders(res.data.orders));
  }, []);

  if (!orders) return <div className="py-32 text-center text-charcoal/40">Loading…</div>;

  if (orders.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">No orders yet</h1>
        <Link to="/shop" className="inline-block bg-ink text-paper rounded-full px-6 py-3 text-sm hover:bg-wine">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10 max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">My orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-ink/10 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-sm text-ink font-medium">Order #{order.id}</p>
                <p className="text-xs text-charcoal/50">{new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full capitalize ${statusColor[order.status] || 'bg-mist text-charcoal/60'}`}>{order.status}</span>
            </div>
            <div className="divide-y divide-ink/5">
              {order.items.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt="" className="w-12 h-14 object-cover rounded-md bg-mist" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{item.title}</p>
                      <p className="text-xs text-charcoal/50">
                        {[item.size, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm text-ink">{fmt(item.price * item.quantity)}</span>
                  </div>
                  <StatusTimeline status={item.status} />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-ink/10 mt-3 pt-3">
              <p className="text-xs text-charcoal/50">Shipping to {order.shipping_city}</p>
              <div className="text-right">
                {order.discount > 0 && <p className="text-xs text-wine">-{fmt(order.discount)} ({order.coupon_code})</p>}
                <p className="font-medium text-ink">{fmt(order.total)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
