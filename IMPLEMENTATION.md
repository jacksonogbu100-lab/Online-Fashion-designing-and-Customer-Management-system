# Sunnex Clothing — Implementation Plan

Working name: **Sunnex Clothing**  
Full name: Online Fashion Designing and Customer Management System

This document is the product and delivery plan. Agents must read it with `AGENTS.md` before any implementation. Build **one phase at a time**. When a phase is done, update **Current phase** below so the next session continues from the right place.

---

## Current phase

| Field | Value |
| --- | --- |
| Status | Phase 9 complete |
| Active phase | **Phase 10 — Hardening and launch readiness** |
| Last completed | Phase 9 — Dashboards, client portal polish, and notifications |
| Next up | Authorization review, seed/demo pass, operator checklist |

Do not start work outside Phase 10 until its acceptance criteria are checked off.

---

## 1. What we are building

This build is a **case study of Sunnex Clothing**, a Mumbai denim and casualwear house. It is an **in-house** designing and client-management system for that brand — not a public shop, marketplace, or generic e-commerce store.

The core job is:

1. Know the **client** (profile, preferences, history).
2. Capture **fit** (measurement profiles over time).
3. Create and store **designs** (sketches, palettes, notes, collections).
4. Turn those into **orders** with a clear production pipeline.
5. Schedule **fittings and consultations**.
6. Track **materials**, then **quotes and invoices**.
7. Give staff a **dashboard** and give clients a **portal**.

The first complete product is an **in-house system**: designers and staff work daily in it; clients log in only to see what has been shared with them.

### Why Next.js (not a split React + API)

The application should stay **in one box**:

- **Next.js App Router** for UI, server logic, and auth
- **PostgreSQL** for all business data
- **Prisma** as the schema and query layer
- **Auth.js** for sessions and roles
- **Tailwind CSS + shadcn/ui** for a calm, editorial studio UI

A separate Express/Nest API or a second SPA would split the team’s attention and is out of scope unless this plan is revised.

---

## 2. Who uses it

| Role | Who | Primary jobs |
| --- | --- | --- |
| Admin | Owner / studio manager | Users, roles, studio settings, full records |
| Designer | Creative lead | Clients, designs, collections, order specs |
| Staff | Tailor, assistant, receptionist | Clients, measurements, orders, fittings, billing |
| Client | Customer of the house | Own profile, shared designs, order status, appointments, sent invoices |

Early phases may log in as seeded users. Real invite/onboarding comes in Phase 1.

---

## 3. Agreed stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js (App Router) | React, TypeScript, one deployable app |
| UI | Tailwind CSS + shadcn/ui | Accessible, consistent studio look |
| Database | PostgreSQL | Source of truth |
| ORM | Prisma | Schema in `prisma/schema.prisma` |
| Auth | Auth.js (NextAuth v5) | Credentials first; OAuth optional later |
| Validation | Zod | All mutations at the boundary |
| Files | Local disk in Phase 4; object storage later | Sketches, mood images, invoices |
| Hosting (later) | One Node host + managed Postgres | Not decided in Phase 0 |

Do not change this table without an explicit decision recorded here.

---

## 4. Application map (what will exist when all phases are done)

```
/                       Case study landing (Sunnex Clothing + login)
/login                  Sign in
/app                    Staff home (role dashboard)
/app/notifications      Staff in-app alerts
/app/clients            Client directory and profiles
/app/clients/[id]       Profile, notes, measurements, orders
/app/designs            Design library
/app/designs/[id]       Design workspace
/app/collections        Seasonal or thematic groupings
/app/orders             Production pipeline
/app/orders/[id]        Order detail and timeline
/app/calendar           Fittings and consultations
/app/materials          Fabrics, trims, stock
/app/billing            Quotes and invoices
/app/settings           Studio and user admin
/portal                 Client home
/portal/notifications   Client in-app alerts
/portal/orders          Client order status
/portal/appointments    Client fittings
/portal/billing         Sent invoices
/portal/designs         Designs shared with the client
```

Route names can shift slightly during Phase 0 scaffolding; the **domains** should not.

---

## 5. Domain language

Use these words in code, UI, and docs:

