const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/:id', (req, res) => {
  const seller = db.prepare(
    `SELECT id, name, shop_name, avatar, created_at FROM users WHERE id = ? AND role IN ('seller','admin')`
  ).get(req.params.id);
  if (!seller) return res.status(404).json({ error: 'Shop not found' });

  const agg = db.prepare(`
    SELECT COUNT(*) product_count, COALESCE(AVG(rating),0) avg_rating, COALESCE(SUM(rating_count),0) review_count
    FROM products WHERE seller_id = ? AND status = 'active'
  `).get(req.params.id);

  res.json({ seller: { ...seller, ...agg, avg_rating: Math.round(agg.avg_rating * 10) / 10 } });
});

module.exports = router;
