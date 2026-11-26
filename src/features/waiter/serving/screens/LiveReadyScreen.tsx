import { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
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
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useSessionOrders, useServeItem } from '../../ordering/hooks/useOrders';
import { useWaiterMenu } from '../../ordering/hooks/useMenu';
import type { Order, OrderLine } from '../../ordering/types/api';
import { authError } from '@/features/auth/api/authApi';

export default function LiveReadyScreen() {
  const tables = useServiceTables();
  const ids = (tables.data ?? []).flatMap((t) => t.openSessionIds);
  const orders = useSessionOrders(ids);
  const menu = useWaiterMenu();
  const [tab, setTab] = useState('Chờ lên món');
  const [selected, setSelected] = useState<{ order: Order; line: OrderLine } | null>(null);
  const serve = useServeItem();
  const lock = useRef(false);
  async function confirmServing() {
    if (!selected || !selectionCurrent || lock.current) return;
    lock.current = true;
    try {
      await serve.mutateAsync({ order: selected.order, orderItemId: selected.line.orderItemId });
      setSelected(null);
    } catch {
      // Display the API error in the selected dish card.
    } finally {
      lock.current = false;
    }
  }
  const ready = (orders.data ?? []).flatMap((o) =>
    o.items
      .filter((i) => i.status === 'Ready')
      .map((line) => ({ line, order: o })),
  );
  const rows = (orders.data ?? []).flatMap((o) =>
    o.items
      .filter((i) => i.status === (tab === 'Chờ lên món' ? 'Ready' : 'Served'))
      .map((line) => ({ line, order: o })),
  );
  const selectionCurrent = !!selected && !!orders.data?.some((order) =>
    order.orderId === selected.order.orderId &&
    order.version === selected.order.version &&
    order.items.some((line) => line.orderItemId === selected.line.orderItemId && line.status === 'Ready'));
  return (
    <Page>
      <Title
        title="Món chờ phục vụ"
        subtitle="Món ngon đã sẵn sàng, mang đến khách thôi."
        action={<Badge text={`${ready.length} món`} tone="amber" />}
      />
      <Chips
        options={['Chờ lên món', 'Đã phục vụ']}
        value={tab}
        onChange={(value) => {
          if (serve.isPending) return;
          setSelected(null);
          setTab(value);
        }}
      />
      <QueryStatus query={tables} />
      {!!ids.length && <QueryStatus query={orders} />}
      {rows.map(({ line, order }) => {
        const table = tables.data
          ?.filter((t) => t.openSessionIds.includes(order.tableSessionId))
          .map((t) => t.tableCode).join(', ') || 'Bàn đang phục vụ';
        const image = menu.data?.find(
          (item) => item.itemId === line.itemId,
        )?.imageUrl;
        return (
          <Card key={line.orderItemId}>
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="text-[17px] font-[700] text-[#183B32]">{table}</Text>
              <Badge
                text={line.status === 'Ready' ? 'Sẵn sàng' : 'Đã phục vụ'}
                tone={line.status === 'Ready' ? 'amber' : 'green'}
              />
            </View>
            <View className="flex-row items-center gap-[10px]">
              {image ? (
                <Image
                  source={{ uri: image }}
                  className="w-[66px] h-[66px] rounded-[14px] bg-[#EAF5EF]"
                />
              ) : (
                <View className="w-[66px] h-[66px] rounded-[14px] bg-[#EAF5EF] items-center justify-center">
                  <Icon name="restaurant-outline" />
                </View>
              )}
              <View className="gap-[6px]" style={{ flex: 1 }}>
                <Text className="text-[14px] leading-[21px] text-[#183B32] font-[700]">
                  {line.nameSnapshot}
                </Text>
                <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                  Tổng {line.quantity} phần
                </Text>
                {!!line.note && (
                  <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                    {line.note}
                  </Text>
                )}
              </View>
            </View>
            {line.status === 'Ready' && selected?.line.orderItemId === line.orderItemId ? (
              <>
                <Notice text="Chỉ xác nhận sau khi đã đưa đủ số phần của món đến khách." />
                {serve.isError && <Notice error text={authError(serve.error)} />}
                {!selectionCurrent && (
                  <Notice error text="Đơn đã thay đổi. Thu gọn rồi chọn lại món để kiểm tra." />
                )}
                <Button
                  title={serve.isPending ? 'Đang xác nhận…' : 'Đã đưa món đến khách'}
                  disabled={serve.isPending || !selectionCurrent}
                  onPress={() => void confirmServing()}
                />
                <Button title="Thu gọn" secondary disabled={serve.isPending} onPress={() => setSelected(null)} />
              </>
            ) : line.status === 'Ready' ? (
              <Button
                title="Xác nhận đã lên món"
                icon="checkmark-circle-outline"
                disabled={serve.isPending}
                onPress={() => {
                  serve.reset();
                  setSelected({ order, line });
                }}
              />
            ) : null}
          </Card>
        );
      })}
      {tables.isSuccess &&
        (!ids.length || orders.isSuccess) &&
        !rows.length && (
          <Empty
            text={
              tab === 'Chờ lên món'
                ? 'Đã phục vụ hết món sẵn sàng. Hãy tiếp tục theo dõi bếp.'
                : 'Chưa có món được xác nhận đã lên bàn.'
            }
          />
        )}
      <Notice text="Chỉ xác nhận sau khi đã mang đủ số phần của món đến đúng bàn. Trạng thái món cập nhật mỗi 5 giây." />
    </Page>
  );
}
