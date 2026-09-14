# Salon CRM — Full-Stack Technical Assessment

Multi-tenant Salon CRM with role-based access control, subscription gating, appointment
conflict logic, and geo-fenced staff check-in.

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Web:** React (Vite)
- **Mobile:** React Native (Expo)

---

## 1. Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a Mongo URI)

### Backend
```bash
cd backend
cp .env.example .env     # then set MONGO_URI + JWT_SECRET
npm install
npm run seed             # populates plans, salon, users, services, staff, clients
npm run dev              # http://localhost:5000
```

### Web
```bash
cd web
npm install
npm run dev              # http://localhost:5173
```

### Mobile
```bash
cd mobile
npm install
# ⚠️ Edit mobile/src/api.js → BASE to your LAN IP (e.g. http://192.168.1.10:5000)
npx expo start
```

### Seed credentials
| Role        | Email                     | Password  |
|-------------|---------------------------|-----------|
| Super Admin | admin@salon.test          | admin123  |
| Salon Owner | owner@salon.test          | owner123  |
| Receptionist| reception@salon.test      | recep123  |

Seed salon geo-location: `28.6139, 77.2090`, radius `150m`.

---

## 2. Architecture

### Request pipeline (backend)
```
Client → requireAuth (JWT)
      → requireSalonScope (salon-scoped roles must have salonId)
      → requireRole(...) (RBAC)
      → requireActiveSubscription (403 SUBSCRIPTION_EXPIRED if inactive)
      → route handler (uses req.user.salonId — never client-provided)
```

Every middleware step is a hard gate. **Hiding a button in the frontend does nothing**;
any direct API call still hits these gates.

### RBAC matrix

| Action                         | SUPER_ADMIN | SALON_OWNER | RECEPTIONIST |
|--------------------------------|:-----------:|:-----------:|:------------:|
| Create / list plans            | ✅          | ❌          | ❌           |
| View salons, assign sub        | ✅          | ❌          | ❌           |
| View subscription history      | ✅          | ❌ (own via `/salons/me/subscription`) | ❌ |
| View own subscription          | –           | ✅          | ❌           |
| Appointments (list/create)     | –           | ✅          | ✅           |
| Clients (list/create)          | –           | ✅          | ✅           |
| Attendance check-in            | –           | ✅          | ✅           |

Attempts outside the role return `403 { error: "FORBIDDEN" }`.

---

## 3. Tenant Isolation

Salon-scoped users carry `salonId` on their JWT-verified record. **All** salon-scoped
queries filter by `req.user.salonId`. The client cannot supply a `salonId` to override
scope — if they try, it's ignored (query builds use only `req.user.salonId`).

Example (appointment creation):
```js
const salonId = req.user.salonId;
const [client, staff, service] = await Promise.all([
  Client.findOne({ _id: clientId, salonId }),
  Staff.findOne({ _id: staffId, salonId }),
  Service.findOne({ _id: serviceId, salonId }),
]);
```
A Receptionist from Salon A passing an ID from Salon B receives `400 Invalid <entity>`.

---

## 4. Subscription Gating

