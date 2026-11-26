import { useState } from 'react';
import { Text } from 'react-native';
import {
  Button,
  Chips,
  Empty,
  Notice,
  Page,
  Title,
} from '../../shared/components/UI';
import { OrderCard } from '../components/OrderCard';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import {
  useSessionOrders,
  useOrderActions,
  useOrderDetail,
} from '../hooks/useOrders';
import type { Order } from '../types/api';

export default function LiveOrdersScreen() {
  const tables = useServiceTables();
  const sessionIds = (tables.data ?? []).flatMap((t) => t.openSessionIds);
  const orders = useSessionOrders(sessionIds);
  const [tab, setTab] = useState('Chờ xác nhận');
  const [review, setReview] = useState<Order | null>(null);
  const [checked, setChecked] = useState(false);
  const detail = useOrderDetail(review);
  const { confirm } = useOrderActions();
  const rows = (orders.data ?? []).filter(
    (o) =>
      o.source === 'Guest' &&
      o.status ===
        (tab === 'Chờ xác nhận' ? 'PendingConfirmation' : 'Confirmed'),
  );
  const changed =
    !!review &&
    (detail.data?.version !== review.version ||
      detail.data?.status !== review.status);
  return (
    <Page>
      <Title
        title="Xác nhận đơn khách"
        subtitle="Kiểm tra món, số lượng và ghi chú trước khi chuyển bếp."
      />
      <QueryStatus query={tables} />
      {!!sessionIds.length && <QueryStatus query={orders} />}
      <Chips
        options={['Chờ xác nhận', 'Đã xác nhận']}
        value={tab}
        onChange={(value) => {
          if (confirm.isPending) return;
          setTab(value);
          setReview(null);
        }}
      />
      {rows.map((order) => {
        const expanded = review?.orderId === order.orderId;
        const reviewedOrder = expanded ? detail.data ?? order : order;
        return (
          <OrderCard key={order.orderId} order={reviewedOrder}>
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              {tables.data
                ?.filter((table) => table.openSessionIds.includes(order.tableSessionId))
                .map((table) => table.tableCode)
                .join(', ')}
            </Text>
            <Button
              title={expanded ? 'Thu gọn' : 'Kiểm tra chi tiết'}
              secondary={expanded}
              disabled={confirm.isPending}
              onPress={() => {
                confirm.reset();
                setChecked(false);
                setReview(expanded ? null : order);
              }}
            />
            {expanded && (
              <>
                <QueryStatus query={detail} />
                {changed && detail.isSuccess && (
                  <Notice
                    error
                    text="Đơn đã thay đổi. Thu gọn rồi mở lại để kiểm tra dữ liệu mới."
                  />
                )}
                {reviewedOrder.status === 'PendingConfirmation' && (
                  <>
                    <Button
                      secondary
                      title={checked ? '✓ Đã kiểm tra bàn, món và ghi chú' : 'Tôi đã kiểm tra bàn, món và ghi chú'}
                      disabled={changed || !detail.isSuccess || confirm.isPending}
                      onPress={() => setChecked(!checked)}
                    />
                    <Button
                      title={confirm.isPending ? 'Đang xác nhận…' : 'Xác nhận và chuyển bếp'}
                      disabled={!checked || changed || !detail.isSuccess || confirm.isPending}
                      onPress={() =>
                        confirm.mutate(reviewedOrder, { onSuccess: () => setReview(null) })
                      }
                    />
                    {confirm.isError && (
                      <QueryStatus
                        query={{
                          error: confirm.error,
                          isPending: false,
                          refetch: () => void detail.refetch(),
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </OrderCard>
        );
      })}
      {tables.isSuccess &&
        (!sessionIds.length || orders.isSuccess) &&
        !rows.length && <Empty text="Không có đơn khách trong mục này." />}
    </Page>
  );
}
