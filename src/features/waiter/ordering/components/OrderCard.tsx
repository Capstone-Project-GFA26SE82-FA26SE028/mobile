import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Badge, Card, Notice, Title } from '../../shared/components/UI';
import { money } from '../../shared/utils/rules';
import type { Order } from '../types/api';

const statuses: Record<string, string> = {
  PendingConfirmation: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Pending: 'Chờ chế biến',
  Cooking: 'Đang chế biến',
  Ready: 'Sẵn sàng',
  Served: 'Đã phục vụ',
  Cancelled: 'Đã hủy',
};
export function OrderCard({
  order,
  children,
}: {
  order: Order;
  children?: ReactNode;
}) {
  return (
    <Card>
      <Title
        title={order.orderNumber}
        subtitle={`${statuses[order.status] || order.status} · ${new Date(order.createdAt).toLocaleString('vi-VN')}`}
      />
      {order.items.map((line) => (
        <View key={line.orderItemId} className="gap-[5px]">
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text
              className="text-[14px] leading-[21px] text-[#183B32] font-[700]"
              style={{ flex: 1 }}
            >
              {line.quantity} × {line.nameSnapshot}
            </Text>
            <Text className="text-[#12664C] text-[13px] font-[600]">
              {money(line.lineTotal)}
            </Text>
          </View>
          {line.options.map((option) => (
            <Text
              key={option.optionId}
              className="text-[11px] leading-[16px] text-[#7C8983]"
            >
              {option.quantity} × {option.name}
            </Text>
          ))}
          {!!line.note && <Notice text={`Ghi chú: ${line.note}`} />}
          <Badge
            text={statuses[line.status] || line.status}
            tone={
              line.status === 'Ready'
                ? 'amber'
                : line.status === 'Cancelled'
                  ? 'gray'
                  : 'green'
            }
          />
        </View>
      ))}
      <Text className="text-[#12664C] text-[18px] font-[700]">
        {money(order.totalAmount)}
      </Text>
      {children}
    </Card>
  );
}
