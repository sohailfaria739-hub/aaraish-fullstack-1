const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

function getCart(userId) {
  const rows = db.prepare(`
    SELECT ci.*, p.title, p.price, p.images, p.stock, p.status
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? ORDER BY ci.created_at DESC
  `).all(userId);
  return rows.map((r) => ({ ...r, images: JSON.parse(r.images || '[]') }));
}

router.get('/', (req, res) => {
  res.json({ items: getCart(req.user.id) });
});

router.post('/', (req, res) => {
  const { product_id, quantity = 1, size = '', color = '' } = req.body;
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'active'").get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found or unavailable' });

  const existing = db.prepare(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?'
  ).get(req.user.id, product_id, size, color);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?,?,?,?,?)')
      .run(req.user.id, product_id, quantity, size, color);
  }
  res.status(201).json({ items: getCart(req.user.id) });
});

router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (quantity < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  }
  res.json({ items: getCart(req.user.id) });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ items: getCart(req.user.id) });
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ items: [] });
});

module.exports = router;
