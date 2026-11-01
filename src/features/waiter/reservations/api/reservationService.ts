import type { AxiosInstance } from 'axios';
import type { Envelope, PageResult } from '../../shared/types/api';
import type {
  AvailabilityQuery,
  Reservation,
  ReservationAction,
  ReservationAvailability,
  ReservationStatus,
} from '../types/types';

export function createReservationService(
  client: Pick<AxiosInstance, 'get' | 'post' | 'put'>,
) {
  function unwrap<T>(data: Envelope<T>): T {
    if (!data.isSuccess)
      throw new Error(data.message || 'Không thể xử lý đặt bàn.');
    return data.result;
  }

  return {
    async list(status: ReservationStatus, signal?: AbortSignal) {
      const items: Reservation[] = [];
      for (let page = 1; ; page++) {
        const { data } = await client.get<Envelope<PageResult<Reservation>>>(
          '/api/reservations',
          {
            signal,
            params: { status, page, pageSize: 100 },
          },
        );
        const result = unwrap(data);
        items.push(...result.items);
        if (!result.items.length || items.length >= result.totalCount)
          return items;
      }
    },
    async detail(id: string, signal?: AbortSignal) {
      const { data } = await client.get<Envelope<Reservation>>(
        `/api/reservations/${id}`,
        { signal },
      );
      return unwrap(data);
    },
    async availability(params: AvailabilityQuery, signal?: AbortSignal) {
      const { data } = await client.get<Envelope<ReservationAvailability>>(
        '/api/reservations/availability',
        { signal, params },
      );
      return unwrap(data);
    },
    async act(request: ReservationAction) {
      const url = `/api/reservations/${request.id}`;
      if (request.action === 'update') {
        const { data } = await client.put<Envelope<Reservation>>(url, {
          startAt: request.startAt,
          tableIds: request.tableIds,
        });
        return unwrap(data);
      }
      const body =
        request.action === 'confirm'
          ? { tableIds: request.tableIds }
          : undefined;
      const { data } = await client.post<Envelope<Reservation>>(
        `${url}/${request.action}`,
        body,
      );
      return unwrap(data);
    },
  };
}
