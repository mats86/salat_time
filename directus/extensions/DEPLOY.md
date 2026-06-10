# Deploy Directus Extensions

## magic-link-auth

1. Build (if not already built):
   ```bash
   cd directus/extensions/magic-link-auth
   npm install
   npm run build
   ```

2. Copy the entire `magic-link-auth` folder to the Directus server extensions directory:
   ```
   <directus-root>/extensions/magic-link-auth/
   ```
   Required files: `package.json`, `dist/index.js`

3. Set on the **Directus server** (same value as Next.js `.env.local`):
   ```env
   MAGIC_LINK_INTERNAL_SECRET=<shared-secret>
   ```

4. Restart Directus.

5. Verify:
   ```bash
   curl -X POST https://directus.alattas.de/magic-link-auth/verify \
     -H "Content-Type: application/json" \
     -H "X-Magic-Link-Secret: <shared-secret>" \
     -d '{"token":"invalid"}'
   ```
   Expected: `401` (not `404`).
