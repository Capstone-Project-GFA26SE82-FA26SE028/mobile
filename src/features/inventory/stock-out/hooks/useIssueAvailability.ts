import { useQueries } from '@tanstack/react-query';
import { useAppSelector } from '../../../../app/hooks';
import { getStockAvailability } from '../../stock/api/stockApi';

export function useIssueAvailability(ids: string[], enabled: boolean) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['inventory-stock', userId, 'issue-availability', id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getStockAvailability(id, signal),
      enabled: enabled && !!userId,
      retry: false,
      refetchInterval: 30_000,
    })),
  });
}
