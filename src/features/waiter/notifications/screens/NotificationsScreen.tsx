import LiveNotificationsScreen from './LiveNotificationsScreen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Icon,
  Notice,
  Page,
  Title,
} from '../../shared/components/UI';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
import { minutes, time } from '../../shared/utils/rules';
import { colors } from '../../shared/utils/theme';
import { kitchenReady } from '../../shared/store/waiterSlice';

function DemoNotificationsScreen() {
  const state = useAppSelector((s) => s.waiter);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const now = useNow();
  const [tab, setTab] = useState('Chưa xem');
  const unread = state.items.filter((i) => i.status === 'Ready' && !i.seen);
  const rows = state.items
    .filter(
      (i) =>
        i.readyAt &&
        (tab === 'Chưa xem' ? i.status === 'Ready' && !i.seen : i.seen),
    )
    .sort((a, b) => (b.readyAt || 0) - (a.readyAt || 0));
  const demoItem = state.items.find(
    (i) =>
      (i.status === 'Cooking' ||
        i.status === 'Pending' ||
        i.status === 'Sent') &&
      state.tables.some((t) => t.active && t.sessionId === i.sessionId),
  );

  return (
    <Page>
      <Title
        title="Thông báo từ bếp"
        subtitle="Món đã sẵn sàng, đừng để khách chờ lâu."
        action={<Badge text={`${unread.length} mới`} tone="amber" />}
      />
      <Notice
        text={
          state.alerts
            ? 'Đang bật rung: nhắc ngay khi có món mới và mỗi 30 giây nếu còn món chưa xem, khi ứng dụng đang mở.'
            : 'Rung đang tắt. Bạn có thể bật tại tab Cá nhân; thông báo vẫn xuất hiện trong ứng dụng.'
        }
      />
      <Chips options={['Chưa xem', 'Đã xem']} value={tab} onChange={setTab} />
      {rows.map((item) => {
        const table = state.tables.find((t) => t.sessionId === item.sessionId);
        return (
          <Card key={item.id}>
            <View className="flex-row items-center justify-between gap-[10px]">
              <View
                className="flex-row items-center gap-[10px]"
                style={{ flex: 1 }}
              >
                <View className="bg-[#EAF5EF] p-[10px] rounded-[12px]">
                  <Icon name="restaurant-outline" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-[17px] font-[700] text-[#183B32]">
                    {table?.name || 'Phiên đã đóng'}
                  </Text>
                  <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                    {time(item.readyAt!)} · {minutes(item.readyAt!, now)} phút
                    trước
                  </Text>
                </View>
              </View>
              <Badge
                text={item.seen ? 'Đã xem' : 'Mới'}
                tone={item.seen ? 'gray' : 'amber'}
              />
            </View>
            <Text className="text-[14px] leading-[21px] text-[#183B32] font-[700]">
              {item.quantity} × {item.name}
            </Text>
            {!!item.note && <Notice text={`Ghi chú: ${item.note}`} />}
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              {item.status === 'Served'
                ? 'Đã lên đủ món.'
                : `Còn ${item.quantity - item.served} phần cần mang ra bàn.`}
            </Text>
            {!item.seen && (
              <Button
                title={`Đã xem · ${item.name}`}
                secondary
                onPress={() => {
                  runCommand({ type: 'seen', itemId: item.id });
                }}
              />
            )}
            {item.status === 'Ready' && (
              <Button
                title="Xem và xác nhận lên món"
                icon="checkmark-circle-outline"
                onPress={() => {
                  runCommand({ type: 'seen', itemId: item.id });
                  router.push('/waiter/ready');
                }}
              />
            )}
          </Card>
        );
      })}
      {!rows.length && (
        <Empty
          text={
            tab === 'Chưa xem'
              ? 'Bạn đã xem hết thông báo món sẵn sàng.'
              : 'Chưa có thông báo đã xem.'
          }
        />
      )}
      <Card>
        <Text className="text-[17px] font-[700] text-[#183B32]">
          Thử thông báo từ bếp
        </Text>
        <Text className="text-[12px] leading-[19px] text-[#7C8983]">
          Dữ liệu mẫu: chuyển một món đang chờ/đang chế biến sang Ready để thử
          thông báo. Không gửi yêu cầu tới bếp thật.
        </Text>
        <Button
          title={
            demoItem
              ? `Giả lập bếp hoàn thành · ${demoItem.name}`
              : 'Không còn món để thử'
          }
          secondary
          disabled={!demoItem}
          onPress={() => {
            if (!demoItem) return;
            const table = state.tables.find(
              (t) => t.sessionId === demoItem.sessionId,
            );
            if (!table) return;
            dispatch(
              kitchenReady({
                tableId: table.id,
                itemId: demoItem.id,
                quantity: demoItem.quantity,
                note: demoItem.note,
                now: Date.now(),
              }),
            );
            setTab('Chưa xem');
          }}
        />
      </Card>
      <Text className="text-[11px] leading-[16px] text-[#7C8983] text-center">
        Thông báo trong ứng dụng · Chưa kết nối push hoặc sự kiện bếp thật
      </Text>
    </Page>
  );
}

export default function NotificationsScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveNotificationsScreen /> : <DemoNotificationsScreen />;
}
