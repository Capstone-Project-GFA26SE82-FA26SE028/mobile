import { useEffect, useState } from 'react';
import { store } from '@/app/store';
import { execute } from './waiterSlice';
import type { Command } from './types';
type Input = {
  [K in Command['type']]: Omit<Extract<Command, { type: K }>, 'id' | 'now'>;
}[Command['type']];
export function runCommand(input: Input): boolean {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  store.dispatch(execute({ ...input, id, now: Date.now() } as Command));
  return !store.getState().waiter.feedback?.error;
}
export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
