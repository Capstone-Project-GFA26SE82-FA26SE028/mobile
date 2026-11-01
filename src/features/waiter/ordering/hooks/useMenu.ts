import { useQuery } from '@tanstack/react-query';
import { orderingApi } from '../api/orderingApi';
import { useWaiterScope } from '../../shared/hooks/useWaiterScope';

export function useWaiterMenu() {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'menu'],
    queryFn: ({ signal }) => orderingApi.menu(signal),
    retry: 1,
  });
}

export function useMenuItem(itemId: string | null) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'menu-item', itemId],
    queryFn: ({ signal }) => orderingApi.menuItem(itemId!, signal),
    enabled: !!itemId,
    staleTime: 0,
  });
}
