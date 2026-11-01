import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Empty,
  Icon,
  Page,
  Title,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { colors } from '../../shared/utils/theme';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useSessionOrders } from '../../ordering/hooks/useOrders';

export default function LiveNotificationsScreen() {
  const router = useRouter();
  const tables = useServiceTables();
  const ids = (tables.data ?? []).flatMap((table) => table.openSessionIds);
  const orders = useSessionOrders(ids);
  const rows = (orders.data ?? []).flatMap((order) =>
    order.items
      .filter((item) => item.status === 'Ready')
      .map((item) => ({ item, order })),
  );
  return (
    <Page>
      <Title
        title="Thông báo từ bếp"
        subtitle="Món đã sẵn sàng, đừng để khách chờ lâu."
        action={<Badge text={`${rows.length} món`} tone="amber" />}
      />
      <QueryStatus query={tables} />
      {!!ids.length && <QueryStatus query={orders} />}
      {rows.map(({ item, order }) => {
        const table = tables.data?.find((t) =>
          t.openSessionIds.includes(order.tableSessionId),
        );
        return (
          <Card key={item.orderItemId}>
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
                    {table?.tableCode || 'Phiên phục vụ'}
                  </Text>
                  <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                    Món đã sẵn sàng
                  </Text>
                </View>
              </View>
              <Badge text="Chờ lên món" tone="amber" />
            </View>
            <Text className="text-[14px] leading-[21px] text-[#183B32] font-[600]">
              {item.quantity} × {item.nameSnapshot}
            </Text>
            {!!item.note && (
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                {item.note}
              </Text>
            )}
            <Button
              title="Xem món chờ phục vụ"
              secondary
              icon="restaurant-outline"
              onPress={() => router.push('/waiter/ready')}
            />
          </Card>
        );
      })}
      {tables.isSuccess &&
        (!ids.length || orders.isSuccess) &&
        !rows.length && <Empty text="Chưa có thông báo món sẵn sàng." />}
      <Text className="text-[11px] leading-[16px] text-[#7C8983] text-center">
        Cập nhật trạng thái từ bếp mỗi 5 giây
      </Text>
    </Page>
  );
}
