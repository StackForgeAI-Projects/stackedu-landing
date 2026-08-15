# StackEDU — Educational Management System

The product application for Rwandan tertiary institutions: admissions, portals,
fees, and academic administration.

This folder is named **`ems/`** on purpose — not `app/` — because the marketing Next.js site already uses `src/app` for the App Router. A root `app/` folder would break the landing deploy on Vercel.

This folder is a **Bun / Turborepo monorepo**. It lives inside the
`stackedu-prod` GitHub repository as `ems/`, alongside the marketing site
at the repo root. Deploy the marketing site and this EMS as **two separate
projects** (different Vercel/Render roots).

| Live URL | Role |
| --- | --- |
| [app.stackedu.rw](https://app.stackedu.rw) | Web app (Vercel → `ems/apps/web`) |
| `api.stackedu.rw` | API (Render → `ems/`) |
| [stackedu.rw](https://stackedu.rw) / [stackedu.africa](https://stackedu.africa) | Marketing (repo root, Next.js) |

---

## Packages

| Path | Package | What it is |
| --- | --- | --- |
| `apps/web` | `@stackedu/web` | React 19 + Vite + TanStack Router. SPA for apply, track, and role portals. |
| `apps/api` | `@stackedu/api` | Hono API on Node 22. Auth, admissions, institution DBs. |
| `packages/shared` | `@stackedu/shared` | Shared Zod schemas and TypeScript types (single source of truth). |

Supporting files: `docker-compose.yml` (Postgres + pgvector), `render.yaml`
(API Blueprint), `design_system/` (UI reference), `EMS-master-context.md`
(product context).

---

## Requirements

- [Bun](https://bun.sh) 1.3+
- Docker (local Postgres on port **5433**)
- Node is not required for day-to-day `bun` scripts

---

## Local setup

```bash
cd ems
bun install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

bun run db:up        # Postgres + pgvector
bun run db:migrate   # platform DB, then every institution
bun run db:seed      # demo institutions + role accounts
bun run dev          # web :3000 · api :8080
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:8080 |
| Postgres | `localhost:5433` · user/pass/db: `stackedu` / `stackedu` / `stackedu_platform` |

```bash
bun run check-types
bun run test           # API tests against real Postgres
```

The seed creates **two** institutions on purpose. With only one tenant, a
cross-tenant bug looks like correct behaviour.

### Demo sign-in (after seed)

Passwords and identifiers are defined in the API seed. Typical pattern:

| Role | Sign-in |
| --- | --- |
| Student | email or matric number |
| Lecturer / Bursar / Academic / Librarian / ICT | role email for the demo institution |
| Applicant | register at `/apply`, or email / `APP-…` reference |

---

## Environment

### API — `app/.env` (from `.env.example`)

| Variable | Purpose |
| --- | --- |
| `PLATFORM_DATABASE_URL` | Shared platform Postgres |
| `ADMIN_DATABASE_URL` | Optional; used only to `CREATE DATABASE` |
| `ALLOWED_ORIGINS` | Exact browser origins (comma-separated). No wildcards. |
| `COOKIE_DOMAIN` | Required in production, e.g. `.stackedu.rw` |
| `API_PUBLIC_URL` | Public API URL (local upload/download links) |
| `STORAGE_DRIVER` | `local` (dev) or `r2` (Cloudflare R2) |
| `STORAGE_LOCAL_ROOT` | Local upload directory (default `.data/uploads`) |
| `STORAGE_SIGNING_SECRET` | HMAC for local signed upload URLs (required if local + production) |
| `R2_*` | Required when `STORAGE_DRIVER=r2` |
| `APPLICATION_FEE_RWF` | Application fee in whole RWF (default `10000`) |
| `PAYMENT_MODE` | `sandbox` (MoMo/Airtel complete immediately) or `live` |
| `RESEND_API_KEY` | Optional; admissions emails via Resend |
| `EMAIL_FROM` | Required with the key, e.g. `StackEDU Admissions <admissions@stackedu.rw>` |
| `EMAIL_REPLY_TO` | Optional |
| `WEB_APP_URL` | Track links in email (default `https://app.stackedu.rw`) |

Never commit `.env`. `.data/` uploads are gitignored.

### Web — `apps/web/.env.local`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL (`http://localhost:8080` locally) |

Only `VITE_*` variables are exposed to the browser. Never put secrets here.

---

## Architecture notes

### One database per institution

A small **platform** database holds institutions and the email → institution
directory. Each institution has its **own** Postgres database.

Restores stay scoped to one school. Migrations run across institutions in
slug order and **stop on the first failure** (`bun run db:migrate`).

```bash
bun run institution:create \
  --name "University of Kigali" --slug uok \
  --short-name UoK --email registrar@uok.ac.rw
```

### Auth and cookies

Sessions are HttpOnly cookies. The web and API are on different hosts, so:

```text
ALLOWED_ORIGINS=https://app.stackedu.rw,https://app.stackedu.africa
COOKIE_DOMAIN=.stackedu.rw
```

The leading dot on `COOKIE_DOMAIN` shares the session between
`app.stackedu.rw` and `api.stackedu.rw`. Both front ends use **one** API host
(`api.stackedu.rw`).

### Admissions (current)

Wired end-to-end for live testing:

1. Register → session → multi-step form (saved to DB)
2. Document upload (signed PUT → local disk or R2)
3. Application fee record (sandbox or staff-confirmed bank)
4. Submit only when form + required docs + **Completed** payment
5. Academic Admin inbox reviews real applications; Track reflects status

Still external (needs provider keys): live MoMo/Airtel/DPO webhooks, production
R2 CORS (if using R2), SMS, OTP. Admissions email (submit + decision) uses Resend
when `RESEND_API_KEY` + `EMAIL_FROM` are set.

---

## Deploy for live tests

Use the **same** GitHub repo (`StackForgeAI-Projects/stackedu-prod`). Do
**not** create a second repo. Create separate hosting projects with different
root directories.

### 1. Web — Vercel → `app.stackedu.rw`

1. Vercel → **Add New Project** → import `stackedu-prod`
2. **Root Directory:** `ems/apps/web`
3. Framework: Vite (auto)
4. Environment variable:

   ```text
   VITE_API_URL=https://api.stackedu.rw
   ```

5. Domains → add `app.stackedu.rw` (and later `app.stackedu.africa`)
6. DNS: `CNAME` for `app` → Vercel (remove any “under construction” parking page)

`apps/web/vercel.json` already sets the SPA rewrite and security headers.

### 2. API — Render → `api.stackedu.rw`

1. Render → Blueprint or Web Service from the same repo
2. **Root Directory:** `ems` (this monorepo)
3. Build / start (also in `render.yaml`):

   ```text
   bun install --frozen-lockfile && bun run --filter '@stackedu/api' build
   node apps/api/dist/index.js
   ```

4. Health check: `/health`
5. Set in the dashboard (never commit secrets):

   | Key | Example |
   | --- | --- |
   | `PLATFORM_DATABASE_URL` | Neon / managed Postgres |
   | `ADMIN_DATABASE_URL` | Same server OK for `CREATE DATABASE` |
   | `ALLOWED_ORIGINS` | `https://app.stackedu.rw,https://app.stackedu.africa` |
   | `COOKIE_DOMAIN` | `.stackedu.rw` |
   | `API_PUBLIC_URL` | `https://api.stackedu.rw` |
   | `STORAGE_DRIVER` | `local` for early tests, or `r2` |
   | `PAYMENT_MODE` | `sandbox` for early tests; `live` when gateways are ready |
   | `STORAGE_SIGNING_SECRET` | Long random string if using local storage |
   | `RESEND_API_KEY` | Resend key for admissions emails |
   | `EMAIL_FROM` | e.g. `StackEDU Admissions <admissions@stackedu.rw>` |
   | `EMAIL_REPLY_TO` | Optional reply address |
   | `WEB_APP_URL` | `https://app.stackedu.rw` (Track links in email) |

6. Custom domain: `api.stackedu.rw`

### 3. Resend (email)

Verify the **root** domain `stackedu.rw` in Resend once. You do **not** need a
separate Resend account for `app.stackedu.rw`. Set `RESEND_API_KEY` and
`EMAIL_FROM` on Render (e.g. `admissions@stackedu.rw`). The API emails the
applicant when an application is **submitted** and when academic staff
**records a decision**.

### 4. Smoke checklist

- [ ] https://app.stackedu.rw loads the login / apply UI  
- [ ] https://api.stackedu.rw/health → `{ "status": "ok", ... }`  
- [ ] https://api.stackedu.rw/health/ready → platform DB OK  
- [ ] Register applicant → form → documents → sandbox pay → submit  
- [ ] Academic admin sees the application and can decide  
- [ ] Applicant Track shows the new status  

---

## Health endpoints

| Path | Purpose |
| --- | --- |
| `/health` | Liveness (no DB). Safe for Render restarts. |
| `/health/ready` | Readiness including platform database. |
| `/health/pools` | Open institution connection pools. |

---

## Scripts (from `ems/`)

| Command | Purpose |
| --- | --- |
| `bun run dev` | Web + API |
| `bun run build` | Production builds |
| `bun run check-types` | Typecheck all packages |
| `bun run test` | API Vitest suite |
| `bun run db:up` / `db:down` / `db:reset` | Docker Postgres |
| `bun run db:migrate` | Migrate platform + all institutions |
| `bun run db:seed` | Demo data |
| `bun run institution:create` | Provision a new institution DB |

---

## Repo layout (this folder)

```text
ems/
├── apps/
│   ├── web/          # Vercel root for app.stackedu.rw
│   └── api/          # Hono API source
├── packages/shared/  # Zod contracts
├── design_system/    # UI kit reference
├── docker-compose.yml
├── render.yaml       # Render Blueprint (use with Root Directory = ems)
├── .env.example
└── README.md         # This file
```

Marketing Next.js code stays at the **repository root** (`src/`, etc.), not
here. Next.js uses `src/app` for the marketing App Router, so this `ems/`
directory does not conflict with it.

---

## License

Private — StackForge AI.
