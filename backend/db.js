const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'aaraish.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer', -- buyer | seller | admin
  shop_name TEXT,
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  compare_price REAL,
  images TEXT NOT NULL DEFAULT '[]', -- JSON array of urls
  sizes TEXT DEFAULT '[]',           -- JSON array e.g ["S","M","L"]
  colors TEXT DEFAULT '[]',          -- JSON array
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | draft | archived
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id, size, color)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  coupon_code TEXT,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | shipped | delivered | cancelled
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_phone TEXT,
  payment_method TEXT DEFAULT 'cod',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percent', -- percent | flat
  value REAL NOT NULL,
  min_subtotal REAL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT,
  color TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'pending' -- per-seller fulfillment status
);
`);

// ---- Seed data (idempotent) ----
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password, role, shop_name, avatar) VALUES (?,?,?,?,?,?)`
  );
  const admin = insertUser.run('Admin', 'admin@aaraish.com', hash('admin123'), 'admin', null, null);
  const seller = insertUser.run(
    'Zohaib Couture', 'seller@aaraish.com', hash('seller123'), 'seller', 'Zohaib Couture',
    'https://api.dicebear.com/7.x/initials/svg?seed=Zohaib+Couture'
  );
  const seller2 = insertUser.run(
    'Lahore Threads', 'threads@aaraish.com', hash('seller123'), 'seller', 'Lahore Threads',
    'https://api.dicebear.com/7.x/initials/svg?seed=Lahore+Threads'
  );
  insertUser.run('Test Buyer', 'buyer@aaraish.com', hash('buyer123'), 'buyer', null, null);

  const insertCat = db.prepare(`INSERT INTO categories (name, slug, image) VALUES (?,?,?)`);
  const cats = [
    ['Dresses', 'dresses', 'https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=600'],
    ['Formal Wear', 'formal-wear', 'https://images.unsplash.com/photo-1521467752200-3bccf80f16ed?w=600'],
    ['Casual Wear', 'casual-wear', 'https://images.unsplash.com/photo-1600102427329-d5b2cde7e162?w=600'],
    ['Abayas & Modest Wear', 'abayas-modest-wear', 'https://images.unsplash.com/photo-1772443326202-7670b8c7e0d1?w=600'],
    ['Bags & Accessories', 'bags-accessories', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'],
    ['Footwear', 'footwear', 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600'],
  ];
  const catIds = {};
  for (const [name, slug, image] of cats) {
    const r = insertCat.run(name, slug, image);
    catIds[slug] = r.lastInsertRowid;
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (seller_id, category_id, title, description, price, compare_price, images, sizes, colors, stock, rating, rating_count)
    VALUES (@seller_id, @category_id, @title, @description, @price, @compare_price, @images, @sizes, @colors, @stock, @rating, @rating_count)
  `);

  const sizesStd = JSON.stringify(['XS', 'S', 'M', 'L', 'XL']);
  const products = [
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Emerald Silk Wrap Dress', description: 'Flowing silk-blend wrap dress with a flattering waist tie, perfect for evening occasions.',
      price: 6499, compare_price: 8999,
      images: JSON.stringify(['https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=800', 'https://images.unsplash.com/photo-1631084675579-20db768ae08a?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Emerald', 'Black']), stock: 24, rating: 4.7, rating_count: 38,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Blush Floral Maxi Dress', description: 'Lightweight chiffon maxi with a delicate floral print, lined bodice, and flutter sleeves.',
      price: 4999, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1592924514972-71c5938462d1?w=800', 'https://images.unsplash.com/photo-1502868354157-ec2edd2a1651?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Blush', 'Ivory']), stock: 40, rating: 4.5, rating_count: 21,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['formal-wear'],
      title: 'Midnight Sequin Gown', description: 'Floor-length sequin gown with a fitted bodice and dramatic slit — red carpet ready.',
      price: 12999, compare_price: 15999,
      images: JSON.stringify(['https://images.unsplash.com/photo-1521467752200-3bccf80f16ed?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Midnight Blue', 'Black']), stock: 10, rating: 4.9, rating_count: 12,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['casual-wear'],
      title: 'Everyday Linen Shirt Dress', description: 'Breathable linen shirt dress with a self-tie belt — throw it on and go.',
      price: 3499, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1600102427329-d5b2cde7e162?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Sand', 'White', 'Olive']), stock: 55, rating: 4.3, rating_count: 44,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['abayas-modest-wear'],
      title: 'Crepe Open Abaya', description: 'Effortless open-front abaya in premium Nida crepe with contrast piping.',
      price: 5499, compare_price: 6499,
      images: JSON.stringify(['https://images.unsplash.com/photo-1772443326202-7670b8c7e0d1?w=800']),
      sizes: JSON.stringify(['52', '54', '56', '58']), colors: JSON.stringify(['Black', 'Mocha']), stock: 30, rating: 4.6, rating_count: 19,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['bags-accessories'],
      title: 'Structured Top-Handle Bag', description: 'Vegan-leather structured bag with gold-tone hardware and detachable strap.',
      price: 3999, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']),
      sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Tan', 'Black']), stock: 18, rating: 4.4, rating_count: 9,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['footwear'],
      title: 'Satin Block Heels', description: 'Comfort block-heel sandals in satin finish with an ankle strap.',
      price: 2999, compare_price: 3999,
      images: JSON.stringify(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800']),
      sizes: JSON.stringify(['36', '37', '38', '39', '40']), colors: JSON.stringify(['Blush', 'Black']), stock: 33, rating: 4.2, rating_count: 15,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Charcoal Bodycon Dress', description: 'Ribbed bodycon dress with a mock neck — a night-out staple.',
      price: 2799, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1609357602746-10ade0197845?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Charcoal', 'Wine']), stock: 60, rating: 4.1, rating_count: 27,
    },
    // --- Additional dresses ---
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Saffron Pleated Sundress', description: 'Sun-ready pleated dress in breathable poplin with adjustable straps.',
      price: 3299, compare_price: 3899,
      images: JSON.stringify(['https://images.unsplash.com/photo-1517970640957-23d07d5ed08c?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Saffron', 'White']), stock: 46, rating: 4.4, rating_count: 16,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Ivory Lace Bridal Dress', description: 'Hand-embroidered ivory gown with a cathedral train — made to order.',
      price: 24999, compare_price: 29999,
      images: JSON.stringify(['https://images.unsplash.com/photo-1622277430358-f4d134452e2e?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Ivory']), stock: 6, rating: 4.9, rating_count: 8,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['dresses'],
      title: 'Terracotta Wrap Midi', description: 'Soft jersey wrap midi with a flattering v-neck, perfect day-to-night.',
      price: 3799, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1772443324147-0b81bd123546?w=800']),
      sizes: sizesStd, colors: JSON.stringify(['Terracotta', 'Navy']), stock: 38, rating: 4.3, rating_count: 22,
    },
    // --- Footwear ---
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['footwear'],
      title: 'Gold Strappy Stilettos', description: 'Metallic strappy stilettos with a cushioned insole for all-night wear.',
      price: 3599, compare_price: 4299,
      images: JSON.stringify(['https://images.unsplash.com/photo-1524553879936-2ff074ae5816?w=800']),
      sizes: JSON.stringify(['36', '37', '38', '39', '40']), colors: JSON.stringify(['Gold', 'Silver']), stock: 27, rating: 4.5, rating_count: 20,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['footwear'],
      title: 'Ivory Pearl Kolhapuris', description: 'Handcrafted leather kolhapuri flats finished with pearl detailing.',
      price: 2499, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1590099033615-be195f8d575c?w=800']),
      sizes: JSON.stringify(['36', '37', '38', '39', '40', '41']), colors: JSON.stringify(['Ivory', 'Tan']), stock: 34, rating: 4.6, rating_count: 24,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['footwear'],
      title: 'Black Ankle-Strap Pumps', description: 'Classic pointed-toe pumps with a comfort block heel and ankle strap.',
      price: 2899, compare_price: 3499,
      images: JSON.stringify(['https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=800']),
      sizes: JSON.stringify(['36', '37', '38', '39', '40']), colors: JSON.stringify(['Black']), stock: 41, rating: 4.2, rating_count: 13,
    },
    // --- Bags & Accessories ---
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['bags-accessories'],
      title: 'Quilted Chain Sling Bag', description: 'Quilted vegan-leather sling with a gold chain strap — day to evening.',
      price: 3299, compare_price: 3999,
      images: JSON.stringify(['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800']),
      sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Black', 'Blush']), stock: 29, rating: 4.5, rating_count: 17,
    },
    {
      seller_id: seller.lastInsertRowid, category_id: catIds['bags-accessories'],
      title: 'Woven Straw Tote', description: 'Handwoven straw tote with leather trim — the everyday summer carry.',
      price: 2699, compare_price: null,
      images: JSON.stringify(['https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800']),
      sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Natural']), stock: 22, rating: 4.3, rating_count: 11,
    },
    {
      seller_id: seller2.lastInsertRowid, category_id: catIds['bags-accessories'],
      title: 'Emerald Velvet Clutch', description: 'Jewel-toned velvet clutch with an antique gold clasp, fits phone + card.',
      price: 2199, compare_price: 2599,
      images: JSON.stringify(['https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800']),
      sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Emerald', 'Wine']), stock: 25, rating: 4.7, rating_count: 14,
    },
  ];
  for (const p of products) insertProduct.run(p);

  const insertCoupon = db.prepare(`INSERT INTO coupons (code, type, value, min_subtotal) VALUES (?,?,?,?)`);
  insertCoupon.run('WELCOME10', 'percent', 10, 0);
  insertCoupon.run('FLAT500', 'flat', 500, 3000);
  insertCoupon.run('EID15', 'percent', 15, 5000);

  console.log('Seeded database with demo users, categories, products, and coupons.');
}

module.exports = db;
