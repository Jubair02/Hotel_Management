# Grand Tulip — Hotel Management & Booking System

A full-stack hotel management MVP with four roles — **Admin, Guest, Receptionist, Housekeeping** — covering the complete hotel workflow:

> Search → Book → Pay → Check-in → Stay → Housekeeping → Check-out

Built with **Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS v4 · JWT + RBAC**.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker)
docker compose up -d
#    — or without Docker: .\scripts\start-db.ps1 (portable PostgreSQL in .dev\)

# 3. Create the schema and seed demo data
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000.

### Demo accounts (all `password123`)

| Role         | Email                      | Lands on        |
| ------------ | -------------------------- | --------------- |
| Admin        | admin@grandtulip.com        | `/admin`        |
| Receptionist | reception@grandtulip.com    | `/reception`    |
| Housekeeping | housekeeping@grandtulip.com | `/housekeeping` |
| Guest        | guest@example.com           | `/dashboard`    |

## The full workflow, end to end

1. **Guest** searches availability on the home page, picks a room, books it, and pays — either through the mock online gateway (an SSLCOMMERZ-shaped flow) or "pay at hotel."
2. **Online payment** is only trusted after the gateway **IPN callback** is verified server-side (`/api/payments/:id/ipn`) — frontend "success" never confirms a booking. A booking holds at most **one pending payment** (abandoning the gateway and retrying resumes it), and once a booking has a `PAID` payment no other payment on it can be marked paid.
3. **Receptionist** sees today's arrivals, takes cash payments, and checks guests in → room becomes `OCCUPIED`. Check-in is refused before the booking's check-in date unless the receptionist explicitly uses **Early check-in**.
3b. A guest who started an online payment and left the gateway is offered **Continue to payment** on return, so the same pending record is resumed rather than a new one started.
4. **Check-out** requires a settled payment → booking `CHECKED_OUT`, room `CLEANING`, and a housekeeping task is created automatically.
5. **Housekeeping** starts the task, marks the room clean (→ `AVAILABLE`), or reports a maintenance issue (→ `MAINTENANCE`, out of the bookable pool).

## Admin pages

`/admin` dashboard · `/admin/rooms` · `/admin/bookings` · `/admin/payments` (ledger with status/method/date filters and totals) · `/admin/guests` (guest directory with stays, spend, in-house/upcoming) · `/admin/reports` (nightly occupancy, daily revenue, bookings by status, room-type demand — server-rendered SVG, with a table view) · `/admin/staff` (team list, plus `/admin/staff/new` and `/admin/staff/:id/edit` for the full account editor).

Every route segment ships a `loading.tsx` skeleton, so navigation paints immediately while the server renders.

## Double-booking prevention

The core invariant. A room is unavailable when an **active** booking (`PENDING`, `CONFIRMED`, `CHECKED_IN`) overlaps:

```
newCheckIn < existingCheckOut  AND  newCheckOut > existingCheckIn
```

Check-out day is exclusive, so back-to-back stays are allowed. Booking creation re-runs this check **inside a SERIALIZABLE transaction** (`src/app/api/bookings/route.ts`), so two concurrent requests for the same room and dates cannot both win — the loser gets a clean `409`.

## Security model

- **JWT sessions** (jose, HS256) in an `httpOnly` cookie — no tokens in localStorage.
- **Two RBAC layers**: `src/middleware.ts` gates the dashboard pages, and every API handler independently verifies the JWT + role via `requireAuth()` (`src/lib/guard.ts`). Frontend protection alone is never trusted.
- Public registration always creates `GUEST`. Staff accounts are created and fully edited from **Admin → Staff** (`/admin/staff`, backed by `/api/users`): name, sign-in email, phone, role, account status and a password reset. An admin cannot change their own role or suspend themselves, and the last active admin cannot be demoted or suspended.
- **Account status** (`UserStatus`): a `SUSPENDED` account cannot sign in (403 after a *correct* password, so the message leaks nothing) and its open sessions end at once. Accounts are never deleted — booking and housekeeping history hangs off them — so suspension is how access is withdrawn.
- Tokens are **revocable**: `requireAuth()` (API) and each signed-in section's layout (pages) re-check the token against the live row, and one whose role, email or status no longer matches — or whose account is gone — is rejected with a 401 and the cookie cleared. Changing a role or email, or suspending an account, therefore signs that person out everywhere at once. A password reset does not (there is no token version yet).
- Email addresses are stored lowercased on every write path, because sign-in looks them up lowercased.
- `?next=` after sign-in only accepts same-site paths (`safeNext()`), so a crafted login link cannot redirect off-site.
- List endpoints validate their query strings (`?status=`, `?type=`, `?date=`) with the same zod schemas as request bodies — an unknown value is a 400, not a 500.
- Passwords hashed with bcrypt; minimum 8 characters.
- **Sign-in throttling** (`src/lib/rate-limit.ts`): 5 failed attempts per account or 30 per IP in 15 minutes returns `429` with `Retry-After`; registration is capped at 10 per IP per hour. The limiter is in-process — swap the Map for Redis when running more than one instance.
- **Room status is workflow-owned.** Hand-editing a room to a status that contradicts the record (AVAILABLE while a guest is checked in, OCCUPIED with nobody in house, AVAILABLE with an open housekeeping task) is refused with a 409; the edit form explains the lock up front.

## API surface

```
POST  /api/auth/register | login | logout      GET /api/auth/me
GET   /api/rooms                               GET /api/rooms/available?checkIn&checkOut&guests
GET|PATCH|DELETE /api/rooms/:id                POST /api/rooms            (admin)
POST|GET /api/bookings                         GET|PATCH /api/bookings/:id
POST  /api/bookings/:id/cancel | check-in | check-out | pay
POST  /api/payments/:id/ipn                    POST /api/payments/:id/mark-paid
GET|POST /api/users                            GET|PATCH /api/users/:id   (admin)
GET   /api/housekeeping/tasks                  PATCH /api/housekeeping/tasks/:id
POST  /api/housekeeping/tasks/:id/complete
```

## Architecture notes

- **Reads** happen directly in React Server Components via Prisma (no self-fetch waterfall); **writes** all go through the REST API from small client components, so the API is the single mutation path and can be consumed by other clients.
- `Decimal` money columns; dates handled as UTC date-only values to avoid timezone drift.
- Room deletion is blocked once a room has booking history — use `MAINTENANCE` status instead.
- The payment `MOCK` provider stands in for SSLCOMMERZ/bKash; the IPN handler is where a real gateway's validation API call would go.

## Scripts

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server                            |
| `npm run build`     | Production build                      |
| `npm run db:push`   | Sync Prisma schema to the database    |
| `npm run db:seed`   | Seed demo users + 8 rooms             |
| `npm run db:studio` | Browse the database in Prisma Studio  |

## Deploying

- **Database:** Neon (or any PostgreSQL) — set `DATABASE_URL`.
- **App:** Vercel — set `DATABASE_URL` and a strong `AUTH_SECRET`.

## Not in the MVP (deliberate)

Real SSLCOMMERZ/bKash credentials, e-mail notifications, image uploads (rooms take image URLs; swap in Cloudinary), reviews, coupons, multi-branch support, invoice PDFs.
