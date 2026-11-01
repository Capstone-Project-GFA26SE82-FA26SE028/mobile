import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Badge, Card, Notice, Title } from '../../shared/components/UI';
import { money } from '../../shared/rules';
import { ui } from '../../shared/theme';
import type { Order } from '../../api/types';

const statuses: Record<string, string> = {
  PendingConfirmation: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Pending: 'Chờ chế biến',
  Cooking: 'Đang chế biến', Ready: 'Sẵn sàng', Served: 'Đã phục vụ', Cancelled: 'Đã hủy',
};
export function OrderCard({ order, children }: { order: Order; children?: ReactNode }) {
  return <Card>
    <Title title={order.orderNumber} subtitle={`${statuses[order.status] || order.status} · ${new Date(order.createdAt).toLocaleString('vi-VN')}`} />
    {order.items.map(line => <View key={line.orderItemId} style={{ gap: 5 }}>
      <View style={ui.between}>
        <Text style={[ui.body, { fontWeight: '700', flex: 1 }]}>{line.quantity} × {line.nameSnapshot}</Text>
        <Text style={ui.link}>{money(line.lineTotal)}</Text>
      </View>
      {line.options.map(option => <Text key={option.optionId} style={ui.small}>{option.quantity} × {option.name}</Text>)}
      {!!line.note && <Notice text={`Ghi chú: ${line.note}`} />}
      <Badge text={statuses[line.status] || line.status} tone={line.status === 'Ready' ? 'amber' : line.status === 'Cancelled' ? 'gray' : 'green'} />
    </View>)}
    <Text style={ui.money}>{money(order.totalAmount)}</Text>
    {children}
  </Card>;
}
