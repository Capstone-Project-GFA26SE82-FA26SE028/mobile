import type { PropsWithChildren, ReactNode } from 'react';
import type { UserRole } from '@/types/auth';

// Client UI gating only; the backend must enforce permissions as well.
export function RoleRoute({ role, allowedRoles, fallback = null, children }:
  PropsWithChildren<{ role: UserRole | null; allowedRoles: readonly UserRole[]; fallback?: ReactNode }>) {
  return <>{role !== null && allowedRoles.includes(role) ? children : fallback}</>;
}
