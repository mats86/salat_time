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
- `DIRECTUS_SERVICE_TOKEN` — Server token for magic link creation (CRUD `magic_login_links`, read users)
- `MAGIC_LINK_INTERNAL_SECRET` — Shared secret for the Directus `magic-link-auth` extension (same value on Directus server)
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Optional Maps embed key
- `NEXT_PUBLIC_ALADHAN_METHOD` — Prayer calculation method (default: 3)

## Magic link extension (Directus)

Magic link verify issues JWTs via the Directus endpoint extension in [`directus/extensions/magic-link-auth/`](directus/extensions/magic-link-auth/) without changing user passwords.

Deploy: build the extension, copy to the Directus extensions folder, set `MAGIC_LINK_INTERNAL_SECRET` on the Directus server, restart Directus. See the extension README for details.

Users who used magic links before this extension may need a one-time password reset in the Directus admin.

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