| Term | Meaning |
| --- | --- |
| Client | A customer of the house (not an OAuth “client”) |
| User | A login account (`admin`, `designer`, `staff`, or `client`) |
| Measurement profile | A dated set of body measurements for a client |
| Design | A fashion piece or concept (sketch, notes, palette, status) |
| Collection | A named group of designs |
| Order | A job that produces a garment for a client |
| Fitting | An appointment tied to a client and usually an order |
| Material | Fabric or trim that can be linked to a design or order |

---

## 6. How phases fit together

Each phase ships a **runnable slice**. Later phases attach to earlier ones; they do not replace them.

```
Phase 0  Foundation (app shell, db, tooling)
    └─ Phase 1  Identity and roles
         └─ Phase 2  Client CRM
              ├─ Phase 3  Measurement profiles
              ├─ Phase 4  Design studio
              │     └─ Phase 5  Orders and production
              │           ├─ Phase 6  Fittings calendar
              │           ├─ Phase 7  Materials
              │           └─ Phase 8  Billing
              └─ Phase 9  Dashboards, portal polish, notifications
                   └─ Phase 10 Hardening and launch readiness
```

Phases 3 and 4 can be slightly parallel in *planning*, but **implementation order is 3 then 4** so orders in Phase 5 can attach to both a client’s fit and a design.

---

## 7. Phases

### Phase 0 — Foundation

**Goal.** A professional Next.js project that runs locally, talks to Postgres, and has an empty authenticated shell.

**Why now.** Every later feature needs the same app structure, database, and UI kit. Scaffolding later would force rewrites.

**Scope**

- Create the Next.js + TypeScript app at the repo root (or a clearly documented `web/` only if the root must stay docs-only — prefer root app unless tooling fights the folder name).
- Tailwind, shadcn/ui, ESLint, Prettier, path aliases (`@/`).
- Prisma + PostgreSQL, `.env.example`, README only if the user asks for one later; until then, keep setup notes in this file’s Appendix.
- App shell: staff layout (sidebar + header), placeholder dashboard, login page stub (no real auth yet).
- Folder conventions: `app/`, `components/`, `lib/`, `prisma/`.

**Deliverables**

- `npm run dev` starts the app
- Prisma generates and migrates an empty or near-empty schema
- Shared layout with studio branding (name: Sunnex Clothing)

**Acceptance criteria**

- [x] TypeScript project builds
- [x] Database connection works on a developer machine
- [x] Staff shell renders with navigation placeholders matching the application map
- [x] No feature CRUD yet

**Out of scope.** Auth, clients, designs.

**Handoff.** Phase 1 adds real users on this shell.

---

### Phase 1 — Identity, roles, and access

**Goal.** People can sign in. The server knows their role. Clients and staff see different areas.

**Why now.** CRM and designs must never be world-readable. Auth first avoids bolting permissions on later.

**Scope**

- `User` model: email, password hash, name, role, status
- Auth.js credentials provider, session JWT or database sessions (pick one and stick to it)
- Sign in / sign out
- Middleware: `/app/**` for staff roles; `/portal/**` for `client`
- Seed: one admin, one designer, one staff, one demo client
- Unauthorized and unauthenticated screens

**Deliverables**

- Working login
- Role-aware nav
- `requireUser()`, `requireRole(...)` server helpers

**Acceptance criteria**

- [x] Wrong password fails safely (no user enumeration in messages)
- [x] Staff cannot open `/portal` as if they were that client; clients cannot open `/app`
- [x] Server actions reject missing or wrong roles (not only hidden buttons)

**Out of scope.** Invites by email, password reset (can be a small follow-on at the end of this phase if time allows; otherwise Phase 10).

**Handoff.** Phase 2 stores clients owned/visible to staff users.

---

### Phase 2 — Client management (CRM)

**Goal.** The house has a real client directory: search, profile, notes, and preferences.

**Why now.** Fashion work is client-specific. Designs and orders need a person to attach to.

**Scope**

- `Client` record: display name, contacts, address (optional), style notes, status (lead / active / archived)
- Link `Client` to a portal `User` when they have login access (nullable until invited)
- List + search + filters
- Profile page: overview, activity notes
- Staff-only create / edit / archive
- Audit-friendly `updatedAt` and “last contacted” if cheap to add

