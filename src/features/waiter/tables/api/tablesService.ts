import type { AxiosInstance } from 'axios';
import type {
  ServiceTable,
  TableSession,
  TableTransferRequest,
  TableTransferResult,
} from '../types/types';
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
    transfer: ({
      sessionId,
      mode,
      targetTableId,
      reason,
      items,
      key,
    }: TableTransferRequest) =>
      post<TableTransferResult>(
        `/api/table-sessions/${sessionId}/${mode}`,
        mode === 'split'
          ? { targetTableId, reason, items }
          : { targetTableId, reason },
        key,
      ),
    transferStatus: (id: string, signal?: AbortSignal) =>
      get<TableTransferResult>(`/api/table-transfers/${id}`, signal),
  };
}
