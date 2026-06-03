# Like By Nirob

A Free Fire game boost platform that allows users to send likes and profile visits to Free Fire accounts using access keys. Features auto-like scheduling, Telegram notifications, and a full admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/slv run dev` — run the frontend (port 20016)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `SESSION_SECRET` — JWT secret for admin auth (stored in Replit secrets)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, bcryptjs (passwords), jsonwebtoken (admin auth)
- DB: PostgreSQL + Drizzle ORM (5 tables: keys, logs, settings, banned_ips, auto_like_tasks)
- Frontend: React + Vite, Tailwind CSS 4, wouter (routing), @tanstack/react-query
- Build: esbuild (CJS bundle for API), Vite (frontend)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (source of truth)
- `artifacts/api-server/src/` — Express API server
  - `routes/public.ts` — key checking, like/visit endpoints, public stats
  - `routes/admin.ts` — admin CRUD (keys, logs, settings, auto-like tasks)
  - `routes/track.ts` — heartbeat for online user tracking
  - `lib/settings.ts` — settings cache + CRUD
  - `lib/autolike.ts` — BST-timezone scheduler + batch runner
  - `lib/telegram.ts` — Telegram notification helpers
  - `lib/init.ts` — seeds default settings on first run
  - `middlewares/auth.ts` — JWT admin guard
- `artifacts/slv/src/` — React frontend
  - `pages/` — Home, Like, Visit, CheckKey, AutoLike, PriceList, AdminLogin, AdminDashboard
  - `components/` — Layout, Navbar, SupportWidget
  - `lib/i18n.tsx` — English + Bangla translations, region list
  - `hooks/use-admin.ts` — admin token helpers and auth redirect

## Architecture decisions

- JWT-based admin auth (7-day tokens) stored in localStorage; no server-side sessions
- Settings stored as single JSONB row in `settings` table; in-memory cache with 30s TTL
- Auto-like scheduler uses BST (UTC+6) timezone; fires daily at configurable hour:minute
- Online user tracking via in-memory heartbeat map (2-minute TTL, no DB writes)
- Tables created via `drizzle-kit push` (not startup DDL) — restart-safe by design

## Product

- Users enter an access key + Free Fire UID + region to send likes or profile visits
- Keys have configurable validity period and optional use-limit
- Auto Like service queues UIDs for daily automatic likes (sent at 4:00 AM BST by default)
- Admin panel at `/nirobff360adminp` — manage keys, view logs, ban IPs, configure settings
- Telegram bot notifications for all key checks, likes, visits, admin logins, auto-like results
- Bilingual (English + Bangla) with language toggle in navbar

## Admin Access

- URL: `/nirobff360adminp`
- Default password: `nirob360` (change immediately after first login!)

## User preferences

- Self-healing: must restart cleanly from Run button with no manual shell commands
- DB initialization is automatic via drizzle-kit push (tables persist across restarts)
- BST timezone (UTC+6) for all scheduling

## Gotchas

- `lib/db/src/index.ts` throws synchronously if `DATABASE_URL` is missing — always provision DB first
- Auto-like scheduler starts on API server boot; it recalculates schedule on each cycle
- Admin password is bcrypt-hashed and stored in the settings JSONB row
- The `SESSION_SECRET` env var is required for JWT signing — set in Replit secrets

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
