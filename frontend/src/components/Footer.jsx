import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-ink text-paper/80 mt-24">
      <div className="container-px py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-2xl text-paper">Aaraish</p>
          <p className="text-sm mt-3 text-paper/50 max-w-xs">
            A marketplace for dresses, formal wear, and everyday style — from independent sellers across Lahore and beyond.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40 mb-3">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-white">All products</Link></li>
            <li><Link to="/shop?category=dresses" className="hover:text-white">Dresses</Link></li>
            <li><Link to="/shop?sort=popular" className="hover:text-white">Trending</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40 mb-3">Sell</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/register" className="hover:text-white">Become a seller</Link></li>
            <li><Link to="/sell" className="hover:text-white">Seller dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40 mb-3">Account</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/orders" className="hover:text-white">My orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-px py-5 border-t border-paper/10 text-xs text-paper/40">
        © {new Date().getFullYear()} Aaraish. All rights reserved.
      </div>
    </footer>
  );
}
