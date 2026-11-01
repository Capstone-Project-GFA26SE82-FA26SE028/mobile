import type { WaiterProfile } from '../types/types';

export function hasWaiterSession(state: {
  signedIn: boolean;
  waiter: WaiterProfile | null;
}): boolean {
  return (
    state.signedIn &&
    !!state.waiter?.active &&
    state.waiter.role === 'waiter' &&
    !!state.waiter.id.trim() &&
    !!state.waiter.name.trim()
  );
}
