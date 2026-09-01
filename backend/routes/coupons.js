const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/validate', authRequired, (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Enter a coupon code' });

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(String(code).toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
  if (Number(subtotal) < (coupon.min_subtotal || 0)) {
    return res.status(400).json({ error: `This coupon needs a minimum order of Rs ${coupon.min_subtotal.toLocaleString()}` });
  }

  const discount = coupon.type === 'percent'
    ? Math.min((Number(subtotal) * coupon.value) / 100, Number(subtotal))
    : Math.min(coupon.value, Number(subtotal));

  res.json({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount });
});

module.exports = router;
