const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbPath = path.join(__dirname, 'aaraish.db');

// On Vercel, /tmp is the only writable directory
if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'aaraish.db');
  // Copy the pre-seeded db if it exists locally, otherwise create new in tmp
  if (!fs.existsSync(tmpDbPath)) {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpDbPath);
    }
  }
  dbPath = tmpDbPath;
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer',
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
  images TEXT NOT NULL DEFAULT '[]',
  sizes TEXT DEFAULT '[]',
  colors TEXT DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
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
  status TEXT NOT NULL DEFAULT 'pending',
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
  type TEXT NOT NULL DEFAULT 'percent',
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
  status TEXT NOT NULL DEFAULT 'pending'
);
`);

// ---- Seed data (idempotent) ----
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password, role, shop_name, avatar) VALUES (?,?,?,?,?,?)`
  );
  insertUser.run('Admin', 'admin@aaraish.com', hash('admin123'), 'admin', null, null);
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
    }
  ];
  for (const p of products) insertProduct.run(p);

  const insertCoupon = db.prepare(`INSERT INTO coupons (code, type, value, min_subtotal) VALUES (?,?,?,?)`);
  insertCoupon.run('WELCOME10', 'percent', 10, 0);
  insertCoupon.run('FLAT500', 'flat', 500, 3000);
  insertCoupon.run('EID15', 'percent', 15, 5000);
}

module.exports = db;