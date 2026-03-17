# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bill Tracker is an internal tool for tracking subscription bills and due dates across multiple entities (companies/organizations). It sends email alerts when due dates approach. Built to mirror the sister project `cost-tracker` in stack and conventions.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm
- **Database:** PostgreSQL via Neon (`@neondatabase/serverless`) + Drizzle ORM
- **Auth:** Simple password-based JWT auth via `jose` (7-day sessions, httpOnly cookies)
- **UI:** shadcn/ui (new-york style, neutral base) + Tailwind CSS v4 + Radix UI
- **Charts:** Recharts
- **Email:** Resend (for bill due date alerts)
- **Toasts:** Sonner

## Common Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build (standalone output)
pnpm lint             # ESLint
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations against Neon
pnpm db:seed          # Seed database (runs migrations + inserts defaults)
pnpm db:setup         # db:generate + db:seed
```

## Architecture

### Data Model

- **entities** — Companies/orgs that own subscriptions (e.g. "Company A", "Company B")
- **subscriptions** — Service subscriptions belonging to an entity (OpenAI, AWS, etc.) with billing cycle, expected amount, billing day
- **bills** — Individual bill records per subscription with due date, amount, payment status (pending/paid/overdue)
- **payment_cards** — Payment methods (label, last4, brand)
- **alert_settings** — Email alert configuration (recipient, days before due)
- **alert_log** — Tracks which bill alerts have been sent to avoid duplicates

### Key Relationships

- Each subscription belongs to one entity (cascade delete)
- Each bill belongs to one subscription (cascade delete)
- Bills have a unique constraint on (subscriptionId, dueDate)

### Auth Flow

Middleware (`middleware.ts`) protects all routes except `/login`, `/api/auth/*`, and `/api/cron/*`. JWT tokens stored in httpOnly cookies. Single shared password from `AUTH_PASSWORD` env var.

### Email Alerts

- `/api/cron/alerts` (POST) — Cron-compatible endpoint that checks for upcoming/overdue bills and sends email alerts via Resend
- Protected by `CRON_SECRET` bearer token (not JWT auth)
- Skips bills that already have entries in `alert_log` to avoid duplicates
- Also auto-marks past-due pending bills as "overdue"

### Bill Generation

`POST /api/bills/generate` auto-creates bill records for all active subscriptions based on their `billingDay` and `expectedAmount`. Unique constraint prevents duplicates.

### Route Structure

- `(authenticated)/*` — Route group for protected pages (dashboard, subscriptions, bills, settings)
- `/api/cron/*` — Exempt from JWT auth, uses bearer token instead

## Environment Variables

```
AUTH_PASSWORD       # Login password
AUTH_SECRET         # JWT signing secret (32+ chars)
DATABASE_URL        # Neon PostgreSQL connection string
RESEND_API_KEY      # Resend email API key
ALERT_EMAIL_FROM    # Sender address for alerts
ALERT_EMAIL_TO      # Default alert recipient (used in seed)
CRON_SECRET         # Bearer token for /api/cron/* endpoints
```

## Conventions (shared with cost-tracker)

- DB connection uses lazy Proxy pattern (`src/lib/db/index.ts`)
- API routes use Next.js App Router route handlers with async params: `{ params }: { params: Promise<{ id: string }> }`
- Drizzle schema uses `serial` PKs, `timestamp` with `$defaultFn`, snake_case column names
- shadcn components in `src/components/ui/`, custom components in `src/components/`
- Path alias: `@/*` maps to `./src/*`
- CSS uses oklch() color format with CSS variables for theming
