import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { useWaiterScope } from '../../shared/hooks/useWaiterScope';
import { notificationApi } from '../api/notificationApi';

export function useNotificationAccess() {
  const enabled = useAppSelector(
    (s) => s.waiter.authMode === 'api' && s.waiter.signedIn,
  );
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (value) =>
      setActive(value === 'active'),
    );
    return () => subscription.remove();
  }, []);
  return enabled && active;
}
export function useNotifications() {
  const scope = useWaiterScope();
  const enabled = useNotificationAccess();
  return useQuery({
    queryKey: [...scope, 'notifications', 'list'],
    queryFn: ({ signal }) => notificationApi.list({}, signal),
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });
}
export function useUnreadNotifications() {
  const scope = useWaiterScope();
  const enabled = useNotificationAccess();
  return useQuery({
    queryKey: [...scope, 'notifications', 'unread'],
    queryFn: ({ signal }) => notificationApi.unreadCount(signal),
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });
}
export function useNotificationDetails(id: string | null) {
  const scope = useWaiterScope();
  const enabled = useNotificationAccess();
  return useQuery({
    queryKey: [...scope, 'notifications', 'detail', id],
    queryFn: ({ signal }) => notificationApi.detail(id!, signal),
    enabled: enabled && !!id,
  });
}
export function useReadNotification() {
  const scope = useWaiterScope();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string | null) =>
      id ? notificationApi.markRead(id) : notificationApi.markAllRead(),
    onSettled: () =>
      client.invalidateQueries({ queryKey: [...scope, 'notifications'] }),
    retry: false,
  });
}