- Applied to **all salon-scoped endpoints** (`/appointments`, `/clients`, `/services`, `/attendance`).
- Skipped for `SUPER_ADMIN` (they administer subscriptions, they aren't bound by one).
- On any salon-scoped request, `requireActiveSubscription` checks:
  - `subscriptionStatus === 'ACTIVE'`
  - `subscriptionEndDate > now`
- If expired, it **also self-heals** the salon's status to `EXPIRED` before responding.

Response:
```json
{
  "error": "SUBSCRIPTION_EXPIRED",
  "message": "Your subscription has expired. Please contact the administrator to renew your plan."
}
```

On assign/renew/upgrade, the middleware on the Super Admin route writes a
`SubscriptionHistory` record with `action: ASSIGN | RENEW | UPGRADE`.

**Renewal semantics:** if the current end date is still in the future, `RENEW`
extends from the existing end date (stacking). If expired, it starts from `now`.
`ASSIGN` and `UPGRADE` always start from `now`.

---

## 5. Appointment Conflict Logic

Validated server-side, in order:

1. **Input sanity** — required fields, `HH:mm` format.
2. **Tenant-scoped entity lookups** — client/staff/service must belong to the salon.
3. **Working hours** — appointment `[start, end)` must fit within salon's
   `[opening, closing)` (default `09:00`–`20:00`). `endTime` is computed from the
   service's `durationMinutes` — the client cannot supply a forged `endTime`.
4. **Staff conflict** — same `(salonId, staffId, date)` for status ≠ `CANCELLED`;
   reject any overlap where `aStart < bEnd && bStart < aEnd` (touching endpoints are OK).

Cancelled appointments are excluded from the conflict check — a cancelled slot is
immediately re-bookable.

**Worked example (from the brief):**
```
Existing: 10:00–11:00 (CONFIRMED, same staff, same day)
New:      10:30–11:30
→ 409 { error: "STAFF_CONFLICT" }
```

---

## 6. Geo-Fencing (Check-In)

- Salon stores `latitude`, `longitude`, `allowedRadius` (meters).
- `POST /attendance/check-in` requires `{ latitude, longitude }`.
- **Distance is computed on the server** using the Haversine formula. The frontend
  cannot send an "inside/outside" flag — only raw coordinates.
- Missing / non-numeric / out-of-range coordinates → `400`
  (`LOCATION_REQUIRED` or `INVALID_COORDINATES`), never a crash.
- Distance > `allowedRadius` → `403 { error: "OUT_OF_RANGE", distanceMeters, allowedRadius }`.
- Success → attendance record with `checkedInAt` + `distanceMeters`.

`GET /attendance/today` returns `{ checkedIn, record }` for the current staff member
(matched by `staffId`, falling back to `userId`).

---

## 7. Data Model (justifications)

| Model | Purpose | Notes |
|---|---|---|
| `User` | Auth + role | `salonId` null for `SUPER_ADMIN`. `staffId` links a user to a `Staff` row for attendance scoping. |
| `Salon` | Tenant | **Holds `latitude`, `longitude`, `allowedRadius` directly** — single-branch MVP, avoids a `Branch` collection with one row per salon. |
| `Plan` | Super-Admin-managed plans | `name`, `price`, `durationInDays`, `maxStaff`, `maxAppointments`. |
| `SubscriptionHistory` | Audit trail | One row per assign/renew/upgrade. |
| `Client` | Per-salon customers | Indexed on `(salonId, email)`. |
| `Staff` | Bookable staff | |
| `Service` | Bookable services | Duration drives `endTime`. |
| `Appointment` | Bookings | Composite index on `(salonId, staffId, date, status)` for conflict lookup. |
| `Attendance` | Check-in records | `day` is a `YYYY-MM-DD` string for cheap "today" queries. |

**Time representation:** times are `HH:mm` strings, dates are `YYYY-MM-DD` strings.
Chosen because salons operate in a single local timezone and this avoids
`Date`-timezone pitfalls on overlapping-day checks. If multi-timezone support were
needed, we would migrate to UTC `Date` + a per-salon timezone field.

---

## 8. Web Panel Screens

| Screen | Roles | Purpose |
|---|---|---|
| Login | all | Email + password |
| Dashboard | Owner/Receptionist | Today's appointment count, attendance status, subscription (owner) |
| Appointments | Owner/Receptionist | List + create (server validates conflicts) |
| Clients | Owner/Receptionist | List + create |
| Subscription | Owner only | Current plan + history |
| Plans | Super Admin | Create / list |
| Salons | Super Admin | List, assign/renew/upgrade subscriptions |
| Subscription History | Super Admin | Global audit trail |

Hidden routes are also wrapped in `ProtectedRoute` — but the **backend** is the
real gate.

---

## 9. Mobile App (Expo)

| Screen | Purpose |
|---|---|
| Login | Email + password, persists JWT in AsyncStorage |
| Dashboard | Today's appointment count, subscription status (owner), attendance status |
| Check-In | Single button → grabs device location via `expo-location` → `POST /attendance/check-in` |
| Today's Appointments | Read-only list |

**Important:** update `mobile/src/api.js` `BASE` to your machine's LAN IP so the
device can reach the backend.

---

## 10. Assumptions

1. **Single branch per salon** — geo-fence lives on `Salon`. Adding `Branch` later is
   a schema extension, not a rewrite.
2. **Salon-local timezone** — times are strings; no cross-timezone math in scope.
3. **JWTs carry role + salonId in the token, but we still re-load the user from DB
   on each request.** This guarantees a revoked/deleted user is instantly locked out
   at the cost of one extra read.
4. **`maxStaff` / `maxAppointments` on `Plan` are stored but not enforced as hard
   limits in this slice.** Enforcement is a natural next step (a `POST /appointments`
   pre-check + a count query). Documented here for honesty rather than silently
   pretending.
5. **No staff endpoint in the required list** — the web appointment form takes a raw
   Staff ID. Adding `GET /staff` scoped by salon would be ~5 lines.
6. **Attendance is per day** — one record per staff per day, but repeats aren't
   blocked (multiple check-ins allowed for audit purposes).
7. **Subscription self-heal** — reading a salon whose end date has passed flips
   status to `EXPIRED`; we don't run a background job in this slice.

---

## 11. API Summary

### Auth
- `POST /auth/login` → `{ token, user }`
- `GET  /auth/me`

### Plans (SUPER_ADMIN only)
- `POST /plans`
- `GET  /plans`

### Salons / Subscriptions
- `GET  /salons` — SUPER_ADMIN
- `POST /salons/:salonId/subscription` `{ planId, action }` — SUPER_ADMIN
- `GET  /salons/subscription-history` — SUPER_ADMIN
- `GET  /salons/me/subscription` — SALON_OWNER

### Appointments (OWNER + RECEPTIONIST, active sub required)
- `GET  /appointments?date=YYYY-MM-DD`
- `GET  /appointments/today/count`
- `POST /appointments`
- `PATCH /appointments/:id/status`

### Clients (OWNER + RECEPTIONIST, active sub required)
- `GET  /clients`
- `POST /clients`

### Services (OWNER + RECEPTIONIST, active sub required)
- `GET  /services`

### Attendance (OWNER + RECEPTIONIST, active sub required)
- `GET  /attendance/today`
- `POST /attendance/check-in` `{ latitude, longitude }`

---

## 12. What I'd build next

- Hard-enforce `maxStaff` / `maxAppointments` from the plan on create operations.
- `GET /staff` + `POST /staff` scoped endpoints.
- A `SUBSCRIPTION_EXPIRED` → `/subscription/renew` deep-link in the web panel.
- Background job (or Mongo TTL-style) to flip `EXPIRED` proactively rather than
  lazily on read.
- Test suite (Jest + supertest) covering each RBAC and conflict scenario — these
  are the highest-value automated tests for this codebase.
