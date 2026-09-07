import type { PropsWithChildren, ReactNode } from 'react';

// The caller supplies session state and the sign-in/loading UI.
export function ProtectedRoute({ isAuthenticated, fallback = null, children }:
  PropsWithChildren<{ isAuthenticated: boolean; fallback?: ReactNode }>) {
  return <>{isAuthenticated ? children : fallback}</>;
}