**Deliverables**

- `/app/clients` and `/app/clients/[id]`
- Note thread on the profile (simple chronological notes)

**Acceptance criteria**

- [x] Staff can create a client and find them by name or email
- [x] Archived clients are hidden by default
- [x] Clients never see other clients’ data
- [x] Empty and error states exist

**Out of scope.** Measurements, files, orders.

**Handoff.** Phase 3 hangs measurement profiles off the client record.

---

### Phase 3 — Measurements and fit

**Goal.** Each client has dated measurement profiles so garments are cut from the right numbers.

**Why now.** Custom fashion without fit data produces rework. Orders in Phase 5 will snapshot a profile.

**Scope**

- Configurable measurement fields (start with a sensible default set: bust, waist, hips, shoulder, inseam, height, etc., plus free-text notes)
- Multiple profiles per client (dated, labeled: “2026-09 fitting”)
- Mark one profile as current
- Simple print-friendly view for the workroom

**Deliverables**

- Measurements tab on the client profile
- Create / edit / set current

**Acceptance criteria**

- [x] History is preserved (old profiles are not overwritten)
- [x] Staff can tell which profile is current
- [x] Validation rejects empty nonsense (at least one numeric or a note)

**Out of scope.** 3D body scan, automatic size charts from photos.

**Handoff.** Phase 4 is creative; Phase 5 will combine client + measurements + design.

---

### Phase 4 — Fashion design studio

**Goal.** Designers record original work: designs, collections, visual references, construction notes, and status.

**Why now.** This is the “fashion designing” half of the product. It must exist before an order can point at a design.

**Scope**

- `Collection` (name, season, status)
- `Design`: title, description, category (jeans, trousers, shirts, jackets, other), status (concept / in development / approved / archived), color notes, fabric notes
- Attach images (sketches, drapes, mood). Local upload is enough.
- Optional link from a design to a client (commissioned concept) without being an order yet
- Staff gallery + design detail workspace

**Deliverables**

- `/app/designs`, `/app/designs/[id]`, `/app/collections`
- Image upload and display

**Acceptance criteria**

- [x] Designer can create a design, add images, and move status
- [x] Designs can belong to a collection
- [x] Client portal does **not** show a design until a later “shared” flag (add `sharedWithClient` now so Phase 9 is easy)

**Out of scope.** In-browser CAD, pattern drafting, 3D garment simulation. Those are future products, not this MVP.

**Handoff.** Phase 5 turns an approved design into a production order.

---

### Phase 5 — Orders and production workflow

**Goal.** A client commission or studio job has a single timeline from request to delivery.

**Why now.** CRM + designs only become an operating system when work is tracked.

**Scope**

- `Order`: client, optional design, optional measurement profile snapshot (copy values so later edits do not rewrite history), due date, price estimate, priority
- Status pipeline, for example: `inquiry → quoted → confirmed → in_cut → in_sew → fitting → ready → delivered → cancelled`
- Timeline / activity on the order
- Staff board or table grouped by status
- Client-visible status labels (friendlier copy, no internal notes)

**Deliverables**

- `/app/orders`, `/app/orders/[id]`
- Create order from a client profile and/or a design

**Acceptance criteria**

- [x] An order always has a client
- [x] Status changes are recorded
- [x] Cancelling is explicit and does not delete history
- [x] Client user (if linked) can see **their** order status only

**Out of scope.** Payments, inventory deduction, calendar (next phases).

**Handoff.** Phase 6 schedules fittings against orders; Phase 8 bills them.

---

### Phase 6 — Appointments and fittings

**Goal.** Consultations and fittings live on a studio calendar and on the order.

**Why now.** Fashion work is appointment-driven. Orders stall without scheduled fittings.

**Scope**

- `Appointment`: type (consultation, measurement, fitting, pickup), client, optional order, start/end, location or “studio”, notes, status (scheduled / completed / no-show / cancelled)
- Staff calendar (week view is enough)
- Create from client or order page
- Client portal: upcoming appointments

**Deliverables**

- `/app/calendar`
- Portal appointments list

**Acceptance criteria**

