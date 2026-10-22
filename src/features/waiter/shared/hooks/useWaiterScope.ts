import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';

export function useWaiterScope() {
  const userId = useAppSelector(s => s.waiter.waiter?.id);
  return ['waiter-api', userId] as const;
}

export function useRefreshWaiterData() {
  const client = useQueryClient();
  const scope = useWaiterScope();
  return () => { void client.invalidateQueries({ queryKey: scope }); };
}
