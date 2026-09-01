const express = require('express');
const db = require('../db');
const { authRequired, authOptional, requireRole } = require('../middleware/auth');

const router = express.Router();

function parseProduct(p) {
  return {
    ...p,
    images: JSON.parse(p.images || '[]'),
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
  };
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&sellerId=&page=&limit=
router.get('/', (req, res) => {
  const { search, category, minPrice, maxPrice, sort, sellerId, ids, page = 1, limit = 12 } = req.query;

  let where = ["p.status = 'active'"];
  const params = {};

  if (ids) {
    const idList = String(ids).split(',').map((n) => Number(n)).filter(Boolean);
    if (idList.length === 0) return res.json({ products: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } });
    const placeholders = idList.map((_, i) => `@id${i}`).join(',');
    where.push(`p.id IN (${placeholders})`);
    idList.forEach((id, i) => { params[`id${i}`] = id; });
  }

  if (search) {
    where.push('(p.title LIKE @search OR p.description LIKE @search)');
    params.search = `%${search}%`;
  }
  if (category) {
    where.push('c.slug = @category');
    params.category = category;
  }
  if (minPrice) {
    where.push('p.price >= @minPrice');
    params.minPrice = Number(minPrice);
  }
  if (maxPrice) {
    where.push('p.price <= @maxPrice');
    params.maxPrice = Number(maxPrice);
  }
  if (sellerId) {
    where.push('p.seller_id = @sellerId');
    params.sellerId = Number(sellerId);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'rating') orderBy = 'p.rating DESC';
  else if (sort === 'popular') orderBy = 'p.rating_count DESC';

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(48, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const total = db.prepare(`
    SELECT COUNT(*) c FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}
  `).get(params).c;

  const rows = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, u.shop_name, u.name as seller_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.seller_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: limitNum, offset });

  res.json({
    products: rows.map(parseProduct),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get('/categories', (req, res) => {
  const cats = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json({ categories: cats });
});

router.get('/:id', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, u.shop_name, u.name as seller_name, u.avatar as seller_avatar
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? ORDER BY r.created_at DESC
  `).all(req.params.id);

  const related = db.prepare(`
    SELECT id, title, price, images FROM products
    WHERE category_id = ? AND id != ? AND status = 'active' LIMIT 4
  `).all(p.category_id, p.id).map(parseProduct);

  res.json({ product: parseProduct(p), reviews, related });
});

router.post('/', authRequired, requireRole('seller', 'admin'), (req, res) => {
  const { title, description, price, compare_price, category_id, images, sizes, colors, stock } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'Title and price are required' });

  const info = db.prepare(`
    INSERT INTO products (seller_id, category_id, title, description, price, compare_price, images, sizes, colors, stock)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    req.user.id, category_id || null, title, description || '', Number(price), compare_price ? Number(compare_price) : null,
    JSON.stringify(images || []), JSON.stringify(sizes || []), JSON.stringify(colors || []), Number(stock) || 0
  );
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: parseProduct(product) });
});

router.put('/:id', authRequired, requireRole('seller', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only edit your own products' });
  }
  const fields = ['title', 'description', 'price', 'compare_price', 'category_id', 'stock', 'status'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (req.body.images !== undefined) updates.images = JSON.stringify(req.body.images);
  if (req.body.sizes !== undefined) updates.sizes = JSON.stringify(req.body.sizes);
  if (req.body.colors !== undefined) updates.colors = JSON.stringify(req.body.colors);

  const setSql = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  if (setSql) {
    db.prepare(`UPDATE products SET ${setSql}, updated_at = datetime('now') WHERE id = @id`)
      .run({ ...updates, id: req.params.id });
  }
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product: parseProduct(product) });
});

router.delete('/:id', authRequired, requireRole('seller', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only delete your own products' });
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/reviews', authRequired, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)')
    .run(req.params.id, req.user.id, rating, comment || '');

  const agg = db.prepare('SELECT AVG(rating) avg, COUNT(*) count FROM reviews WHERE product_id = ?').get(req.params.id);
  db.prepare('UPDATE products SET rating = ?, rating_count = ? WHERE id = ?')
    .run(Math.round(agg.avg * 10) / 10, agg.count, req.params.id);

  res.status(201).json({ success: true });
});

module.exports = router;
