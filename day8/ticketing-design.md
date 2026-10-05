# TicketHub — Design Document

A design for **TicketHub**, a website that sells tickets for concerts and events.

---

## 1. Requirements

### Functional

- Users can browse events and view available seats.
- Users can hold a seat for a short time (e.g. 5 minutes) while they pay.
- Users can pay for their held seats and receive a ticket.
- Users can view their existing tickets.
- Only one person can own any given seat for a given event.

### Non-Functional

- **Speed:** seat selection and payment must feel instant (under 300 ms).
- **Correctness:** no seat may ever be sold twice.
- **Fairness:** no one should be able to buy thousands of tickets with a script.
- **Availability:** the site must not go down during a big sale.
- **Durability:** confirmed purchases must never be lost.

---

## 2. Estimates

### Normal day

- 50,000 visitors × 10 pages = **500,000 page views/day**
- 500,000 ÷ 86,400 ≈ **~6 page views/sec**
- 5,000 tickets ÷ 86,400 ≈ **~0.06 tickets/sec** (negligible)

Normal traffic is tiny. A single small server and one database could handle it.

### Big sale day

- 200,000 people trying to buy 20,000 seats in **10 minutes = 600 seconds**
- Page views: 200,000 × ~5 pages = 1,000,000 ÷ 600 ≈ **~1,667 page views/sec**
- Purchase attempts: up to 200,000 ÷ 600 ≈ **~333 attempts/sec**

### Comparison

| Metric | Normal | Big Sale Peak | Multiplier |
|--------|--------|---------------|-----------|
| Page views/sec | ~6 | ~1,667 | **~278×** |
| Purchase attempts/sec | ~0.06 | ~333 | **~5,550×** |

**Conclusion:** the peak is ~278× normal reads and ~5,550× normal writes. The design must be built for the peak, not the average.

---

## 3. API Design

**Base URL:** `https://api.tickethub.app/v1`

### 1. List events

- **Method:** GET
- **Path:** `/events`
- **Description:** Returns all upcoming events.
- **Success:** `200 OK`

### 2. Get event details with seats

- **Method:** GET
- **Path:** `/events/{id}/seats`
- **Description:** Returns the event and its seats with their current status (available / held / sold).
- **Success:** `200 OK`

### 3. Hold a seat

- **Method:** POST
- **Path:** `/seats/{id}/hold`
- **Description:** Places a 5-minute hold on a seat for the current user. Fails if the seat is already held or sold.
- **Request body:** *(none — seat id is in the path)*
- **Success:** `201 Created`
- **Errors:** `409 Conflict` if already held/sold

### 4. Pay for held seats

- **Method:** POST
- **Path:** `/orders`
- **Description:** Creates an order and marks held seats as sold.
- **Request body:**
  ```json
  {
    "seatIds": [101, 102],
    "paymentToken": "tok_visa_4242"
  }

  - **Success:** `201 Created`
- **Errors:** `409 Conflict` if any seat was lost during payment; `400` if the payment token is invalid.

### 5. View my tickets

- **Method:** GET
- **Path:** `/me/tickets`
- **Description:** Returns the current user's confirmed tickets.
- **Success:** `200 OK`

---

## 4. Data Model

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| email | TEXT | Unique, not null |
| name | TEXT | Not null |
| created_at | TEXT | ISO timestamp |

### `events`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| name | TEXT | Not null |
| venue | TEXT | Not null |
| starts_at | TEXT | ISO timestamp |

### `seats`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| event_id | INTEGER | Foreign key → events.id |
| row_label | TEXT | Not null |
| seat_number | INTEGER | Not null |
| status | TEXT | One of `available`, `held`, `sold` |
| held_by | INTEGER | Foreign key → users.id (null unless held) |
| held_until | TEXT | ISO timestamp (null unless held) |
| **UNIQUE** | (event_id, row_label, seat_number) | Prevents duplicate seat rows |

### `orders`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key → users.id |
| seat_id | INTEGER | Foreign key → seats.id |
| paid_at | TEXT | ISO timestamp |
| **UNIQUE** | (seat_id) | **This is the key constraint that prevents double-selling a seat** |

### Relationships

- **users → orders:** one-to-many.
- **events → seats:** one-to-many.
- **seats → orders:** one-to-one (each seat can appear in at most one order).

---

## 5. Preventing Double-Booking

Double-booking is prevented with **three layers**:

1. **Row-level lock during hold** — `SELECT ... FOR UPDATE` on the seat row. Only one transaction can hold the lock, so two users cannot hold the same seat at the same moment.
2. **Status check** — the hold only succeeds if `status = 'available'`. If it's already `held` or `sold`, the API returns `409 Conflict`.
3. **`UNIQUE(seat_id)` on `orders`** — the final defence. Even if two transactions somehow race past the first two checks, only one `INSERT` into `orders` can succeed. The database itself enforces this.

The whole purchase happens inside a **single transaction**: hold seats, charge payment, insert into `orders`, update seats to `sold`. If anything fails, the transaction rolls back and no seat is lost.

---

## 6. Architecture
[ Clients (millions of users) ]
│
▼
[ CDN / Static pages ]
│
▼
[ Load Balancer ]
│
┌───────┼───────┐
▼       ▼       ▼
[ App 1 ][ App 2 ][ App 3 ]   (auto-scaling)
│       │       │
└───────┼───────┘
▼
[ Cache ] (seat map, event list)
│
▼
[ Primary DB ] ──► [ Read Replica ]
│
▼
[ Queue ] ──► [ Worker ] (emails, tickets)

```

- **CDN** — serves static assets and event pages, so the app servers aren't hit for every image or CSS file.
- **Load balancer** — spreads traffic across many app servers.
- **App servers (auto-scaling)** — stateless, so we can spin up more during the sale and shut them down after.
- **Cache** — stores the seat map and event list; most reads never reach the database.
- **Primary database** — handles all writes (holds, orders, updates). All consistency-critical work happens here.
- **Read replica** — serves read-only queries to offload the primary.
- **Queue + worker** — sends confirmation emails and generates ticket PDFs asynchronously, so the user's request returns immediately.

### Surviving the big sale

- The **hold step** is the bottleneck, and it's protected by row-level locks.
- Because locks are held only for milliseconds, hundreds of holds per second are fine.
- Only **20,000 of the 200,000 attempts** will succeed, and the rest receive a clean `409 Conflict` — the system stays up.
- **Auto-scaling** adds app servers as load rises.
- **Cache** absorbs the read storm from 200,000 people refreshing the seat map.

---

## 7. Trade-offs

**Trade-off 1: Speed vs fairness**
- Chose to **not use a queue** for purchase attempts. A queue would be perfectly fair (first-come-first-served), but it would add several seconds of latency per user. Instead, purchases race and the database decides the winner. Fast, but a lucky user with better latency wins.

**Trade-off 2: Strong consistency vs high availability**
- Chose **strong consistency** on the seat purchase path. This means during the big sale we might see a few 503s if the primary database is overloaded, but we never oversell. Correctness beats availability for money-changing operations.

**Trade-off 3: Row locks vs optimistic concurrency**
- Chose **row-level locks** (`SELECT ... FOR UPDATE`) instead of optimistic concurrency. Locks are simpler to reason about and give us a clear "held for 5 minutes" story, but they serialize access to individual seats. That's fine because each seat is only contended by a few users.
