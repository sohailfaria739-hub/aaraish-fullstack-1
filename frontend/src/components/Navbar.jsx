import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10">
      <div className="container-px flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="font-display text-2xl tracking-tight text-ink">
            Aaraish
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 font-body text-[13px] uppercase tracking-widest2 text-charcoal">
          <Link to="/shop" className="hover:text-wine transition-colors">Shop</Link>
          <Link to="/shop?category=dresses" className="hover:text-wine transition-colors">Dresses</Link>
          <Link to="/shop?sort=popular" className="hover:text-wine transition-colors">Trending</Link>
          {user?.role === 'seller' && (
            <Link to="/sell" className="hover:text-wine transition-colors">Sell</Link>
          )}
        </nav>

        <form onSubmit={submitSearch} className="hidden md:flex items-center flex-1 max-w-sm bg-mist rounded-full px-4 py-2">
          <Search size={16} className="text-charcoal/50 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, bags, shoes…"
            className="bg-transparent outline-none border-none text-sm w-full px-2 placeholder:text-charcoal/40"
          />
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/wishlist" className="p-2 hover:text-wine transition-colors hidden sm:block" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link to="/cart" className="relative p-2 hover:text-wine transition-colors" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-wine text-paper text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="p-1 rounded-full ring-1 ring-ink/10 ml-1"
                aria-label="Account menu"
              >
                <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt="" className="w-8 h-8 rounded-full" />
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl ring-1 ring-ink/10 py-2 font-body text-sm"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-ink/5">
                    <p className="font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-charcoal/50 text-xs truncate">{user.email}</p>
                  </div>
                  <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-mist">
                    <Package size={15} /> My orders
                  </Link>
                  {user.role === 'seller' && (
                    <Link to="/sell" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-mist">
                      <LayoutDashboard size={15} /> Seller dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-mist text-left text-wine"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="p-2 hover:text-wine transition-colors" aria-label="Sign in">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-ink/10 bg-paper px-5 py-4 space-y-3 font-body text-sm">
          <form onSubmit={submitSearch} className="flex items-center bg-mist rounded-full px-4 py-2 mb-2">
            <Search size={16} className="text-charcoal/50 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none border-none text-sm w-full px-2"
            />
          </form>
          <Link to="/shop" onClick={() => setMenuOpen(false)} className="block py-1">Shop</Link>
          <Link to="/shop?category=dresses" onClick={() => setMenuOpen(false)} className="block py-1">Dresses</Link>
          <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block py-1">Wishlist</Link>
          {user?.role === 'seller' && <Link to="/sell" onClick={() => setMenuOpen(false)} className="block py-1">Sell</Link>}
        </div>
      )}
    </header>
  );
}
