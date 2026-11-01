import type { AxiosInstance } from 'axios';
import type { MenuItem, Order, Selection } from '../types/api';
import { createWaiterTransport } from '../../shared/api/waiterTransport';

export function createOrderingService(
  client: Pick<AxiosInstance, 'get' | 'post'>,
) {
  const { get, post, pages } = createWaiterTransport(client);
  return {
    menu: (signal?: AbortSignal) => pages<MenuItem>('/api/menu', signal),
    menuItem: (id: string, signal?: AbortSignal) =>
      get<MenuItem>(`/api/menu/${id}`, signal),
    async orders(sessionId: string, signal?: AbortSignal): Promise<Order[]> {
      const rows: Order[] = [];
      for (let page = 1; ; page++) {
        const result = await get<Order[]>(
          `/api/table-sessions/${sessionId}/orders`,
          signal,
          { page, pageSize: 100 },
        );
        rows.push(...result);
        if (result.length < 100) return rows;
      }
    },
    order: (sessionId: string, id: string, signal?: AbortSignal) =>
      get<Order>(`/api/table-sessions/${sessionId}/orders/${id}`, signal),
    createOrder: (
      sessionId: string,
      tableId: string,
      items: Selection[],
      key: string,
    ) =>
      post<Order>(
        `/api/table-sessions/${sessionId}/orders`,
        { tableId, items },
        key,
      ),
    confirmOrder: (order: Order) =>
      post<Order>(
        `/api/table-sessions/${order.tableSessionId}/orders/${order.orderId}/confirm`,
        { version: order.version },
      ),
  };
}
