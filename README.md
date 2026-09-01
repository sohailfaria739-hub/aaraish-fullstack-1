# Aaraish — Fashion Marketplace

A full-stack multi-vendor marketplace for dresses and fashion (buyers browse & buy, sellers list & fulfill orders).

## Stack
- **Backend:** Node.js, Express, SQLite (`better-sqlite3`), JWT auth, bcrypt
- **Frontend:** React 18 (Vite), React Router, Tailwind CSS, Axios, lucide-react icons

## Features
- Buyer accounts: browse/search/filter/sort products, product detail with sizes/colors/reviews, cart, coupon codes at checkout, checkout (COD or card-demo), order history with a per-item status timeline, wishlist, recently-viewed rail, public boutique pages per seller
- Seller accounts: dashboard with revenue/orders/low-stock stats, full product CRUD (create/edit/delete listings, multiple images, sizes, colors, stock), per-item order fulfillment status
- Coupon engine: percent or flat-amount codes with an optional minimum order value
- JWT-based auth with buyer/seller/admin roles, protected routes on both frontend and backend
- Seeded demo data: 6 categories, 17 products (dresses, formal wear, casual wear, modest wear, bags & accessories, footwear) across 2 demo shops, 3 coupon codes, 4 demo accounts

## Getting started

### 1. Backend
```bash
cd backend
npm install
npm start        # runs on http://localhost:4000, auto-creates & seeds aaraish.db on first run
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev       # runs on http://localhost:5173
```
The frontend reads the API URL from `frontend/.env` (`VITE_API_URL`, defaults to `http://localhost:4000/api`).

### Demo accounts
| Role   | Email                | Password   |
|--------|-----------------------|-----------|
| Buyer  | buyer@aaraish.com     | buyer123  |
| Seller | seller@aaraish.com    | seller123 |
| Seller | threads@aaraish.com   | seller123 |
| Admin  | admin@aaraish.com     | admin123  |

### Demo coupon codes
| Code       | Discount                          |
|------------|------------------------------------|
| WELCOME10  | 10% off, no minimum                |
| FLAT500    | Rs 500 off orders over Rs 3,000    |
| EID15      | 15% off orders over Rs 5,000       |

## Project structure
```
backend/
  server.js          Express app entry
  db.js              SQLite schema + seed data
  middleware/auth.js JWT auth + role guards
  routes/            auth, products, cart, orders, wishlist, seller, sellers, coupons
frontend/
  src/pages/         Home, Shop, ProductDetail, Cart, Checkout, Login, Register, Orders, Wishlist, SellerDashboard, Boutique
  src/context/        AuthContext, CartContext
  src/components/     Navbar, Footer, ProductCard, StarRating, ProtectedRoute
  src/utils/          recentlyViewed (localStorage helper)
```

## Notes for going to production
- Swap the SQLite file for Postgres/MySQL if you expect concurrent write-heavy traffic
- Add real payment gateway integration (Stripe/JazzCash/Easypaisa) in place of the COD/card-demo flow
- Add image upload (S3/Cloudinary) instead of pasting image URLs in the seller dashboard
- Set a strong `JWT_SECRET` in `backend/.env` and put the API behind HTTPS
