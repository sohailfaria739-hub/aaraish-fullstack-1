const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

function fullOrder(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  return { ...order, items };
}

function computeDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (subtotal < (coupon.min_subtotal || 0)) return 0;
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(raw, subtotal);
}

// Checkout: create an order from the buyer's current cart
router.post('/checkout', (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_phone, payment_method = 'cod', coupon_code } = req.body;
  if (!shipping_name || !shipping_address || !shipping_city || !shipping_phone) {
    return res.status(400).json({ error: 'Full shipping details are required' });
  }

  const cartItems = db.prepare(`
    SELECT ci.*, p.title, p.price, p.images, p.stock, p.seller_id, p.status
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Your cart is empty' });

  for (const item of cartItems) {
    if (item.status !== 'active') return res.status(400).json({ error: `${item.title} is no longer available` });
    if (item.stock < item.quantity) return res.status(400).json({ error: `Not enough stock for ${item.title}` });
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let coupon = null;
  if (coupon_code) {
    coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(coupon_code.toUpperCase());
    if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon code' });
    if (subtotal < (coupon.min_subtotal || 0)) {
      return res.status(400).json({ error: `This coupon needs a minimum order of Rs ${coupon.min_subtotal}` });
    }
  }
  const discount = computeDiscount(coupon, subtotal);
  const total = subtotal - discount;

  const tx = db.transaction(() => {
    const orderInfo = db.prepare(`
      INSERT INTO orders (buyer_id, subtotal, discount, coupon_code, total, shipping_name, shipping_address, shipping_city, shipping_phone, payment_method)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(req.user.id, subtotal, discount, coupon ? coupon.code : null, total, shipping_name, shipping_address, shipping_city, shipping_phone, payment_method);

    const orderId = orderInfo.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, seller_id, title, price, quantity, size, color, image)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      const images = JSON.parse(item.images || '[]');
      insertItem.run(orderId, item.product_id, item.seller_id, item.title, item.price, item.quantity, item.size, item.color, images[0] || '');
      decrementStock.run(item.quantity, item.product_id);
    }
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = tx();
  res.status(201).json({ order: fullOrder(orderId) });
});

// Buyer's own orders
router.get('/mine', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map((o) => ({ ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id) }));
  res.json({ orders: withItems });
});

// Seller's incoming order items
router.get('/selling', requireRole('seller', 'admin'), (req, res) => {
  const items = db.prepare(`
    SELECT oi.*, o.created_at as order_date, o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_phone, o.payment_method
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json({ items });
});

router.get('/:id', (req, res) => {
  const order = fullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to view this order' });
  }
  res.json({ order });
});

// Seller updates fulfillment status of their line item
router.put('/items/:itemId/status', requireRole('seller', 'admin'), (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const item = db.prepare('SELECT * FROM order_items WHERE id = ?').get(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Order item not found' });
  if (item.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(status, req.params.itemId);
  res.json({ success: true });
});

module.exports = router;