- [x] Staff can book, complete, and cancel
- [x] Calendar does not allow obvious overlapping for the same staff member (simple guard; full resource scheduling is not required)
- [x] Client sees only their appointments

**Out of scope.** Google Calendar sync, SMS reminders (Phase 9 can add in-app reminders only).

**Handoff.** Phase 7 is materials; appointments stay as-is.

---

### Phase 7 — Materials and inventory

**Goal.** The studio knows which fabrics and trims exist, roughly how much, and what an order needs.

**Why now.** Design notes mentioned fabric in Phase 4; production in Phase 5 needs real stock awareness.

**Scope**

- `Material`: name, type (fabric / trim / lining), color, quantity, unit, supplier, low-stock threshold
- Link materials to a design (bill of materials, optional quantities) and to an order (allocated vs used — keep allocation simple)
- Low-stock indicator on the materials list

**Deliverables**

- `/app/materials`
- BOM section on design and order

**Acceptance criteria**

- [x] Staff can add materials and adjust quantity
- [x] An order can list required materials
- [x] Quantity never silently goes negative without a warning

**Out of scope.** Full purchasing, multi-warehouse, barcode hardware.

**Handoff.** Phase 8 prices labour + materials into quotes.

---

### Phase 8 — Billing and documents

**Goal.** The studio can quote, invoice, and record payments without leaving the app.

**Why now.** Orders have estimates; this phase makes money explicit.

**Scope**

- Quote and invoice documents tied to an order
- Line items (labour, materials, extras)
- Status: draft / sent / paid / void
- Manual payment recording (cash, transfer, card-offline)
- PDF or print-friendly invoice view
- Client portal: invoices that were sent

**Deliverables**

- `/app/billing` and documents on the order page

**Acceptance criteria**

- [x] A confirmed order can produce a quote then an invoice
- [x] Paid amounts cannot exceed the invoice without an explicit overpay note
- [x] Voiding retains a record

**Out of scope.** Stripe/PayPal live capture (optional later). Tax-engine complexity: a single tax rate or tax-inclusive flag is enough.

**Handoff.** Phase 9 rolls money and work into dashboards.

---

### Phase 9 — Dashboards, client portal polish, and notifications

**Goal.** Each role has a home that answers “what needs me today?” Clients get a coherent portal. Staff get in-app alerts.

**Why now.** Features exist but are scattered. This phase makes the product feel like one system.

**Scope**

- Staff dashboard: due orders, today’s fittings, low stock, unpaid invoices
- Client portal home: next fitting, latest design shares, order status
- In-app notification list (order status, appointment reminder created by staff, invoice sent)
- Navigation and copy pass for consistency

**Deliverables**

- `/app` and `/portal` as real homes, not placeholders
- Notification bell for staff and clients

**Acceptance criteria**

- [x] Designer and client dashboards show only permitted data
- [x] Sharing a design (`sharedWithClient`) surfaces it in the portal
- [x] Empty dashboards are instructive, not blank

**Out of scope.** Email/SMS providers, marketing campaigns.

**Handoff.** Phase 10 makes it safe to use with real clients.

---

### Phase 10 — Hardening and launch readiness

**Goal.** The MVP is trustworthy: validated, seeded, documented for operators, and checked for the obvious security and UX holes.

**Why now.** Shipping without this phase produces a demo, not a studio tool.

**Scope**

- End-to-end pass of the happy path: hire staff user → client → measurements → design → order → fitting → invoice
- Seed story data for demos
- Password reset if skipped in Phase 1
- Rate-limit login, confirm file upload limits, review authorization on every mutation
- Accessibility pass on primary flows
- Backup/restore notes for Postgres
- Performance: indexes on search and foreign keys already used

**Deliverables**

- Written operator checklist in this file’s Appendix (or a user-requested README)
- Known-limitations list (no CAD, no live payments, etc.)

**Acceptance criteria**

- [ ] Happy path works without manual database edits
- [ ] A client cannot access another client’s ids by guessing URLs
- [ ] Uploads reject non-image types and oversized files
- [ ] Studio owner can explain how to run and back up the app

**Out of scope.** Mobile native apps, multi-tenant SaaS for many unrelated brands, AI pattern generation.

---

