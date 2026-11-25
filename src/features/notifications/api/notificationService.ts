import type { AxiosInstance } from 'axios';
import type {
  NotificationDetails,
  NotificationQuery,
  StaffNotification,
} from '../types/types';

type Envelope<T> = { isSuccess: boolean; message: string; result: T };
type NotificationPage = { items: StaffNotification[]; totalCount: number };

export function createNotificationService(
  client: Pick<AxiosInstance, 'get' | 'patch'>,
) {
  function unwrap<T>(data: Envelope<T>): T {
    if (!data.isSuccess)
      throw new Error(data.message || 'Không thể xử lý thông báo.');
    return data.result;
  }
  return {
    async list(query: NotificationQuery = {}, signal?: AbortSignal) {
      const items = new Map<string, StaffNotification>();
      let loaded = 0;
      for (let page = 1; ; page++) {
        const result = unwrap(
          (
            await client.get<Envelope<NotificationPage>>(
              '/api/notifications',
              { signal, params: { ...query, page, pageSize: 100 } },
            )
          ).data,
        );
        result.items.forEach((item) => items.set(item.id, item));
        loaded += result.items.length;
        if (!result.items.length || loaded >= result.totalCount) break;
      }
      return [...items.values()].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    },
    async unreadCount(signal?: AbortSignal) {
      return unwrap(
        (
          await client.get<Envelope<{ count: number }>>(
            '/api/notifications/unread-count',
            { signal },
          )
        ).data,
      ).count;
    },
    async detail(id: string, signal?: AbortSignal) {
      return unwrap(
        (
          await client.get<Envelope<NotificationDetails>>(
            `/api/notifications/${id}`,
            { signal },
          )
        ).data,
      );
    },
    async markRead(id: string) {
      unwrap(
        (await client.patch<Envelope<null>>(`/api/notifications/${id}/read`))
          .data,
      );
    },
    async markAllRead() {
      unwrap(
        (await client.patch<Envelope<null>>('/api/notifications/read-all'))
          .data,
      );
    },
  };
}
