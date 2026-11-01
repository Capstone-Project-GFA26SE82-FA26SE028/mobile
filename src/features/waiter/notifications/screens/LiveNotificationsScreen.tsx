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
import { colors, ui } from '../../shared/utils/theme';
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
            <View style={ui.between}>
              <View style={[ui.row, { flex: 1 }]}>
                <View
                  style={{
                    backgroundColor: colors.mint,
                    padding: 10,
                    borderRadius: 12,
                  }}
                >
                  <Icon name="restaurant-outline" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ui.h2}>
                    {table?.tableCode || 'Phiên phục vụ'}
                  </Text>
                  <Text style={ui.small}>Món đã sẵn sàng</Text>
                </View>
              </View>
              <Badge text="Chờ lên món" tone="amber" />
            </View>
            <Text style={[ui.body, { fontWeight: '600' }]}>
              {item.quantity} × {item.nameSnapshot}
            </Text>
            {!!item.note && <Text style={ui.muted}>{item.note}</Text>}
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
      <Text style={[ui.small, { textAlign: 'center' }]}>
        Cập nhật trạng thái từ bếp mỗi 5 giây
      </Text>
    </Page>
  );
}
