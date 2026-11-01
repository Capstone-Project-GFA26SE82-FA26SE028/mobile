import LiveTableDetailScreen from './LiveTableDetailScreen';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Notice,
  Page,
  Sheet,
  Stepper,
  Title,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import {
  heldReservation,
  money,
  sessionTotal,
  tableStatus,
  time,
} from '../../shared/utils/rules';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
const labels = {
  Pending: 'Chờ chế biến',
  Sent: 'Đã gửi bếp',
  Cooking: 'Đang chế biến',
  Ready: 'Sẵn sàng',
  Served: 'Đã lên món',
  Cancelled: 'Đã hủy',
};
function DemoTableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppSelector((s) => s.waiter);
  const router = useRouter();
  const now = useNow();
  const table = state.tables.find((t) => t.id === id);
  const session = state.sessions.find((s) => s.id === table?.sessionId);
  const [modal, setModal] = useState<'open' | 'move' | 'cancel' | null>(null);
  const [guests, setGuests] = useState(2);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [itemId, setItemId] = useState('');
  if (!table)
    return (
      <Page>
        <Empty text="Không tìm thấy bàn." />
      </Page>
    );
  const items = state.items.filter((i) => i.sessionId === session?.id);
  const hold = heldReservation(state, table.id, now);
  const targets = state.tables.filter(
    (t) =>
      t.id !== table.id &&
      t.active &&
      !!t.area &&
      tableStatus(state, t, now) === 'Trống' &&
      t.capacity >= (session?.guests || 0),
  );
  return (
    <Page>
      <Title
        title={table.name}
        subtitle={`${table.area} · ${table.capacity} chỗ ngồi`}
        action={<Badge text={tableStatus(state, table, now)} />}
      />
      {session ? (
        <>
          <Card>
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="text-[17px] font-[700] text-[#183B32]">
                Phiên phục vụ
              </Text>
              <Badge
                text={
                  session.payment === 'pending_settlement'
                    ? 'Chờ nộp tiền'
                    : 'Đang mở'
                }
                tone={
                  session.payment === 'pending_settlement' ? 'amber' : 'green'
                }
              />
            </View>
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              {session.guests} khách · Mở lúc {time(session.openedAt)}
            </Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              Nhân viên phụ trách: {state.waiter?.name}
            </Text>
            {session.prebillPrinted && (
              <Notice text="Đã in hóa đơn tạm tính. Không thể đổi bàn." />
            )}
            <View className="flex-row items-center gap-[10px]">
              <View style={{ flex: 1 }}>
                <Button
                  title="Gọi thêm món"
                  icon="add"
                  disabled={!table.active || session.payment !== 'unpaid'}
                  onPress={() =>
                    router.push({
                      pathname: '/waiter/order/[id]',
                      params: { id: table.id },
                    })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Đổi bàn"
                  secondary
                  disabled={
                    !table.active ||
                    session.prebillPrinted ||
                    session.payment !== 'unpaid'
                  }
                  onPress={() => {
                    setReason('');
                    setTarget('');
                    setModal('move');
                  }}
                />
              </View>
            </View>
          </Card>
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              Món đã gọi
            </Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              {items.filter((i) => i.status !== 'Cancelled').length} dòng món
            </Text>
          </View>
          {items.length ? (
            items.map((item) => (
              <Card key={item.id}>
                <View className="flex-row items-center justify-between gap-[10px]">
                  <Text
                    className="text-[14px] leading-[21px] text-[#183B32] font-[700]"
                    style={{ flex: 1 }}
                  >
                    {item.quantity} × {item.name}
                  </Text>
                  <Text className="text-[#12664C] text-[13px] font-[600]">
                    {money(item.quantity * item.price)}
                  </Text>
                </View>
                <Badge
                  text={labels[item.status]}
                  tone={
                    item.status === 'Cancelled'
                      ? 'gray'
                      : item.status === 'Ready'
                        ? 'amber'
                        : 'green'
                  }
                />
                {!!item.note && (
                  <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                    Ghi chú: {item.note}
                  </Text>
                )}
                {item.served > 0 && (
                  <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                    Đã lên {item.served}/{item.quantity} phần
                  </Text>
                )}
                <View className="flex-row items-center justify-between gap-[10px]">
                  <Text
                    className="text-[11px] leading-[16px] text-[#7C8983]"
                    style={{ flex: 1 }}
                  >
                    {item.status !== 'Pending' && item.status !== 'Sent'
                      ? 'Chỉ hủy món chưa chế biến'
                      : 'Có thể hủy trước khi bếp chế biến'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Hủy ${item.name}`}
                    disabled={
                      (item.status !== 'Pending' && item.status !== 'Sent') ||
                      session.payment !== 'unpaid' ||
                      !table.active
                    }
                    onPress={() => {
                      setItemId(item.id);
                      setReason('');
                      setModal('cancel');
                    }}
                    className="p-[10px]"
                    style={{
                      opacity:
                        (item.status === 'Pending' || item.status === 'Sent') &&
                        session.payment === 'unpaid'
                          ? 1
                          : 0.3,
                    }}
                  >
                    <Text className="text-[12px] text-[#CB534E] font-[600]">
                      Hủy món
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Empty text="Bàn chưa có món. Hãy tạo lượt gọi món đầu tiên." />
            </Card>
          )}
          <Card>
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="text-[17px] font-[700] text-[#183B32]">
                Tạm tính
              </Text>
              <Text className="text-[#12664C] text-[18px] font-[700]">
                {money(sessionTotal(state, session.id))}
              </Text>
            </View>
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              Tổng tiền món trong bản dùng thử, chưa áp dụng thuế/phí và ưu đãi.
            </Text>
            <Button
              title={
                session.payment === 'pending_settlement'
                  ? 'Xem bàn giao tiền'
                  : 'Thu hộ tiền mặt'
              }
              icon="wallet-outline"
              disabled={!table.active || sessionTotal(state, session.id) <= 0}
              onPress={() =>
                router.push({
                  pathname: '/waiter/payment/[id]',
                  params: { id: table.id },
                })
              }
            />
          </Card>
        </>
      ) : (
        <Card>
          <Text className="text-[17px] font-[700] text-[#183B32]">
            {hold
              ? `Giữ chỗ cho ${hold.name}`
              : table.needsCleaning
                ? 'Bàn đang chờ dọn'
                : 'Sẵn sàng đón khách'}
          </Text>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            {hold
              ? `Lịch hẹn ${time(hold.time)} · ${hold.guests} khách`
              : 'Mở phiên phục vụ trước khi khách gọi món qua mã QR.'}
          </Text>
          {hold ? (
            <Button
              title="Xem đặt bàn"
              onPress={() => router.push('/waiter/reservations')}
            />
          ) : (
            <Button
              title="Mở phiên phục vụ"
              disabled={!table.active || table.needsCleaning}
              icon="people-outline"
              onPress={() => {
                setGuests(Math.min(2, table.capacity));
                setModal('open');
              }}
            />
          )}
        </Card>
      )}
      {modal === 'open' && (
        <Sheet
          title={`Mở phiên · ${table.name}`}
          onClose={() => setModal(null)}
        >
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Số khách đến bàn
          </Text>
          <Stepper value={guests} onChange={setGuests} max={table.capacity} />
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            Tối đa {table.capacity} khách. Kiểm tra lịch giữ chỗ trước khi xác
            nhận.
          </Text>
          <Button
            title="Xác nhận mở phiên"
            onPress={() => {
              if (runCommand({ type: 'open', tableId: table.id, guests }))
                setModal(null);
            }}
          />
        </Sheet>
      )}
      {modal === 'move' && session && (
        <Sheet title="Đổi bàn cho khách" onClose={() => setModal(null)}>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            Chọn bàn trống đủ chỗ cho {session.guests} khách.
          </Text>
          <View className="flex-row flex-wrap gap-[10px]">
            {targets.map((t) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Chuyển đến ${t.name}`}
                accessibilityState={{ selected: target === t.id }}
                key={t.id}
                onPress={() => setTarget(t.id)}
                className="p-[14px] rounded-[12px] border-[1px]"
                style={{
                  borderColor: target === t.id ? colors.green : colors.line,
                  backgroundColor: target === t.id ? colors.mint : '#fff',
                }}
              >
                <Text className="text-[14px] leading-[21px] text-[#183B32]">
                  {t.name}
                </Text>
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {t.area} · {t.capacity} chỗ
                </Text>
              </Pressable>
            ))}
          </View>
          {!targets.length && <Empty text="Chưa có bàn trống phù hợp." />}
          <Field
            label="Lý do đổi bàn"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={300}
          />
          <Button
            title="Xác nhận đổi bàn"
            disabled={
              !targets.some((t) => t.id === target) ||
              !reason.trim() ||
              !table.active ||
              session.prebillPrinted ||
              session.payment !== 'unpaid'
            }
            onPress={() => {
              if (
                runCommand({
                  type: 'move',
                  sessionId: session.id,
                  tableId: target,
                  reason,
                  sourceTableId: table.id,
                })
              ) {
                setModal(null);
                router.replace({
                  pathname: '/waiter/table/[id]',
                  params: { id: target },
                });
              }
            }}
          />
        </Sheet>
      )}
      {modal === 'cancel' && (
        <Sheet title="Hủy món chưa chế biến" onClose={() => setModal(null)}>
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            {state.items.find((i) => i.id === itemId)?.name}
          </Text>
          <Field
            label="Lý do hủy món"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={300}
          />
          <Button
            title="Xác nhận hủy món"
            danger
            disabled={
              !reason.trim() ||
              !table.active ||
              session?.payment !== 'unpaid' ||
              !state.items.some(
                (i) =>
                  i.id === itemId &&
                  (i.status === 'Pending' || i.status === 'Sent'),
              )
            }
            onPress={() => {
              if (runCommand({ type: 'cancel', itemId, reason }))
                setModal(null);
            }}
          />
        </Sheet>
      )}
    </Page>
  );
}

export default function TableDetailScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveTableDetailScreen /> : <DemoTableDetailScreen />;
}
