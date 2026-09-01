import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="container-px py-16 max-w-md mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Welcome back</h1>
      <p className="text-charcoal/50 mb-8 text-sm">Sign in to shop, track orders, and manage your listings.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal/40">Password</label>
          <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full mt-1.5 border border-ink/15 rounded-lg px-4 py-3 text-sm" />
        </div>
        {error && <p className="text-sm text-wine">{error}</p>}
        <button disabled={loading} className="w-full bg-ink text-paper rounded-full py-3.5 text-sm hover:bg-wine transition-colors disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 bg-mist rounded-xl p-4 text-xs text-charcoal/60 space-y-1.5">
        <p className="font-medium text-ink mb-1">Try a demo account</p>
        <button onClick={() => fillDemo('buyer@aaraish.com', 'buyer123')} className="block hover:text-wine">Buyer — buyer@aaraish.com / buyer123</button>
        <button onClick={() => fillDemo('seller@aaraish.com', 'seller123')} className="block hover:text-wine">Seller — seller@aaraish.com / seller123</button>
      </div>

      <p className="text-sm text-charcoal/60 mt-6">
        New to Aaraish? <Link to="/register" className="text-wine hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
