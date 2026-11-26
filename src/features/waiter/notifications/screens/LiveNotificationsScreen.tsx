import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { authError } from '@/features/auth/api/authApi';
import {
  Button,
  Empty,
  Page,
  Sheet,
  Title,
  Notice,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import {
  useNotificationDetails,
  useNotifications,
  useReadNotification,
  useUnreadNotifications,
} from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';

const tabs = ['Tất cả', 'Chưa xem', 'Đã xem'] as const;

export default function LiveNotificationsScreen() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Tất cả');
  const [selected, setSelected] = useState<string | null>(null);
  const feed = useNotifications();
  const count = useUnreadNotifications();
  const details = useNotificationDetails(selected);
  const read = useReadNotification();
  const lock = useRef(false);
  const router = useRouter();
  const rows = (feed.data ?? []).filter(
    (item) =>
      tab === 'Tất cả' || (tab === 'Chưa xem' ? !item.readAt : !!item.readAt),
  );
  async function mark(id: string | null) {
    if (lock.current) return;
    lock.current = true;
    try {
      await read.mutateAsync(id);
    } catch {
      /* Error shown below. */
    } finally {
      lock.current = false;
    }
  }
  const item = details.data?.notification;
  const unread = count.data ?? feed.data?.filter((row) => !row.readAt).length ?? 0;
  return (
    <Page>
      <Title title="Thông báo" />
      <View accessibilityRole="tablist" className="flex-row gap-2 rounded-[16px] bg-[#E8EFEA] p-1">
        {tabs.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === option }}
            onPress={() => setTab(option)}
            className={`min-h-[42px] flex-1 items-center justify-center rounded-[12px] ${tab === option ? 'bg-white' : ''}`}
          >
            <Text className={`text-[13px] font-semibold ${tab === option ? 'text-[#12664C]' : 'text-[#53665B]'}`}>
              {option}
              {option === 'Chưa xem' && unread > 0 ? ` (${unread})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      {unread > 0 && (
        <Pressable
          accessibilityRole="button"
          disabled={read.isPending}
          onPress={() => void mark(null)}
          className="min-h-[44px] self-end justify-center rounded-[12px] border border-[#DDE8E0] bg-white px-3 disabled:opacity-50"
        >
          <Text className="text-[13px] font-semibold text-[#12664C]">Đánh dấu tất cả đã xem</Text>
        </Pressable>
      )}
      <QueryStatus query={feed} />
      <QueryStatus query={count} />
      {read.isError && <Notice error text={authError(read.error)} />}
      {rows.map((row) => (
        <NotificationCard
          key={row.id}
          item={row}
          busy={read.isPending}
          onRead={() => void mark(row.id)}
          onDetails={() => setSelected(row.id)}
        />
      ))}
      {feed.isSuccess && !rows.length && (
        <Empty text="Chưa có thông báo trong mục này." />
      )}
      {selected && (
        <Sheet title="Chi tiết thông báo" onClose={() => setSelected(null)}>
          <QueryStatus query={details} />
          {item && (
            <>
              <Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString('vi-VN')}
              />
              <Text className="text-[14px] text-[#183B32]">{item.message}</Text>
              {!item.readAt && (
                <Button
                  title="Đánh dấu đã xem"
                  disabled={read.isPending}
                  onPress={() => void mark(item.id)}
                />
              )}
              {item.type === 'DineInItemReady' && (
                <Button
                  title="Xem món chờ lên bàn"
                  onPress={() => {
                    setSelected(null);
                    router.push('/waiter/ready');
                  }}
                />
              )}
              {item.type === 'DineInOrderSubmitted' && (
                <Button
                  title="Xem đơn chờ xác nhận"
                  onPress={() => {
                    setSelected(null);
                    router.push('/waiter/orders');
                  }}
                />
              )}
              {item.type === 'CheckoutRequested' && (
                <Button
                  title="Xem yêu cầu thanh toán"
                  onPress={() => {
                    setSelected(null);
                    router.push('/waiter/requests');
                  }}
                />
              )}
            </>
          )}
          {read.isError && <Notice error text={authError(read.error)} />}
        </Sheet>
      )}
    </Page>
  );
}
