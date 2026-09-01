const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('seller', 'admin'));

router.get('/stats', (req, res) => {
  const sellerId = req.user.id;
  const productCount = db.prepare("SELECT COUNT(*) c FROM products WHERE seller_id = ? AND status != 'archived'").get(sellerId).c;
  const revenue = db.prepare("SELECT COALESCE(SUM(price * quantity),0) r FROM order_items WHERE seller_id = ? AND status != 'cancelled'").get(sellerId).r;
  const orderCount = db.prepare('SELECT COUNT(DISTINCT order_id) c FROM order_items WHERE seller_id = ?').get(sellerId).c;
  const pending = db.prepare("SELECT COUNT(*) c FROM order_items WHERE seller_id = ? AND status = 'pending'").get(sellerId).c;
  const lowStock = db.prepare("SELECT COUNT(*) c FROM products WHERE seller_id = ? AND stock <= 5 AND status = 'active'").get(sellerId).c;

  const topProducts = db.prepare(`
    SELECT p.id, p.title, SUM(oi.quantity) sold FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.seller_id = ? GROUP BY oi.product_id ORDER BY sold DESC LIMIT 5
  `).all(sellerId);

  res.json({ productCount, revenue, orderCount, pending, lowStock, topProducts });
});

router.get('/products', (req, res) => {
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json({ products: rows.map((p) => ({ ...p, images: JSON.parse(p.images || '[]'), sizes: JSON.parse(p.sizes || '[]'), colors: JSON.parse(p.colors || '[]') })) });
});

module.exports = router;
