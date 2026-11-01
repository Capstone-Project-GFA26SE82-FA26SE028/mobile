import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Badge, Card, Chips, Empty, Icon, Notice, Page, Title } from '../../shared/components/UI';
import { ui } from '../../shared/theme';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useSessionOrders } from '../../ordering/hooks/useOrders';
import { useWaiterMenu } from '../../ordering/hooks/useMenu';

export default function LiveReadyScreen() {
  const tables = useServiceTables();
  const ids = (tables.data ?? []).flatMap(t => t.openSessionIds);
  const orders = useSessionOrders(ids);
  const menu = useWaiterMenu();
  const [tab, setTab] = useState('Chờ lên món');
  const ready = (orders.data ?? []).flatMap(o => o.items.filter(i => i.status === 'Ready').map(line => ({ line, order: o })));
  const rows = (orders.data ?? []).flatMap(o => o.items.filter(i => i.status === (tab === 'Chờ lên món' ? 'Ready' : 'Served')).map(line => ({ line, order: o })));
  return <Page><Title title="Món chờ phục vụ" subtitle="Món ngon đã sẵn sàng, mang đến khách thôi." action={<Badge text={`${ready.length} món`} tone="amber" />} />
    <Chips options={['Chờ lên món', 'Đã phục vụ']} value={tab} onChange={setTab} />
    <QueryStatus query={tables} />
    {!!ids.length && <QueryStatus query={orders} />}
    {rows.map(({ line, order }) => {
      const image = menu.data?.find(item => item.itemId === line.itemId)?.imageUrl;
      return <Card key={line.orderItemId}>
        <View style={ui.between}>
          <Text style={ui.h2}>{tables.data?.filter(t => t.openSessionIds.includes(order.tableSessionId)).map(t => t.tableCode).join(', ')}</Text>
          <Badge text={line.status === 'Ready' ? 'Sẵn sàng' : 'Đã phục vụ'} tone={line.status === 'Ready' ? 'amber' : 'green'} />
        </View>
        <View style={ui.row}>
          {image ? <Image source={{ uri: image }} style={ui.image} /> : <View style={[ui.image, { alignItems: 'center', justifyContent: 'center' }]}><Icon name="restaurant-outline" /></View>}
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[ui.body, { fontWeight: '700' }]}>{line.nameSnapshot}</Text>
            <Text style={ui.muted}>Tổng {line.quantity} phần</Text>
            {!!line.note && <Text style={ui.muted}>{line.note}</Text>}
          </View>
        </View>
      </Card>;
    })}
    {tables.isSuccess && (!ids.length || orders.isSuccess) && !rows.length && <Empty text={tab === 'Chờ lên món' ? 'Đã phục vụ hết món sẵn sàng. Hãy tiếp tục theo dõi bếp.' : 'Chưa có món được xác nhận đã lên bàn.'} />}
    <Notice text="Trạng thái món cập nhật mỗi 5 giây. Hiện chưa thể xác nhận lên món trên ứng dụng." />
  </Page>;
}
