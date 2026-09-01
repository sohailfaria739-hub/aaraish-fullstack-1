// Mock Database layer for Vercel Serverless compatibility
const bcrypt = require('bcryptjs');

let products = [
  { id: 1, title: 'Emerald Silk Wrap Dress', price: 6499, category_id: 1, images: '["https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=800"]', stock: 24, rating: 4.7 },
  { id: 2, title: 'Blush Floral Maxi Dress', price: 4999, category_id: 1, images: '["https://images.unsplash.com/photo-1592924514972-71c5938462d1?w=800"]', stock: 40, rating: 4.5 },
  { id: 3, title: 'Midnight Sequin Gown', price: 12999, category_id: 2, images: '["https://images.unsplash.com/photo-1521467752200-3bccf80f16ed?w=800"]', stock: 10, rating: 4.9 },
  { id: 4, title: 'Everyday Linen Shirt Dress', price: 3499, category_id: 3, images: '["https://images.unsplash.com/photo-1600102427329-d5b2cde7e162?w=800"]', stock: 55, rating: 4.3 },
  { id: 5, title: 'Crepe Open Abaya', price: 5499, category_id: 4, images: '["https://images.unsplash.com/photo-1772443326202-7670b8c7e0d1?w=800"]', stock: 30, rating: 4.6 },
  { id: 6, title: 'Structured Top-Handle Bag', price: 3999, category_id: 5, images: '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]', stock: 18, rating: 4.4 },
  { id: 7, title: 'Satin Block Heels', price: 2999, category_id: 6, images: '["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800"]', stock: 33, rating: 4.2 },
  { id: 8, title: 'Charcoal Bodycon Dress', price: 2799, category_id: 1, images: '["https://images.unsplash.com/photo-1609357602746-10ade0197845?w=800"]', stock: 60, rating: 4.1 }
];

let categories = [
  { id: 1, name: 'Dresses', slug: 'dresses', image: 'https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=600' },
  { id: 2, name: 'Formal Wear', slug: 'formal-wear', image: 'https://images.unsplash.com/photo-1521467752200-3bccf80f16ed?w=600' },
  { id: 3, name: 'Casual Wear', slug: 'casual-wear', image: 'https://images.unsplash.com/photo-1600102427329-d5b2cde7e162?w=600' },
  { id: 4, name: 'Abayas & Modest Wear', slug: 'abayas-modest-wear', image: 'https://images.unsplash.com/photo-1772443326202-7670b8c7e0d1?w=600' },
  { id: 5, name: 'Bags & Accessories', slug: 'bags-accessories', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
  { id: 6, name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600' }
];

let users = [
  { id: 1, name: 'Admin', email: 'admin@aaraish.com', role: 'admin' },
  { id: 2, name: 'Zohaib Couture', email: 'seller@aaraish.com', role: 'seller' }
];

const db = {
  pragma: () => {},
  exec: () => {},
  prepare: (query) => {
    const cleanQuery = query.trim().toLowerCase();
    
    return {
      get: (...params) => {
        if (cleanQuery.includes('select count(*)')) return { c: users.length };
        if (cleanQuery.includes('from users')) return users[0];
        return null;
      },
      all: (...params) => {
        if (cleanQuery.includes('from products')) return products;
        if (cleanQuery.includes('from categories')) return categories;
        return [];
      },
      run: (...params) => {
        return { lastInsertRowid: Date.now() };
      }
    };
  }
};

module.exports = db;