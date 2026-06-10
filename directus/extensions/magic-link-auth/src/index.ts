import { createHash } from 'crypto';
import { defineEndpoint } from '@directus/extensions-sdk';
import jwt from 'jsonwebtoken';
import ms from 'ms';

type PolicyAccess = {
  admin_access: boolean | number | null;
  app_access: boolean | number | null;
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function getMilliseconds(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') return value;
  if (!value) return fallback;
  const parsed = ms(value);
  return typeof parsed === 'number' ? parsed : fallback;
}

function clientIp(req: { ip?: string }): string | null {
  if (!req.ip) return null;
  return req.ip.startsWith('::ffff:') ? req.ip.slice(7) : req.ip;
}

async function fetchGlobalAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database: any,
  userId: string,
  roleId: string | null
): Promise<{ admin: boolean; app: boolean }> {
  const rows = (await database('directus_access as a')
    .join('directus_policies as p', 'a.policy', 'p.id')
    .where((qb: { where: (col: string, val: string) => void; orWhere: (col: string, val: string) => void }) => {
      qb.where('a.user', userId);
      if (roleId) qb.orWhere('a.role', roleId);
    })
    .select('p.admin_access', 'p.app_access')) as PolicyAccess[];

  const admin = rows.some((row) => Boolean(row.admin_access));
  const app = rows.some((row) => Boolean(row.app_access)) || rows.length > 0;

  return { admin, app };
}

export default defineEndpoint((router, { database, env, logger }) => {
  router.post('/verify', async (req, res) => {
    try {
      const expectedSecret = env.MAGIC_LINK_INTERNAL_SECRET as string | undefined;
      const providedSecret = req.get('x-magic-link-secret');

      if (!expectedSecret || providedSecret !== expectedSecret) {
        return res.status(403).json({ errors: [{ message: 'Forbidden' }] });
      }

      const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      if (!token) {
        return res.status(400).json({ errors: [{ message: 'Token required' }] });
      }

      const secret = env.SECRET as string | undefined;
      if (!secret) {
        logger.error('[magic-link-auth] SECRET is not configured');
        return res.status(500).json({ errors: [{ message: 'Server misconfigured' }] });
      }

      const tokenHash = hashToken(token);
      const now = new Date();

      const link = await database('magic_login_links')
        .where({ token_hash: tokenHash })
        .whereNull('used_at')
        .where('expires_at', '>', now)
        .first();

      if (!link) {
        return res.status(401).json({ errors: [{ message: 'Invalid or expired link' }] });
      }

      const marked = await database('magic_login_links')
        .where({ id: link.id })
        .whereNull('used_at')
        .update({ used_at: now });

      if (!marked) {
        return res.status(401).json({ errors: [{ message: 'Invalid or expired link' }] });
      }

      const user = await database('directus_users')
        .select('id', 'role', 'status')
        .where({ id: link.user })
        .first();

      if (!user || user.status !== 'active') {
        return res.status(401).json({ errors: [{ message: 'User not active' }] });
      }

      const globalAccess = await fetchGlobalAccess(database, user.id, user.role);

      const tokenPayload = {
        id: user.id,
        role: user.role,
        app_access: globalAccess.app,
        admin_access: globalAccess.admin,
      };

      const { nanoid } = await import('nanoid');
      const refreshToken = nanoid(64);
      const refreshTokenExpiration = new Date(
        Date.now() + getMilliseconds(env.REFRESH_TOKEN_TTL as string | undefined, 7 * 24 * 60 * 60 * 1000)
      );

      const accessToken = jwt.sign(tokenPayload, secret, {
        expiresIn: (env.ACCESS_TOKEN_TTL as string | undefined) || '15m',
        issuer: 'directus',
      });

      await database('directus_sessions').insert({
        token: refreshToken,
        user: user.id,
        expires: refreshTokenExpiration,
        ip: clientIp(req),
        user_agent: req.get('user-agent')?.substring(0, 1024) ?? null,
        origin: req.get('origin') ?? null,
      });

      await database('directus_sessions').delete().where('expires', '<', new Date());
      await database('directus_users').update({ last_access: new Date() }).where({ id: user.id });

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      logger.error(error, '[magic-link-auth] verify failed');
      return res.status(500).json({ errors: [{ message: 'Internal error' }] });
    }
  });
});
