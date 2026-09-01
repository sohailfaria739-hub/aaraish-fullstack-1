import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', shop_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate(form.role === 'seller' ? '/sell' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px py-16 max-w-md mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Create your account</h1>
      <p className="text-charcoal/50 mb-8 text-sm">Shop the marketplace, or open your own boutique on Aaraish.</p>

      <div className="flex mb-6 border border-ink/15 rounded-full p-1">
        {[{ id: 'buyer', label: 'Shop' }, { id: 'seller', label: 'Sell' }].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setForm((f) => ({ ...f, role: opt.id }))}
            className={`flex-1 rounded-full py-2 text-sm transition-colors ${form.role === opt.id ? 'bg-ink text-paper' : 'text-charcoal/60'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Full name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
        </div>
        {form.role === 'seller' && (
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Shop name</label>
            <input required value={form.shop_name} onChange={(e) => setForm((f) => ({ ...f, shop_name: e.target.value }))}
              placeholder="e.g. Zohaib Couture"
              className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
        </div>
        {error && <p className="text-sm text-wine">{error}</p>}
        <button disabled={loading} className="w-full bg-ink text-paper rounded-full py-3.5 text-sm hover:bg-wine transition-colors disabled:opacity-50">
          {loading ? 'Creating account…' : form.role === 'seller' ? 'Create seller account' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-charcoal/60 mt-6">
        Already have an account? <Link to="/login" className="text-wine hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
