import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const { user } = useAuth();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    client.get('/products/categories').then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    if (user) client.get('/wishlist').then((res) => setWishlistIds(new Set(res.data.items.map((p) => p.id))));
    else setWishlistIds(new Set());
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = { search, category, sort, minPrice, maxPrice, page, limit: 12 };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    client.get('/products', { params }).then((res) => {
      setProducts(res.data.products);
      setPagination(res.data.pagination);
      setLoading(false);
    });
  }, [search, category, sort, minPrice, maxPrice, page]);

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

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

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="container-px py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          {search ? `Results for “${search}”` : activeCategory ? activeCategory.name : 'Shop all'}
        </h1>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="lg:hidden inline-flex items-center gap-2 text-sm border border-ink/15 rounded-full px-4 py-2"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>
      <p className="text-charcoal/50 text-sm mb-8">{pagination?.total ?? '…'} items</p>

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="flex items-center justify-between lg:hidden mb-4">
            <p className="font-medium">Filters</p>
            <button onClick={() => setFiltersOpen(false)}><X size={18} /></button>
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-3">Category</p>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => updateParam('category', '')} className={`hover:text-wine ${!category ? 'text-wine font-medium' : 'text-charcoal/70'}`}>
                  All
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => updateParam('category', c.slug)}
                    className={`hover:text-wine ${category === c.slug ? 'text-wine font-medium' : 'text-charcoal/70'}`}
                  >
                    {c.name} <span className="text-charcoal/30">({c.product_count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-3">Price (Rs)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value)}
                className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-charcoal/30">–</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-charcoal/40 mb-3">Sort by</p>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Top rated</option>
              <option value="popular">Most popular</option>
            </select>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-mist rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center text-charcoal/50">
              <p className="font-display text-xl text-ink mb-2">No products match yet</p>
              <p className="text-sm">Try clearing a filter or searching a different term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onToggleWishlist={user ? toggleWishlist : undefined} wished={wishlistIds.has(p.id)} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam('page', String(i + 1))}
                  className={`w-9 h-9 rounded-full text-sm ${page === i + 1 ? 'bg-ink text-paper' : 'text-charcoal/60 hover:bg-mist'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
