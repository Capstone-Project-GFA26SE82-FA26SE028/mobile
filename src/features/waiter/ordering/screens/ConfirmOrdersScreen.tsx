import LiveOrdersScreen from './LiveOrdersScreen';
import { useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Icon,
  Notice,
  Page,
  Search,
  Sheet,
  Title,
} from '../../shared/components/UI';
import { waiterMenu } from '../utils/menu';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
import { matches, minutes, money, time } from '../../shared/utils/rules';
import { colors } from '../../shared/utils/theme';
import type { CustomerOrder } from '../types/types';

const total = (order: CustomerOrder) =>
  order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

function DemoConfirmOrdersScreen() {
  const state = useAppSelector((s) => s.waiter);
  const waiter = state.waiter;
  const now = useNow();
  const [tab, setTab] = useState('Chờ xác nhận');
  const [query, setQuery] = useState('');
  // Keep the reviewed version, rather than silently accepting a newer order.
  const [review, setReview] = useState<CustomerOrder | null>(null);
  const [checked, setChecked] = useState(false);
  const sending = useRef(false);
  const pending = state.customerOrders.filter(
    (o) => o.status === 'awaiting_confirmation',
  );
  const tableFor = (order: CustomerOrder) => {
    const session = state.sessions.find((s) => s.id === order.sessionId);
    return state.tables.find((t) => t.id === session?.tableId);
  };
  const openSession = (order: CustomerOrder) => {
    const session = state.sessions.find((s) => s.id === order.sessionId);
    const table = tableFor(order);
    return (
      !!session &&
      session.payment === 'unpaid' &&
      !!table?.active &&
      table.sessionId === session.id
    );
  };
  const rows = state.customerOrders
    .filter(
      (o) =>
        o.status ===
          (tab === 'Chờ xác nhận' ? 'awaiting_confirmation' : 'confirmed') &&
        matches(`${o.id} ${tableFor(o)?.name || ''}`, query),
    )
    .sort((a, b) =>
      tab === 'Chờ xác nhận'
        ? a.createdAt - b.createdAt
        : (b.confirmedAt || 0) - (a.confirmedAt || 0),
    );
  const current =
    review && state.customerOrders.find((o) => o.id === review.id);
  const changed =
    !!review &&
    (!current ||
      current.version !== review.version ||
      current.status !== review.status);
  const unavailable = review?.lines.some(
    (line) => !waiterMenu.some((d) => d.id === line.dishId && d.available),
  );

  return (
    <Page>
      <Title
        title="Xác nhận đơn khách"
        subtitle="Kiểm tra từng lượt gọi trước khi chuyển bếp."
        action={<Badge text={`${pending.length} chờ`} tone="amber" />}
      />
      <View className="bg-[#093E30] rounded-[20px] p-[21px] gap-[12px]">
        <Text className="text-[#BBD7C9] text-[12px]">ĐƠN GỌI TỪ QR MENU</Text>
        <Text className="text-[#fff] text-[24px] font-[700]">
          {pending.length} lượt gọi cần kiểm tra
        </Text>
        <Text className="text-[#DCECE3] text-[12px] leading-[19px]">
          Mỗi lượt gọi thêm cần xác nhận riêng. Đơn chưa xác nhận chưa được
          chuyển bếp hoặc cộng vào hóa đơn.
        </Text>
      </View>
      <Chips
        options={['Chờ xác nhận', 'Đã xác nhận']}
        value={tab}
        onChange={setTab}
      />
      <Search
        value={query}
        onChange={setQuery}
        placeholder="Tìm số bàn hoặc mã đơn…"
      />
      {rows.map((order) => {
        const table = tableFor(order);
        const isPending = order.status === 'awaiting_confirmation';
        return (
          <Card key={order.id}>
            <View className="flex-row items-center justify-between gap-[10px]">
              <View
                className="flex-row items-center gap-[10px]"
                style={{ flex: 1 }}
              >
                <View className="p-[10px] rounded-[12px] bg-[#EAF5EF]">
                  <Icon name="receipt-outline" />
                </View>
                <View className="gap-[4px]" style={{ flex: 1 }}>
                  <Text className="text-[17px] font-[700] text-[#183B32]">
                    {table?.name || 'Không tìm thấy bàn'}
                  </Text>
                  <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                    {order.id} · {table?.area || 'Phiên không còn hoạt động'}
                  </Text>
                </View>
              </View>
              <Badge
                text={isPending ? 'Chờ xác nhận' : 'Đã xác nhận'}
                tone={isPending ? 'amber' : 'green'}
              />
            </View>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              {time(order.createdAt)} · {minutes(order.createdAt, now)} phút
              trước · {order.lines.reduce((n, line) => n + line.quantity, 0)}{' '}
              phần
            </Text>
            {order.lines.map((line, index) => (
              <Text
                key={index}
                className="text-[14px] leading-[21px] text-[#183B32]"
              >
                {line.quantity} × {line.name}
              </Text>
            ))}
            {!!order.note && (
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                Khách nhắn: {order.note}
              </Text>
            )}
            <View className="h-[1px] bg-[#E5EBE7] my-[4px]" />
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                Tổng lượt gọi
              </Text>
              <Text className="text-[#12664C] text-[18px] font-[700]">
                {money(total(order))}
              </Text>
            </View>
            {!isPending && (
              <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                {order.confirmedBy?.name} · Xác nhận lúc{' '}
                {time(order.confirmedAt!)} · Đã ghi nhận chuyển bếp trong phiên
                dùng thử
              </Text>
            )}
            {isPending && !openSession(order) && (
              <Notice
                text="Phiên bàn đã đóng hoặc đang thanh toán. Không thể xác nhận lượt gọi này."
                error
              />
            )}
            <Button
              title={
                isPending ? `Kiểm tra đơn ${order.id}` : `Xem đơn ${order.id}`
              }
              secondary={!isPending}
              icon={isPending ? 'checkmark-circle-outline' : 'receipt-outline'}
              onPress={() => {
                setChecked(false);
                sending.current = false;
                setReview(order);
              }}
            />
          </Card>
        );
      })}
      {!rows.length && (
        <Empty
          text={
            query
              ? 'Không tìm thấy đơn phù hợp.'
              : tab === 'Chờ xác nhận'
                ? 'Đã kiểm tra hết đơn. Các lượt gọi mới của khách sẽ xuất hiện tại đây.'
                : 'Chưa có đơn được xác nhận.'
          }
        />
      )}
      <Text className="text-[11px] leading-[16px] text-[#7C8983] text-center">
        Dữ liệu mẫu · Chưa kết nối QR Menu, bếp và thu ngân
      </Text>
      {review && (
        <Sheet
          title={`Kiểm tra đơn · ${review.id}`}
          onClose={() => setReview(null)}
        >
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              {tableFor(review)?.name || 'Không tìm thấy bàn'}
            </Text>
            <Badge
              text={
                review.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'
              }
              tone={review.status === 'confirmed' ? 'green' : 'amber'}
            />
          </View>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            {tableFor(review)?.area} · Gửi lúc {time(review.createdAt)}
          </Text>
          {review.lines.map((line, index) => (
            <View
              key={index}
              className="gap-[9px] pb-[14px] border-b-[1px] border-[#E5EBE7]"
            >
              <View className="flex-row items-center gap-[10px]">
                <Image
                  source={waiterMenu.find((d) => d.id === line.dishId)?.image}
                  className="w-[66px] h-[66px] rounded-[14px] bg-[#EAF5EF]"
                />
                <View className="gap-[5px]" style={{ flex: 1 }}>
                  <Text className="text-[14px] leading-[21px] text-[#183B32] font-[700]">
                    {line.name}
                  </Text>
                  <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                    {line.quantity} phần × {money(line.price)}
                  </Text>
                  <Text className="text-[#12664C] text-[13px] font-[600]">
                    {money(line.price * line.quantity)}
                  </Text>
                </View>
              </View>
              {!!line.note && <Notice text={`Ghi chú cho bếp: ${line.note}`} />}
            </View>
          ))}
          {!!review.note && <Notice text={`Khách nhắn: ${review.note}`} />}
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              Tổng lượt gọi
            </Text>
            <Text className="text-[#12664C] text-[18px] font-[700]">
              {money(total(review))}
            </Text>
          </View>
          {review.status === 'confirmed' ? (
            <Notice
              text={`Đã xác nhận bởi ${review.confirmedBy?.name} lúc ${time(review.confirmedAt!)}. Lượt gọi này đã được ghi nhận cho bếp và thu ngân trong phiên dùng thử.`}
            />
          ) : (
            <>
              {changed && (
                <Notice
                  text="Đơn đã thay đổi. Đóng bảng này và mở lại đơn để kiểm tra nội dung mới."
                  error
                />
              )}
              {!openSession(review) && (
                <Notice
                  text="Phiên bàn không còn nhận món. Vui lòng kiểm tra lại trước khi xác nhận."
                  error
                />
              )}
              {unavailable && (
                <Notice
                  text="Có món hiện không còn phục vụ. Vui lòng trao đổi lại với khách."
                  error
                />
              )}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Đã kiểm tra bàn, món, số lượng và ghi chú"
                accessibilityState={{ checked }}
                onPress={() => setChecked(!checked)}
                className="flex-row items-start gap-[10px] py-[10px]"
              >
                <Icon
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={24}
                />
                <Text
                  className="text-[14px] leading-[21px] text-[#183B32]"
                  style={{ flex: 1 }}
                >
                  Tôi đã kiểm tra đúng bàn, món, số lượng và ghi chú của khách.
                </Text>
              </Pressable>
              <Button
                title="Xác nhận và chuyển bếp"
                icon="checkmark-circle-outline"
                disabled={
                  !checked || changed || !openSession(review) || unavailable
                }
                onPress={() => {
                  if (sending.current) return;
                  sending.current = true;
                  if (
                    runCommand({
                      type: 'confirm-order',
                      orderId: review.id,
                      version: review.version,
                    })
                  ) {
                    setReview(null);
                  } else sending.current = false;
                }}
              />
              <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                Nhân viên xác nhận: {waiter?.name}. Chỉ lượt gọi này được chuyển
                bếp và ghi nhận tính tiền sau khi bạn xác nhận.
              </Text>
            </>
          )}
        </Sheet>
      )}
    </Page>
  );
}

export default function ConfirmOrdersScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveOrdersScreen /> : <DemoConfirmOrdersScreen />;
}
