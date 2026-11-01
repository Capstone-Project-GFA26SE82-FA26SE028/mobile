import { useMutation, useQuery } from '@tanstack/react-query';
import { waiterService } from '../../api/waiterApi';
import { useRefreshWaiterData, useWaiterScope } from '../../shared/hooks/useWaiterScope';

export function useServiceTables(enabled = true) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'tables'],
    queryFn: ({ signal }) => waiterService.tables(signal),
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useOpenTable() {
  const refresh = useRefreshWaiterData();
  return useMutation({ mutationFn: waiterService.openTable, onSuccess: refresh });
}
