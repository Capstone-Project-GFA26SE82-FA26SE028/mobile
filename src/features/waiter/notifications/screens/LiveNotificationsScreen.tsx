import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { authError } from '@/features/auth/api/authApi';
import {
  Badge,
  Button,
  Empty,
  Page,
  Sheet,
  Title,
  Notice,
  Chips,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import {
  useNotificationDetails,
  useNotifications,
  useReadNotification,
  useUnreadNotifications,
} from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { SoundControls } from '../components/SoundControls';

export default function LiveNotificationsScreen() {
  const [tab, setTab] = useState('Tất cả');
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
  return (
    <Page>
      <Title
        title="Thông báo"
        subtitle="Đơn hàng, món sẵn sàng và yêu cầu của khách."
        action={<Badge text={`${count.data ?? 0} chưa xem`} tone="amber" />}
      />
      <SoundControls />
      <Chips
        options={['Tất cả', 'Chưa xem', 'Đã xem']}
        value={tab}
        onChange={setTab}
      />
      <Button
        title="Đánh dấu tất cả đã xem"
        secondary
        disabled={read.isPending || !count.data}
        onPress={() => void mark(null)}
      />
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
      <Text className="text-[11px] text-[#7C8983] text-center">
        Cập nhật mỗi 5 giây khi ứng dụng đang mở.
      </Text>
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
