import { useMutation, useQuery } from '@tanstack/react-query';
import { useWaiterScope, useRefreshWaiterData } from '../../shared/hooks/useWaiterScope';
import { useServiceTables } from '../../tables/hooks/useTables';
import { collectionApi } from '../api/collectionApi';
export function usePaymentRequests() {
    const tables = useServiceTables();
    const restaurants = [...new Set(tables.data?.map(t => t.restaurantId) ?? [])].sort();
    return useCollectionQuery('requests:' + restaurants.join(','), async (signal) => (await Promise.all(restaurants.map(id => collectionApi.list(id, signal)))).flat(), restaurants.length > 0);
}
export function useCollectionQuery<T>(key: string, fetch: (signal: AbortSignal) => Promise<T>, enabled = true) {
    const scope = useWaiterScope();
    return useQuery({ queryKey: [...scope, 'cash-collection', key], queryFn: ({ signal }) => fetch(signal), enabled, refetchInterval: 5000, retry: false });
}
export function useCollectionAction() {
    const refresh = useRefreshWaiterData();
    return useMutation({ mutationFn: (action: () => Promise<unknown>) => action(), onSettled: refresh, retry: false });
}
