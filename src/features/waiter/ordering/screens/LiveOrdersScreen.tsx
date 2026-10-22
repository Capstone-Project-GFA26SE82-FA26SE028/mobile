import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Chips, Empty, Notice, Page, Sheet, Title } from '../../shared/components/UI';
import { ui } from '../../shared/theme';
import { OrderCard } from '../components/OrderCard';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useSessionOrders, useOrderActions, useOrderDetail } from '../hooks/useOrders';
import type { Order } from '../../api/types';

export default function LiveOrdersScreen() {
  const tables = useServiceTables();
  const sessionIds = (tables.data ?? []).flatMap(t => t.openSessionIds);
  const orders = useSessionOrders(sessionIds);
  const [tab, setTab] = useState('Chờ xác nhận');
  const [review, setReview] = useState<Order | null>(null);
  const [checked, setChecked] = useState(false);
  const detail = useOrderDetail(review);
  const { confirm } = useOrderActions();
  const rows = (orders.data ?? []).filter(o => o.source === 'Guest' &&
    o.status === (tab === 'Chờ xác nhận' ? 'PendingConfirmation' : 'Confirmed'));
  const changed = !!review && (detail.data?.version !== review.version || detail.data?.status !== review.status);
  return <Page>
    <Title title="Xác nhận đơn khách" subtitle="Kiểm tra món, số lượng và ghi chú trước khi chuyển bếp." />
    <QueryStatus query={tables} />
    {!!sessionIds.length && <QueryStatus query={orders} />}
    <Chips options={['Chờ xác nhận', 'Đã xác nhận']} value={tab} onChange={setTab} />
    {rows.map(order => <OrderCard key={order.orderId} order={order}>
      <Text style={ui.body}>{tables.data?.filter(t => t.openSessionIds.includes(order.tableSessionId)).map(t => t.tableCode).join(', ')}</Text>
      <Button title="Kiểm tra chi tiết" onPress={() => { confirm.reset(); setChecked(false); setReview(order); }} />
    </OrderCard>)}
    {tables.isSuccess && (!sessionIds.length || orders.isSuccess) && !rows.length && <Empty text="Không có đơn khách trong mục này." />}
    {review && <Sheet title="Kiểm tra order" onClose={() => { if (!confirm.isPending) setReview(null); }}>
      <QueryStatus query={detail} />
      <OrderCard order={review} />
      {changed && detail.isSuccess && <Notice error text="Order đã thay đổi. Đóng và mở lại để kiểm tra dữ liệu mới." />}
      {review.status === 'PendingConfirmation' && <>
        <Button secondary title={checked ? '✓ Đã kiểm tra bàn, món và ghi chú' : 'Tôi đã kiểm tra bàn, món và ghi chú'} onPress={() => setChecked(!checked)} />
        <Button title={confirm.isPending ? 'Đang xác nhận…' : 'Xác nhận và chuyển bếp'}
          disabled={!checked || changed || !detail.isSuccess || confirm.isPending}
          onPress={() => confirm.mutate(review, { onSuccess: () => setReview(null) })} />
        {confirm.isError && <QueryStatus query={{ error: confirm.error, isPending: false, refetch: () => { void detail.refetch(); } }} />}
      </>}
    </Sheet>}
  </Page>;
}

