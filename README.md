# StackEDU Landing

Marketing website for [StackEDU](https://stackedu.africa) — school management software for Rwanda and Africa.

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **GSAP**, and **Resend** (contact form).

The **Educational Management System** (product app) lives in [`app/`](./app/README.md) — Bun monorepo (`apps/web` + `apps/api`). Deploy it separately to [app.stackedu.rw](https://app.stackedu.rw) / `api.stackedu.rw`. See [`app/README.md`](./app/README.md) for local setup and deploy steps.

---

## Requirements

- Node.js 20+
- npm

---

## Local setup

```bash
git clone git@github.com:StackForgeAI-Projects/stackedu-landing.git
cd stackedu-landing
npm install
cp .env.example .env.local
```

Edit `.env.local` with your keys (see below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env` or `.env.local`.

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes (prod) | Resend API key for the Book a Demo form |
| `CONTACT_TO_EMAIL` | Yes (prod) | Inbox that receives form submissions |
| `CONTACT_FROM_EMAIL` | Yes (prod) | Verified sender in Resend (e.g. `StackEDU <hello@stackedu.africa>`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for hero demo video |
| `NEXT_PUBLIC_HERO_VIDEO_ID` | Optional | Cloudinary public ID for hero demo video |

For local testing without Resend, the form returns a configuration error until `RESEND_API_KEY` is set. Use `onboarding@resend.dev` as sender only for Resend sandbox testing.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |

---

## Project structure

```
src/
├── app/                 # Next.js App Router (pages, API routes)
│   └── api/contact/     # Book a Demo → Resend
├── components/landing/  # Landing page sections
├── components/ui/       # Shared UI pieces
├── hooks/               # GSAP scroll reveals
└── lib/
    ├── i18n/            # EN / FR / RW translations
    ├── assets.ts        # Image paths
    └── content.ts       # Shared constants
public/images/           # Static assets
```

---

## Deployment (Vercel)

1. Push this repo to GitHub (`StackForgeAI-Projects/stackedu-landing`).
2. In [Vercel](https://vercel.com/new), import the GitHub repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables from the table above under **Project → Settings → Environment Variables**.
5. Deploy.

**Custom domains:** add `stackedu.africa` and `stackedu.rw` in Vercel → Domains, then point DNS at Vercel. Verify both domains in Resend before using them as `CONTACT_FROM_EMAIL` senders.

---

## What is not in this repo

Excluded via `.gitignore`:

- `node_modules/`, `.next/`, build output
- `.env`, `.env*.local` (secrets)
- `stackedu-design/` — local Lovable/design reference only
- Editor folders (`.cursor/`, `.vscode/`, `.idea/`)

---

## License

Private — StackForge AI.
