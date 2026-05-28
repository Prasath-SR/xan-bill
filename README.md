# Xan Bill

Responsive single-restaurant billing platform built with Next.js, Tailwind CSS, and a MySQL-ready Prisma schema.

## Included modules

- Dashboard with daily sales, order, staffing, inventory, and kitchen snapshots
- Billing / POS with dine-in, takeaway, parcel, discount, tax, and split payment UI
- Kitchen Order Ticket board for prep tracking
- Menu and item management overview
- Inventory and supplier tracking overview
- Staff attendance and role access view
- Table occupancy and reservation view
- Reports and analytics summary

## Tech choices

- Next.js App Router
- React 19
- Tailwind CSS 4
- Prisma schema targeting MySQL

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL`
3. Run:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## Local MySQL

This project now reads its page data from MySQL on the server side. The default local connection is configured for `xan_bill` in `.env.example`, and the seed command populates real database tables used by the app.
