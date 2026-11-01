import { useMutation, useQuery } from '@tanstack/react-query';
import { tablesApi } from '../api/tablesApi';
import {
  useRefreshWaiterData,
  useWaiterScope,
} from '../../shared/hooks/useWaiterScope';

export function useServiceTables(enabled = true) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'tables'],
    queryFn: ({ signal }) => tablesApi.tables(signal),
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useOpenTable() {
  const refresh = useRefreshWaiterData();
  return useMutation({
    mutationFn: tablesApi.openTable,
    onSuccess: refresh,
  });
}
