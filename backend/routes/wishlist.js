const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.* FROM wishlist_items w JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ? ORDER BY w.created_at DESC
  `).all(req.user.id);
  res.json({ items: rows.map((p) => ({ ...p, images: JSON.parse(p.images || '[]') })) });
});

router.post('/:productId', (req, res) => {
  try {
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?,?)').run(req.user.id, req.params.productId);
  } catch (e) { /* already exists */ }
  res.status(201).json({ success: true });
});

router.delete('/:productId', (req, res) => {
  db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ success: true });
});

module.exports = router;