## 8. Explicitly not in the first product

These are easy to confuse with the MVP. They wait until the phases above are done and the user asks for them:

- Public storefront / cart / shipping
- In-browser pattern CAD or 3D garments
- Marketplace of many independent designers
- Real-time collaboration cursors
- Native iOS/Android apps
- Automated marketing email blasts

---

## 9. Suggested data model (evolve per phase, do not build all at once)

Implement tables **when the phase needs them**, not in Phase 0 as a giant schema.

| Phase | Introduce |
| --- | --- |
| 1 | `User` |
| 2 | `Client`, `ClientNote` |
| 3 | `MeasurementProfile` |
| 4 | `Collection`, `Design`, `DesignImage` |
| 5 | `Order`, `OrderEvent` |
| 6 | `Appointment` |
| 7 | `Material`, `DesignMaterial`, `OrderMaterial` |
| 8 | `Document` (quote/invoice), `DocumentLine`, `Payment` |
| 9 | `Notification` |

Exact field lists belong in Prisma migrations during each phase.

---

## 10. Definition of done (every phase)

A phase is complete only when:

1. The app still runs.
2. New screens have loading, empty, and error states.
3. Mutations are validated and role-checked on the server.
4. The happy path was exercised (browser when UI changed).
5. **Current phase** in this file is updated.

---

## Appendix A — Local setup

Requires **Node 20.18+** and **Docker** (or any PostgreSQL 14+ reachable at `DATABASE_URL`).

```bash
cp .env.example .env
# Set AUTH_SECRET to a long random string (openssl rand -base64 32)
docker compose up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Database: `postgresql://sunnex:sunnex@localhost:5432/sunnex` (Compose service `db`)

Seeded local accounts, password **`sunnex-dev`** (Sunnex Clothing case-study cast):

| Role | Name | Email |
| --- | --- | --- |
| Admin | Kavita Mehta | `admin@sunnex.local` |
| Designer | Rohan Desai | `designer@sunnex.local` |
| Staff | Priya Iyer | `staff@sunnex.local` |
| Client | Aryan Shah | `client@sunnex.local` |

Seeded clients:

| Client | Status | Notes |
| --- | --- | --- |
| Aryan Shah | active | Linked to `client@sunnex.local`. Mumbai. Fit profiles: 2024 regular jean (historic) and 2026 slim indigo jean (current). |
| Neha Kapoor | lead | Pune. Inquiry about a custom high-rise straight jean; no measurement profiles yet. |
| Vikram Reddy | archived | Hyderabad. Hidden from the default directory. |

Seeded designs (collection **Indigo Edit 2026**):

| Design | Status | Sharing |
| --- | --- | --- |
| Slim indigo jean | in development | Linked to Aryan and **shared**. Seed images: mood, sketch, drape. |
| Denim trucker | concept | House piece, not shared. Seed images: mood, sketch, drape. |
| High-rise straight jean | in development | House piece, not shared. Seed images: mood, sketch, drape. |

Seeded orders:

| Reference | Client | Status | Notes |
| --- | --- | --- | --- |
| SNX-2026-0001 | Aryan Shah | in sew (demo may have moved) | Slim indigo jean, current-fit snapshot, timeline from inquiry through sew. |
| SNX-2026-0002 | Neha Kapoor | inquiry | High-rise straight jean inquiry; no tape yet. |

Seeded sittings (India time):

| Sitting | Who | When |
| --- | --- | --- |
| Measurement (completed) | Aryan / Priya | Wed 2 Sep 2026, 11:00–11:45 |
| Fitting (scheduled) | Aryan / Priya | Fri 4 Sep 2026, 11:00–11:45 |
| Consultation (scheduled) | Neha / Rohan | Sat 5 Sep 2026, 12:00–12:30 |

Seeded materials:

| Material | Kind | On hand | Notes |
| --- | --- | --- | --- |
| 11 oz stretch denim | fabric | 42 m (less if allocated in a demo) | House stretch for slim jeans. |
| 12 oz rigid denim | fabric | 8 m | **Low stock** (threshold 12 m). |
| Copper hardware | trim | 40 pieces | Buttons and rivets. |
| Pocketing | lining | 25 m | Pocket bags. |

