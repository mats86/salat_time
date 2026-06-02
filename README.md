# Salat Zeit PWA

Islamic prayer times and mosque finder — Next.js 14, Directus, Aladhan API.

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

## Environment

- `NEXT_PUBLIC_DIRECTUS_URL` — Directus API (default: https://directus.alattas.de)
- `DIRECTUS_STATIC_TOKEN` — Read-only token for server components
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Optional Maps embed key
- `NEXT_PUBLIC_ALADHAN_METHOD` — Prayer calculation method (default: 3)

## Routes

| Route | Description |
|-------|-------------|
| `/` | User app — prayer times + nearby mosques |
| `/mosque/[id]` | Mosque detail |
| `/auth/login` | Staff/Admin login |
| `/staff/*` | Staff portal |
| `/admin/*` | Admin dashboard |

## Design

UI follows the **Salat Zeit PWA** Stitch project (dark theme, Libre Caslon + Inter, gold accents).
