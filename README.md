# GearUp — Rent Sports & Outdoor Gear Instantly

Backend API for **GearUp**, a peer-to-peer rental marketplace for sports and outdoor gear.
Built with **TypeScript, Express, PostgreSQL (Prisma ORM), JWT auth, and Stripe** payments.

---

## 1. Tech Stack

- Node.js + Express 5 + TypeScript (strict mode)
- PostgreSQL + Prisma ORM
- JWT-based authentication (access + refresh tokens) with bcrypt password hashing
- Zod request validation
- Stripe Checkout for payments (session-based, plus webhook support)
- Centralized, structured error handling (no unhandled crashes; consistent JSON error shape)
- Modular "feature folder" architecture (routes / controller / service / validation per module)

---

## 2. Project Structure

```
src/
  app.ts                # express app, middlewares, route mounting
  server.ts              # entry point, DB connect + listen
  config/env.ts           # centralized env var access
  lib/prisma.ts            # Prisma client singleton
  lib/stripe.ts            # Stripe client singleton
  middlewares/            # auth, validate, errorHandler, notFound
  utils/                  # ApiError, catchAsync, sendResponse, jwt helpers
  modules/
    auth/                 # register, login, me
    category/              # category CRUD (admin write, public read)
    gear/                  # public gear browsing/search
    provider/               # provider's own gear inventory + order management
    rental/                 # rental order placement + status state machine
    payment/                # Stripe checkout session, confirm, history
    review/                 # post-rental reviews
    admin/                  # user/gear/rental oversight
  routes/index.ts           # aggregates all module routes under /api
prisma/
  schema.prisma             # data model
  seed.ts                    # creates admin + sample provider/customer/gear
postman/
  GearUp.postman_collection.json
```

---

## 3. Step-by-Step: Get It Running

### Step 1 — Get a PostgreSQL database
Easiest options (all have free tiers): [Neon](https://neon.tech), [Supabase](https://supabase.com), or a local Postgres install. Copy the connection string — it looks like:
```
postgresql://USER:PASSWORD@HOST:5432/gearup_db?schema=public
```

### Step 2 — Install dependencies
```bash
cd gearup-backend
npm install
```
This also triggers `prisma generate` automatically via `postinstall`.

### Step 3 — Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env` and fill in:
- `DATABASE_URL` — your Postgres connection string from Step 1
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `STRIPE_SECRET_KEY` — from your [Stripe dashboard](https://dashboard.stripe.com/test/apikeys) (test mode key starting with `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` — only needed if you wire up a real webhook (optional; `/api/payments/confirm` works without it)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials the seed script will create for you

### Step 4 — Push the schema to your database
```bash
npx prisma migrate dev --name init
```
This creates all tables (`users`, `categories`, `gear_items`, `rental_orders`, `rental_items`, `payments`, `reviews`).

### Step 5 — Seed the database
```bash
npm run seed
```
This creates:
- An **Admin** account using the credentials in your `.env`
- A sample **Provider** (`provider@gearup.com` / `Provider123!`)
- A sample **Customer** (`customer@gearup.com` / `Customer123!`)
- 5 categories and 2 sample gear items

### Step 6 — Run the server
```bash
npm run dev
```
Server boots at `http://localhost:5000`. Visit `http://localhost:5000/` — you should see a JSON welcome message.

### Step 7 — Import the Postman collection
Import `postman/GearUp.postman_collection.json` into Postman. It's pre-wired with `{{baseUrl}}` and token variables — after logging in, paste the returned `accessToken` into the relevant collection variable (`adminToken`, `providerToken`, `customerToken`).

### Step 8 — (Optional) Test Stripe payments end-to-end
1. Call `POST /api/payments/create` with a `rentalOrderId` you own → returns a `checkoutUrl`.
2. Open that URL in a browser, pay with Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. You'll be redirected to `/api/payments/success?session_id=...`. Copy the `session_id`.
4. Call `POST /api/payments/confirm` with that `sessionId` in the body — this marks the payment `COMPLETED` and the rental order `PAID`.

### Step 9 — Build for production
```bash
npm run build
npm start
```

---

## 4. Roles & Permissions

| Role | Can do |
|---|---|
| **CUSTOMER** | Register/login, browse gear, place rental orders, pay, view own orders/payments, cancel own PLACED orders, leave reviews after a RETURNED rental |
| **PROVIDER** | Everything a customer can browse, plus manage their own gear inventory (add/update/remove), view incoming orders for their gear, and update order status (confirm → picked up → returned, or cancel) |
| **ADMIN** | View/suspend/activate any user, manage categories, view all gear and all rental orders across the platform |

## 5. Rental Order Status State Machine

```
PLACED → CONFIRMED → PAID → PICKED_UP → RETURNED
   ↓          ↓
CANCELLED  CANCELLED
```
- `PLACED`: customer just created the order (gear is soft-reserved)
- `CONFIRMED` / `CANCELLED`: provider accepts or rejects
- `PAID`: set automatically once Stripe payment is confirmed
- `PICKED_UP`: provider marks the gear as handed over
- `RETURNED`: provider marks the gear as returned (frees up inventory, unlocks reviews)

Invalid transitions are rejected with a `400` and a message listing the allowed next statuses.

## 6. Key API Endpoints

All routes are prefixed with `/api`.

**Auth** — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
**Categories** — `GET /categories`, `GET /categories/:id`, `POST/PUT/DELETE /categories(/:id)` (admin)
**Gear (public)** — `GET /gear?search=&category=&brand=&minPrice=&maxPrice=&available=&page=&limit=`, `GET /gear/:id`
**Provider** — `POST/GET/PUT/DELETE /provider/gear(/:id)`, `GET /provider/orders`, `PATCH /provider/orders/:id`
**Rentals** — `POST /rentals`, `GET /rentals`, `GET /rentals/:id`, `PATCH /rentals/:id/cancel`
**Payments** — `POST /payments/create`, `POST /payments/confirm`, `GET /payments`, `GET /payments/:id`, webhook at `POST /payments/webhook`
**Reviews** — `POST /reviews`
**Admin** — `GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/gear`, `GET /admin/rentals`

Every authenticated route expects `Authorization: Bearer <accessToken>`.

## 7. Response Shape

Success:
```json
{ "success": true, "message": "...", "meta": { "page": 1, "limit": 10, "total": 42 }, "data": { } }
```
Error:
```json
{ "success": false, "message": "...", "errorDetails": [ { "field": "email", "message": "Invalid email address" } ] }
```

## 8. Note on this repository's git history
This repo was built with granular, meaningful commits (schema → utils → middlewares → each module → wiring → seed → fixes) so the commit log itself documents the build process — check `git log --oneline`.

## 9. Deploying
Any Node host works (Render, Railway, Fly.io, VPS). Set the same env vars as `.env.example`, run `npm run build && npm run prisma:deploy && npm run seed && npm start` (or wire deploy/seed into your CI).
