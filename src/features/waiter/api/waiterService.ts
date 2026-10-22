import type { AxiosInstance } from 'axios';
import type { Envelope, MenuItem, Order, PageResult, Selection, ServiceTable, TableSession } from './types';

// Inject the authenticated transport so contracts can be checked without a running backend.
export function createWaiterService(client: Pick<AxiosInstance, 'get' | 'post'>) {
  async function get<T>(url: string, signal?: AbortSignal, params?: object): Promise<T> {
    const { data } = await client.get<Envelope<T>>(url, { signal, params });
    if (!data.isSuccess) throw new Error(data.message || 'Không thể tải dữ liệu.');
    return data.result;
  }
  async function post<T>(url: string, body?: object, key?: string): Promise<T> {
    const { data } = await client.post<Envelope<T>>(url, body, {
      headers: key ? { 'Idempotency-Key': key } : undefined,
    });
    if (!data.isSuccess) throw new Error(data.message || 'Không thể thực hiện thao tác.');
    return data.result;
  }
  async function pages<T>(url: string, signal?: AbortSignal): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; ; page++) {
      const result = await get<PageResult<T>>(url, signal, { page, pageSize: 100 });
      items.push(...result.items);
      if (items.length >= result.totalCount || !result.items.length) return items;
    }
  }
  return {
    tables: (signal?: AbortSignal) => pages<ServiceTable>('/api/tables/service', signal),
    menu: (signal?: AbortSignal) => pages<MenuItem>('/api/menu', signal),
    menuItem: (id: string, signal?: AbortSignal) => get<MenuItem>(`/api/menu/${id}`, signal),
    openTable: (id: string) => post<TableSession>(`/api/table-sessions/tables/${id}/open`),
    async orders(sessionId: string, signal?: AbortSignal): Promise<Order[]> {
      const rows: Order[] = [];
      for (let page = 1; ; page++) {
        const result = await get<Order[]>(`/api/table-sessions/${sessionId}/orders`, signal, { page, pageSize: 100 });
        rows.push(...result);
        if (result.length < 100) return rows;
      }
    },
    order: (sessionId: string, id: string, signal?: AbortSignal) =>
      get<Order>(`/api/table-sessions/${sessionId}/orders/${id}`, signal),
    createOrder: (sessionId: string, tableId: string, items: Selection[], key: string) =>
      post<Order>(`/api/table-sessions/${sessionId}/orders`, { tableId, items }, key),
    confirmOrder: (order: Order) => post<Order>(
      `/api/table-sessions/${order.tableSessionId}/orders/${order.orderId}/confirm`, { version: order.version }),
  };
}
