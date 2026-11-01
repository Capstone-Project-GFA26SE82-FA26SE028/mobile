import type { AxiosInstance } from 'axios';
import type { ServiceTable, TableSession } from '../types/types';
import { createWaiterTransport } from '../../shared/api/waiterTransport';

export function createTableService(
  client: Pick<AxiosInstance, 'get' | 'post'>,
) {
  const { get, post, pages } = createWaiterTransport(client);
  return {
    tables: (signal?: AbortSignal) =>
      pages<ServiceTable>('/api/tables/service', signal),
    openTable: (id: string) =>
      post<TableSession>(`/api/table-sessions/tables/${id}/open`),
  };
}
