# Magic Link Auth — Directus Endpoint Extension

Issues Directus JWT access/refresh tokens after validating a `magic_login_links` token **without** changing the user's password.

## Endpoint

`POST /magic-link-auth/verify`

**Headers:**
- `Content-Type: application/json`
- `X-Magic-Link-Secret: <MAGIC_LINK_INTERNAL_SECRET>`

**Body:**
```json
{ "token": "<raw-magic-token-from-url>" }
```

**Response:**
```json
{ "access_token": "...", "refresh_token": "..." }
```

## Directus server environment

Add to `directus.alattas.de` environment:

```env
MAGIC_LINK_INTERNAL_SECRET=<same-value-as-nextjs>
```

Generate a strong random value, e.g. `openssl rand -base64 32`.

## Build & deploy

```bash
cd directus/extensions/magic-link-auth
npm install
npm run build
```

Copy the folder (including `dist/`) into the Directus instance extensions directory, e.g.:

```
/var/directus/extensions/magic-link-auth/
```

Restart Directus after deploy.

## Next.js

Set the same secret in `.env.local`:

```env
MAGIC_LINK_INTERNAL_SECRET=<shared-secret>
```
