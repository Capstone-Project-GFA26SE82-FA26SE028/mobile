import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Card, Notice, Title } from '../../shared/components/UI';
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
      <Text style={ui.body}>{line.quantity} × {line.nameSnapshot} · {money(line.lineTotal)}</Text>
      {line.options.map(option => <Text key={option.optionId} style={ui.small}>{option.quantity} × {option.name}</Text>)}
      {!!line.note && <Notice text={`Ghi chú: ${line.note}`} />}
      <Text style={ui.small}>{statuses[line.status] || line.status}</Text>
    </View>)}
    <Text style={ui.money}>{money(order.totalAmount)}</Text>
    {children}
  </Card>;
}
