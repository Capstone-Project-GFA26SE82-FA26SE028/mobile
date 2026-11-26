import { useMutation, useQuery } from '@tanstack/react-query';
import { orderingApi } from '../api/orderingApi';
import type { Order, Selection } from '../types/api';
import {
  useRefreshWaiterData,
  useWaiterScope,
} from '../../shared/hooks/useWaiterScope';

export function useSessionOrders(sessionIds: string[]) {
  const scope = useWaiterScope();
  const ids = [...new Set(sessionIds)].sort();
  return useQuery({
    queryKey: [...scope, 'orders', ids],
    queryFn: async ({ signal }) =>
      (
        await Promise.all(ids.map((id) => orderingApi.orders(id, signal)))
      ).flat(),
    enabled: ids.length > 0,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useOrderDetail(order: Order | null) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'order', order?.orderId],
    queryFn: ({ signal }) =>
      orderingApi.order(order!.tableSessionId, order!.orderId, signal),
    enabled: !!order,
    staleTime: 0,
  });
}

export function useOrderActions() {
  const refresh = useRefreshWaiterData();
  const create = useMutation({
    mutationFn: (request: {
      sessionId: string;
      tableId: string;
      items: Selection[];
      key: string;
    }) =>
      orderingApi.createOrder(
        request.sessionId,
        request.tableId,
        request.items,
        request.key,
      ),
    onSuccess: refresh,
    retry: false,
  });
  const confirm = useMutation({
    mutationFn: (order: Order) => orderingApi.confirmOrder(order),
    onSettled: refresh,
    retry: false,
  });
  return { create, confirm };
}

export function useServeItem() {
  const refresh = useRefreshWaiterData();
  return useMutation({
    mutationFn: ({ order, orderItemId }: { order: Order; orderItemId: string }) =>
      orderingApi.serveItem(order, orderItemId),
    onSettled: refresh,
    retry: false,
  });
}

export function useCancelItem(sessionId: string, orderItemId: string) {
  const refresh = useRefreshWaiterData();
  return useMutation({
    mutationFn: (request: { quantity: number; reason: string; key: string }) =>
      orderingApi.cancelItem(
        sessionId,
        orderItemId,
        request.quantity,
        request.reason,
        request.key,
      ),
    onSettled: refresh,
    retry: false,
  });
}
