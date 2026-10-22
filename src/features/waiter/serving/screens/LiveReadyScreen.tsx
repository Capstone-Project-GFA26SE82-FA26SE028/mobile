import { Empty, Notice, Page, Title } from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useSessionOrders } from '../../ordering/hooks/useOrders';

export default function LiveReadyScreen() {
  const tables = useServiceTables();
  const ids = (tables.data ?? []).flatMap(t => t.openSessionIds);
  const orders = useSessionOrders(ids);
  const ready = (orders.data ?? []).flatMap(o => o.items.filter(i => i.status === 'Ready').map(line => ({ line, order: o })));
  return <Page><Title title="Món sẵn sàng" subtitle="Theo dõi trạng thái món từ backend, cập nhật mỗi 5 giây." />
    <QueryStatus query={tables} />
    {!!ids.length && <QueryStatus query={orders} />}
    {ready.map(({ line, order }) => <Notice key={line.orderItemId} text={`${tables.data?.filter(t => t.openSessionIds.includes(order.tableSessionId)).map(t => t.tableCode).join(', ')} · ${line.quantity} × ${line.nameSnapshot}${line.note ? ` · ${line.note}` : ''}`} />)}
    {tables.isSuccess && (!ids.length || orders.isSuccess) && !ready.length && <Empty text="Chưa có món sẵn sàng." />}
    <Notice text="Chưa hỗ trợ xác nhận đã lên món hoặc push notification." />
  </Page>;
}
