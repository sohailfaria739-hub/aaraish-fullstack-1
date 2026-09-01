import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Package, DollarSign, ShoppingBag, AlertTriangle } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../components/ProductCard';

const emptyForm = {
  title: '', description: '', price: '', compare_price: '', category_id: '',
  images: '', sizes: '', colors: '', stock: '',
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-ink/10 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-wine/10 text-wine flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-charcoal/50">{label}</p>
        <p className="font-display text-xl text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    client.get('/seller/stats').then((res) => setStats(res.data));
    client.get('/seller/products').then((res) => setProducts(res.data.products));
    client.get('/orders/selling').then((res) => setOrderItems(res.data.items));
  };

  useEffect(() => {
    loadAll();
    client.get('/products/categories').then((res) => setCategories(res.data.categories));
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description || '', price: p.price, compare_price: p.compare_price || '',
      category_id: p.category_id || '', images: p.images.join(', '), sizes: p.sizes.join(', '), colors: p.colors.join(', '),
      stock: p.stock,
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      stock: Number(form.stock) || 0,
    };
    try {
      if (editing) await client.put(`/products/${editing.id}`, payload);
      else await client.post('/products', payload);
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await client.delete(`/products/${p.id}`);
    loadAll();
  };

  const updateItemStatus = async (item, status) => {
    await client.put(`/orders/items/${item.id}/status`, { status });
    loadAll();
  };

  return (
    <div className="container-px py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">{user.shop_name || 'Seller dashboard'}</h1>
          <p className="text-charcoal/50 text-sm mt-1">Manage your listings and incoming orders.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-ink text-paper rounded-full px-5 py-2.5 text-sm hover:bg-wine transition-colors">
          <Plus size={16} /> New listing
        </button>
      </div>

      <div className="flex gap-6 border-b border-ink/10 mb-8 text-sm">
        {[{ id: 'overview', label: 'Overview' }, { id: 'products', label: `Products (${products.length})` }, { id: 'orders', label: `Orders (${orderItems.length})` }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 -mb-px border-b-2 transition-colors ${tab === t.id ? 'border-wine text-wine' : 'border-transparent text-charcoal/50 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Package} label="Active listings" value={stats.productCount} />
            <StatCard icon={DollarSign} label="Total revenue" value={fmt(stats.revenue)} />
            <StatCard icon={ShoppingBag} label="Orders received" value={stats.orderCount} />
            <StatCard icon={AlertTriangle} label="Low stock (≤5)" value={stats.lowStock} />
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <h2 className="font-display text-xl text-ink mb-4">Top sellers</h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-charcoal/50">No sales yet — once orders come in, your best sellers show up here.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{p.title}</span>
                    <span className="text-charcoal/50">{p.sold} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="text-center py-20 text-charcoal/50">
              <p className="mb-4">You haven't listed anything yet.</p>
              <button onClick={openAdd} className="bg-ink text-paper rounded-full px-5 py-2.5 text-sm hover:bg-wine">Create your first listing</button>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest2 text-charcoal/40 border-b border-ink/10">
                  <th className="py-3 font-normal">Product</th>
                  <th className="py-3 font-normal">Price</th>
                  <th className="py-3 font-normal">Stock</th>
                  <th className="py-3 font-normal">Status</th>
                  <th className="py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded-md bg-mist" />
                        <span className="text-ink font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-ink">{fmt(p.price)}</td>
                    <td className="py-3">
                      <span className={p.stock <= 5 ? 'text-wine' : 'text-charcoal/70'}>{p.stock}</span>
                    </td>
                    <td className="py-3 capitalize text-charcoal/60">{p.status}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 hover:text-wine" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => remove(p)} className="p-2 hover:text-wine" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {orderItems.length === 0 ? (
            <p className="text-center py-20 text-charcoal/50">No orders yet for your shop.</p>
          ) : (
            orderItems.map((item) => (
              <div key={item.id} className="border border-ink/10 rounded-2xl p-5 flex flex-wrap items-center gap-4">
                <img src={item.image} alt="" className="w-14 h-16 object-cover rounded-md bg-mist" />
                <div className="flex-1 min-w-[180px]">
                  <p className="text-ink font-medium">{item.title}</p>
                  <p className="text-xs text-charcoal/50">
                    {[item.size, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity} · {fmt(item.price * item.quantity)}
                  </p>
                  <p className="text-xs text-charcoal/40 mt-1">Ship to: {item.shipping_name}, {item.shipping_city} · {item.shipping_phone}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => updateItemStatus(item, e.target.value)}
                  className="border border-ink/15 rounded-full px-3 py-2 text-xs capitalize bg-white"
                >
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-paper rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-ink">{editing ? 'Edit listing' : 'New listing'}</h2>
              <button onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Title</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Price (Rs)</label>
                  <input required type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Compare-at price</label>
                  <input type="number" min="0" value={form.compare_price} onChange={(e) => setForm((f) => ({ ...f, compare_price: e.target.value }))}
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Stock</label>
                  <input required type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Image URLs (comma separated)</label>
                <input value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  placeholder="https://…, https://…"
                  className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Sizes (comma separated)</label>
                  <input value={form.sizes} onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                    placeholder="S, M, L, XL"
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Colors (comma separated)</label>
                  <input value={form.colors} onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
                    placeholder="Black, Wine"
                    className="w-full mt-1.5 border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>
              {error && <p className="text-sm text-wine">{error}</p>}
              <button disabled={saving} className="w-full bg-ink text-paper rounded-full py-3 text-sm hover:bg-wine transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
