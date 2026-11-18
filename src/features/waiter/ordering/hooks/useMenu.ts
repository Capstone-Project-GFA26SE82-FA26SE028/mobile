import { useQuery } from '@tanstack/react-query';
import { orderingApi } from '../api/orderingApi';
import {
  useWaiterScope,
  useWaiterApiEnabled,
} from '../../shared/hooks/useWaiterScope';

export function useWaiterMenu() {
  const scope = useWaiterScope();
  const enabled = useWaiterApiEnabled();
  return useQuery({
    queryKey: [...scope, 'menu'],
    queryFn: ({ signal }) => orderingApi.menu(signal),
    enabled,
    retry: 1,
  });
}

export function useMenuItem(itemId: string | null) {
  const scope = useWaiterScope();
  const apiEnabled = useWaiterApiEnabled();
  return useQuery({
    queryKey: [...scope, 'menu-item', itemId],
    queryFn: ({ signal }) => orderingApi.menuItem(itemId!, signal),
    enabled: apiEnabled && !!itemId,
    staleTime: 0,
  });
}
