import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import client from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    client.get('/products/categories').then((res) => setCategories(res.data.categories));
    client.get('/products?limit=8').then((res) => setFeatured(res.data.products));
    client.get('/products?sort=popular&limit=4').then((res) => setTrending(res.data.products));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="container-px grid lg:grid-cols-2 gap-10 items-center py-14 lg:py-0 lg:min-h-[86vh]">
          <div className="order-2 lg:order-1 max-w-xl">
            <p className="uppercase tracking-widest2 text-xs text-wine mb-5">New arrivals, every week</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.2rem] leading-[1.02] text-ink">
              Dressed for
              <br />
              <span className="italic text-wine">every</span> occasion.
            </h1>
            <p className="mt-6 text-charcoal/70 text-base sm:text-lg max-w-md">
              Aaraish brings independent boutiques and tailors together in one wardrobe — dresses, formal wear,
              modest wear, and the accessories that finish the look.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-ink text-paper px-7 py-3.5 rounded-full font-body text-sm hover:bg-wine transition-colors"
              >
                Shop the edit <ArrowUpRight size={16} />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 text-ink text-sm border-b border-ink/40 pb-0.5 hover:border-wine hover:text-wine transition-colors">
                Sell on Aaraish
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-8 text-charcoal/60 text-sm">
              <div>
                <p className="font-display text-2xl text-ink">120+</p>
                <p>Independent sellers</p>
              </div>
              <div className="w-px h-10 bg-ink/10" />
              <div>
                <p className="font-display text-2xl text-ink">4.7★</p>
                <p>Average rating</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative h-[52vh] lg:h-[80vh]">
            <div className="absolute inset-0 grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=900"
                alt="Model in an emerald evening dress"
                className="w-full h-full object-cover rounded-2xl mt-10"
              />
              <img
                src="https://images.unsplash.com/photo-1521467752200-3bccf80f16ed?w=900"
                alt="Model in a bridal gown"
                className="w-full h-full object-cover rounded-2xl -mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="container-px py-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Shop by category</h2>
          <Link to="/shop" className="text-sm text-wine hover:underline hidden sm:block">View all</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className="shrink-0 w-40 sm:w-auto group"
            >
              <div className="aspect-square rounded-full overflow-hidden bg-mist">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="mt-3 text-center text-sm font-medium text-ink">{c.name}</p>
              <p className="text-center text-xs text-charcoal/40">{c.product_count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="container-px py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Fresh on Aaraish</h2>
          <Link to="/shop" className="text-sm text-wine hover:underline hidden sm:block">Browse the shop</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trending strip */}
      {trending.length > 0 && (
        <section className="bg-mist mt-20 py-16">
          <div className="container-px">
            <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">Most loved right now</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
              {trending.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sell CTA */}
      <section className="container-px py-20">
        <div className="bg-ink rounded-3xl px-8 py-14 sm:px-16 sm:py-20 text-center">
          <p className="uppercase tracking-widest2 text-xs text-gold mb-4">For designers & boutiques</p>
          <h2 className="font-display text-3xl sm:text-4xl text-paper max-w-xl mx-auto">
            Bring your dresses to a wardrobe of thousands.
          </h2>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-8 bg-paper text-ink px-7 py-3.5 rounded-full font-body text-sm hover:bg-gold hover:text-ink transition-colors"
          >
            Start selling <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
