import type { DirectusUser } from '@/types';

export function isStaff(user: DirectusUser | null): boolean {
  if (!user?.role) return false;
  const name = user.role.name?.toLowerCase() ?? '';
  return (
    name.includes('staff') ||
    name.includes('moschee') ||
    name.includes('imam') ||
    name.includes('manager')
  );
}

export function isAdmin(user: DirectusUser | null): boolean {
  const name = user?.role?.name?.toLowerCase() ?? '';
  return Boolean(
    user?.role?.admin_access ||
      name.includes('admin') ||
      name.includes('administrator')
  );
}

export function resolvePostLoginPath(user: DirectusUser, redirectTo?: string | null): string {
  if (redirectTo) return redirectTo;
  if (isAdmin(user)) return '/admin';
  if (isStaff(user)) return '/staff';
  return '/staff';
}