Slim jean and high-rise orders list the matching bill of materials. The trucker design has a BOM but no production order yet.

Seeded billing (Aryan slim jean, issued by Rohan):

| Reference | Kind | Status | Notes |
| --- | --- | --- | --- |
| SNX-Q-2026-0001 | quote | sent | Labour ₹12,000 + fabric ₹4,500 + hardware ₹2,000. No tax, tax-inclusive. Total ₹18,500. |
| SNX-INV-2026-0001 | invoice | sent | Converted from the quote. ₹10,000 cash recorded; ₹8,500 remaining. |

Neha’s inquiry has no documents. Quotes start only after an order is confirmed.

Seeded in-app notifications (not email):

| Who | Kind | Notes |
| --- | --- | --- |
| Aryan (portal) | invoice sent, order status, sitting reminder | Invoice and reminder unread; order “Sewing” already read. |
| Priya (staff) | appointment reminder | Fitting with Aryan. |
| Rohan (designer) | appointment reminder | Consultation with Neha. |

Staff home (`/app`) lists due orders, today’s sittings (India time), unpaid sent invoices, and low stock for admin/designer only. Portal home (`/portal`) lists the next sitting, shared designs, and own order status.

If port 5432 is already taken by Postgres.app or Homebrew, either stop that instance or point `DATABASE_URL` at a database you create there.

Useful scripts: `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, `npm run db:ping`, `npm run lint`, `npm run build`.

---

## Appendix B — Decision log

| Date | Decision |
| --- | --- |
| 2026-09-03 | Single Next.js full-stack app (no separate API). PostgreSQL + Prisma + Auth.js + Tailwind/shadcn. Phased delivery as in this file. Product name: **Sunnex Clothing**. |
| 2026-09-03 | Phase 0 uses Next.js 16 App Router, Prisma 6, and Docker Compose for PostgreSQL. Auth.js waits for Phase 1. |
| 2026-09-03 | Phase 1 uses Auth.js v5 (next-auth 5 beta) with the Credentials provider and **JWT sessions**. Route protection lives in `proxy.ts` plus `requireUser()` / `requireRole()` on the server. |
| 2026-09-03 | Phase 2 client records are staff-owned. A portal login is optional (`portalUserId`). Archived clients stay in the book but are hidden from the default directory (`open` = lead + active). |
| 2026-09-03 | Phase 3: default tape fields live in code (centimetres). Values are stored as JSON on `MeasurementProfile`. Exactly one `isCurrent` profile per client is enforced in a transaction. New fittings create new rows so history is never overwritten. |
| 2026-09-03 | Demo narrative is a **Sunnex Clothing** case study (Mumbai denim and casualwear), not a European couture house. Seeded staff and clients are Indian; login emails stay `*@sunnex.local`. |
| 2026-09-03 | Phase 5: every order belongs to a client. Status moves through inquiry → quoted → confirmed → in_cut → in_sew → fitting → ready → delivered, with an explicit cancel that keeps the timeline. A fit snapshot is copied onto the order. The portal shows friendly status labels and never other clients’ jobs. |
| 2026-09-04 | Phase 6: sittings are typed (consultation, measurement, fitting, pickup). Times are India time. The same staff member cannot hold two scheduled sittings that overlap. Clients see only their own appointments. |
| 2026-09-04 | Phase 7: the materials catalog is admin/designer. All staff can attach required lines on an order and allocate from on-hand. Stock will not go below zero unless someone ticks the allow box; the UI still warns when it does. |
| 2026-09-04 | Phase 8: quotes and invoices are staff-wide, not admin-only. Money is whole rupees. A confirmed (or later) order can be quoted, sent, then converted to an invoice. Payments cannot exceed the invoice total without an overpay note. Void keeps the row. The portal sees only sent invoices for that client. Tax is a single rate plus an inclusive flag. |
| 2026-09-04 | Phase 9: `/app` and `/portal` are role homes, not placeholders. In-app notifications cover order status, staff-sent sitting reminders, and sent invoices — no email/SMS. Booking a sitting alerts the assigned staff member; the client is reminded only when staff send a portal reminder. Low stock on the staff home is admin/designer only. |
