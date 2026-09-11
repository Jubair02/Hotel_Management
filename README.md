# Grand Tulip — Hotel Management System

A hotel booking and management web app for a small boutique hotel. Guests
search for a room, book it and pay online. Staff run the desk from the same
system: arrivals, check-in, housekeeping and check-out.

> Search → Book → Pay → Check-in → Stay → Housekeeping → Check-out

## What it does

**Guests** browse rooms, check availability for their dates, book a stay and
pay through an online gateway or at the front desk. They can see their
bookings, cancel one, and manage their profile.

**Reception** sees today's arrivals and departures, takes cash payments,
checks guests in and out, and searches bookings by guest name.

**Housekeeping** gets a task for every room that needs turning over, marks
rooms clean to return them to the bookable pool, or reports a maintenance
issue.

**Admin** manages rooms, bookings, the payments ledger, the guest directory,
staff accounts, and a reports page with occupancy and revenue charts.

## Built with

Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS v4

Sessions are JWTs in an httpOnly cookie, and every API route checks the
caller's role before it does anything.

## Getting started

```bash
# 1. Install
npm install

# 2. Set up environment variables
cp .env.example .env        # then fill in DATABASE_URL and AUTH_SECRET

# 3. Start PostgreSQL
docker compose up -d        # or use any PostgreSQL instance

# 4. Create the tables and add demo data
npm run db:push
npm run db:seed

# 5. Run it
npm run dev
```

Open http://localhost:3000.

## Demo accounts

All demo accounts use the password `password123`.

| Role         | Email                       | Lands on        |
| ------------ | --------------------------- | --------------- |
| Admin        | admin@grandtulip.com        | `/admin`        |
| Receptionist | reception@grandtulip.com    | `/reception`    |
| Housekeeping | housekeeping@grandtulip.com | `/housekeeping` |
| Guest        | guest@example.com           | `/dashboard`    |

## Scripts

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the development server         |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run db:push`   | Apply the Prisma schema to the database |
| `npm run db:seed`   | Add demo accounts and rooms          |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Deploying

Runs on Vercel with any hosted PostgreSQL database, such as Neon. Set
`DATABASE_URL` and a strong `AUTH_SECRET` in the project's environment
variables, then deploy.

## Notes

Payments run through a mock gateway that mirrors the SSLCOMMERZ flow, so no
real transaction takes place. Room photos are added as image URLs rather than
uploads.

---

Built by [Jubair Hossain](https://jhossain.vercel.app/).
