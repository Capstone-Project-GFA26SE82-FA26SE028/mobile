import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import { Badge, Button, Card, Empty, Notice, Page, Title } from '../../shared/components/UI';
import { ui } from '@/features/waiter/shared/theme';
import { money } from '../../shared/rules';
import { useServiceTables, useOpenTable } from '../hooks/useTables';
import { useSessionOrders } from '../../ordering/hooks/useOrders';
import { OrderCard } from '../../ordering/components/OrderCard';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { cartId } from '../../ordering/cartSlice';

export default function LiveTableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tables = useServiceTables();
  const table = tables.data?.find(t => t.tableId === id);
  const sessions = table?.openSessionIds ?? [];
  const orders = useSessionOrders(sessions);
  const open = useOpenTable();
  const rows = orders.data ?? [];
  const carts = useAppSelector(s => s.waiterCart.carts);
  return <Page>
    <Title title={table?.tableCode || 'Chi tiết bàn'} subtitle={table?.areaName} action={table ? <Badge text={sessions.length ? 'Có khách' : table.cleaningStatus === 'Clean' ? 'Trống' : 'Cần dọn'} /> : undefined} />
    <QueryStatus query={tables} />
    {tables.isSuccess && !table && <Empty text="Bàn không tồn tại hoặc không còn phục vụ." />}
    {table && <>
      {!sessions.length && <Button title={open.isPending ? 'Đang mở phiên…' : 'Mở phiên phục vụ'} disabled={open.isPending}
        onPress={() => open.mutate(table.tableId)} />}
      {open.isError && <QueryStatus query={{ error: open.error, isPending: false, refetch: () => open.mutate(table.tableId) }} />}
      {sessions.length > 0 && <>
        <Card>
          <View style={ui.between}><Text style={ui.h2}>Phiên phục vụ</Text><Badge text="Đang mở" /></View>
          <Text style={ui.muted}>{table.areaName} · {sessions.length} phiên đang mở</Text>
          <Button title="Gọi thêm món" icon="add" onPress={() => router.push({ pathname: '/waiter/order/[id]', params: { id: table.tableId } })} />
        </Card>
        {sessions.filter(sessionId => carts[cartId(table.tableId, sessionId)]?.lines.length).map(sessionId => (
          <Button key={sessionId} secondary icon="cart-outline"
            title={`Giỏ đặt hộ · ${carts[cartId(table.tableId, sessionId)].lines.reduce((sum, line) => sum + line.quantity, 0)} phần`}
            onPress={() => router.push({ pathname: '/waiter/cart/[id]', params: { id: table.tableId, sessionId } })} />
        ))}
        <QueryStatus query={orders} />
        <View style={ui.between}><Text style={ui.h2}>Món đã gọi</Text><Text style={ui.muted}>{rows.reduce((sum, order) => sum + order.items.length, 0)} dòng món</Text></View>
        {rows.map(order => <OrderCard key={order.orderId} order={order} />)}
        {orders.isSuccess && !rows.length && <Empty text="Phiên bàn chưa có order." />}
        {orders.isSuccess && <Text style={ui.money}>Tổng món đã xác nhận: {money(rows.filter(o => o.status === 'Confirmed').reduce((sum, o) => sum + o.totalAmount, 0))}</Text>}
      </>}
      <Notice text="Đổi bàn, sửa/hủy món và thu hộ tiền chưa được hỗ trợ. Tổng món chưa bao gồm thuế/phí hoặc xác nhận thanh toán." />
    </>}
  </Page>;
}
