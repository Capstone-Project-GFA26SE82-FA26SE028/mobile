import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../../app/hooks';
import { notificationApi } from '@/features/notifications/api/notificationApi';

import { useBell } from '@/features/waiter/notifications/hooks/useBell';

export function useInventoryUnread(poll = false) {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery({
    queryKey: ['inventory-notifications', user?.id, 'unread'],
    queryFn: ({ signal }) => notificationApi.unreadCount(signal),
    enabled: user?.role === 'inventory',
    refetchInterval: poll ? 15_000 : false,
  });
}

export function useInventoryNotificationSound() {
  const user = useAppSelector((state) => state.auth.user);
  const enabled = user?.role === 'inventory';
  const unread = useInventoryUnread(true);
  const playBell = useBell();
  const previousUnread = useRef<{ userId: string; count: number } | null>(null);
  useEffect(() => {
    if (!enabled || !user?.id) {
      previousUnread.current = null;
      return;
    }
    if (unread.data === undefined) return;

    const previous = previousUnread.current;
    previousUnread.current = { userId: user.id, count: unread.data };
    if (previous?.userId === user.id && unread.data > previous.count) {
      void playBell().catch(() => {});
    }
  }, [enabled, user?.id, unread.data, playBell]);
}

export function useInventoryNotifications() {
  const user = useAppSelector((state) => state.auth.user);
  const key = ['inventory-notifications', user?.id];
  const client = useQueryClient();
  const feed = useQuery({
    queryKey: [...key, 'list'],
    queryFn: ({ signal }) => notificationApi.list({}, signal),
    enabled: user?.role === 'inventory',
    refetchInterval: 15_000,
  });
  const read = useMutation({
    mutationFn: (id: string | null) =>
      id === null
        ? notificationApi.markAllRead()
        : notificationApi.markRead(id),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
  return { feed, read };
}
