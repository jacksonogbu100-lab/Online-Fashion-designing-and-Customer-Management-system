# Project Guidebook

This file is the operating manual for every agent working in this repository. **Read this file and `IMPLEMENTATION.md` before doing any other work.** Do not implement, refactor, or invent features until those two documents have been consulted for the current request.

## Product

**Sunnex Clothing** is a full-stack **Online Fashion Designing and Customer Management System**. The case study is **Sunnex Clothing**, a Mumbai denim and casualwear house: designers and staff manage clients, measurements, original designs, custom orders, fittings, materials, and billing in one application. Clients use a portal to view their profile, designs, appointments, and order status.

Everything runs **in one Next.js application** (App Router). Do not introduce a separate backend service, microservices, or a second frontend unless `IMPLEMENTATION.md` is updated first.

## How to start every task

1. Read this guidebook and `IMPLEMENTATION.md`.
2. Identify the **current phase** and whether the request belongs in it.
3. If the request jumps ahead (for example, billing while Phase 0 is incomplete), say so, then either stay in the current phase or propose a documented phase adjustment.
4. Implement only what the phase and the user’s prompt require. Do not scaffold later phases “while you are here.”
5. After a phase’s acceptance criteria are met, update the **Current phase** section in `IMPLEMENTATION.md`.

## Working rules

- Follow the agreed stack in `IMPLEMENTATION.md`. Do not swap frameworks, ORMs, or auth libraries without an explicit user decision recorded in that file.
- Prefer small, complete slices: data model → server logic → UI → validation of the happy path.
- Keep domain language consistent: **client** (customer of the house), **design** (a fashion piece or collection item), **order** (a commissioned or catalog job), **fitting**, **measurement profile**.
- TypeScript is strict. Validate at boundaries with Zod. Do not use `any` to silence errors.
- Server data access stays on the server (Server Components, Server Actions, route handlers). Do not expose secrets or raw database clients to the browser.
- UI must be usable: loading, empty, error, and permission-denied states for every new screen.
- Do not add markdown files the user did not ask for. Do not commit unless the user asks.
- When changing UI, verify the real user flow (browser or the closest available substitute) before calling the work done.

## Roles (access)

| Role | Intended access |
| --- | --- |
| `admin` | Full configuration, users, all records |
| `designer` | Clients, designs, orders, fittings, materials |
| `staff` | Clients, orders, fittings, limited design access |
| `client` | Own profile, measurements, orders, appointments, shared designs |

Enforce role checks on the server. UI hiding is not security.

## Source of truth

| Document | Purpose |
| --- | --- |
| `AGENTS.md` | How agents must work |
| `IMPLEMENTATION.md` | What we are building, in which order |
| `.cursor/rules/` | Short, always-on reminders of the above |

If these documents disagree, stop and align them before coding. The user’s latest explicit instruction wins, then update the docs so the next session stays consistent.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
