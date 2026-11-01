import UnsupportedWaiterScreen from '../../shared/components/UnsupportedWaiterScreen';
import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Notice,
  Page,
  Sheet,
  Title,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import { runCommand } from '../../shared/hooks/useWaiterCommands';
import { money, sessionTotal, time } from '../../shared/utils/rules';
function DemoPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppSelector((s) => s.waiter);
  const table = state.tables.find((t) => t.id === id);
  const session = state.sessions.find((s) => s.id === table?.sessionId);
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState<{
    sessionId: string;
    tableId: string;
    total: number;
    received: number;
  } | null>(null);
  const sending = useRef(false);
  if (!table || !session)
    return (
      <Page>
        <Empty text="Không tìm thấy phiên cần thanh toán." />
      </Page>
    );
  const total = sessionTotal(state, session.id);
  const received = Number(amount);
  const items = state.items.filter(
    (i) => i.sessionId === session.id && i.status !== 'Cancelled',
  );
  const pending = session.payment === 'pending_settlement';
  const paid = session.payment === 'paid';
  const validAmount =
    !!amount &&
    Number.isSafeInteger(received) &&
    received >= total &&
    total > 0;
  const changed =
    !!confirm &&
    (confirm.sessionId !== session.id ||
      confirm.tableId !== table.id ||
      confirm.total !== total ||
      session.payment !== 'unpaid');
  const unfinished = items.some((i) => i.status !== 'Served');
  return (
    <Page>
      <Title
        title="Thu hộ tiền mặt"
        subtitle={`${table.name} · Phiên ${session.id}`}
      />
      <View className="bg-[#093E30] rounded-[20px] p-[21px] gap-[12px]">
        <Text className="text-[#BBD7C9] text-[12px]">SỐ TIỀN CẦN THU</Text>
        <Text className="text-[#fff] text-[34px] font-[700]">
          {money(total)}
        </Text>
        <Text className="text-[#BBD7C9] text-[11px]">
          Tổng tiền món trong phiên dùng thử
        </Text>
      </View>
      <Card>
        <Text className="text-[17px] font-[700] text-[#183B32]">
          Kiểm tra hóa đơn
        </Text>
        {items.map((i) => (
          <View
            key={i.id}
            className="flex-row items-center justify-between gap-[10px]"
          >
            <Text
              className="text-[14px] leading-[21px] text-[#183B32]"
              style={{ flex: 1 }}
            >
              {i.quantity} × {i.name}
            </Text>
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              {money(i.quantity * i.price)}
            </Text>
          </View>
        ))}
        {unfinished && (
          <Notice
            text="Còn món chưa phục vụ xong. Hãy kiểm tra với khách trước khi thu tiền."
            error
          />
        )}
      </Card>
      {paid ? (
        <Card>
          <Badge text="Đã thanh toán" />
          <Notice text="Phiên đã được thanh toán. Không thể ghi nhận thu hộ thêm." />
        </Card>
      ) : pending ? (
        <Card>
          <View className="flex-row items-center gap-[10px]">
            <Icon name="time-outline" color={colors.amber} size={30} />
            <View style={{ flex: 1 }}>
              <Text className="text-[17px] font-[700] text-[#183B32]">
                Chờ bàn giao cho thu ngân
              </Text>
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                Chưa hoàn tất thanh toán
              </Text>
            </View>
          </View>
          <Badge text="Pending_Settlement" tone="amber" />
          {session.cashCollectedBy && (
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              Nhân viên nhận tiền: {session.cashCollectedBy.name}
              {session.cashCollectedAt
                ? ` · ${time(session.cashCollectedAt)}`
                : ''}
            </Text>
          )}
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Đã nhận từ khách: {money(session.cashReceived || 0)}
          </Text>
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Trả lại khách: {money((session.cashReceived || 0) - total)}
          </Text>
          <Text className="text-[14px] leading-[21px] text-[#183B32] font-[700]">
            Giao thu ngân: {money(total)}
          </Text>
          <Notice text="Mang tiền đến thu ngân ngay. Chỉ Cashier xác nhận đã nhận tiền mới chuyển đơn sang Paid. Bản dùng thử không tự thực hiện bước này." />
        </Card>
      ) : (
        <Card>
          <Text className="text-[17px] font-[700] text-[#183B32]">
            Khách đưa bao nhiêu?
          </Text>
          <Field
            label="Số tiền nhận (₫)"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="Nhập số tiền khách đưa"
            maxLength={12}
          />
          <View className="flex-row flex-wrap gap-[10px]">
            {[
              total,
              Math.ceil(total / 100000) * 100000,
              Math.ceil(total / 500000) * 500000,
            ]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((v) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nhận ${v} đồng`}
                  key={v}
                  onPress={() => setAmount(String(v))}
                  className="p-[10px] rounded-[9px] border-[1px] border-[#E5EBE7]"
                >
                  <Text className="text-[#12664C] text-[13px] font-[600]">
                    {money(v)}
                  </Text>
                </Pressable>
              ))}
          </View>
          <View className="flex-row items-center justify-between gap-[10px] py-[12px]">
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              Tiền thối lại khách
            </Text>
            <Text className="text-[#12664C] text-[18px] font-[700]">
              {money(Math.max(0, received - total))}
            </Text>
          </View>
          {amount !== '' && received < total && (
            <Notice text="Tiền nhận chưa đủ tổng tiền cần thu." error />
          )}
          <Button
            title="Ghi nhận đã nhận tiền"
            icon="wallet-outline"
            disabled={!validAmount || !table.active}
            onPress={() => {
              sending.current = false;
              setConfirm({
                sessionId: session.id,
                tableId: table.id,
                total,
                received,
              });
            }}
          />
          <Text className="text-[11px] leading-[16px] text-[#7C8983]">
            Bước 1: Waiter nhận tiền → Bước 2: Cashier xác nhận bàn giao.
          </Text>
        </Card>
      )}
      {confirm && (
        <Sheet
          title="Xác nhận đã nhận tiền mặt"
          onClose={() => setConfirm(null)}
        >
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Bạn đã nhận {money(confirm.received)} từ khách tại {table.name}?
          </Text>
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Tiền thối: {money(confirm.received - confirm.total)}. Số tiền giao
            thu ngân: {money(confirm.total)}.
          </Text>
          <Button
            title="Tôi đã nhận tiền từ khách"
            disabled={changed || !table.active}
            onPress={() => {
              if (sending.current) return;
              sending.current = true;
              if (
                runCommand({
                  type: 'collect',
                  sessionId: confirm.sessionId,
                  tableId: confirm.tableId,
                  amount: confirm.received,
                  expectedTotal: confirm.total,
                })
              )
                setConfirm(null);
              else sending.current = false;
            }}
          />
          {changed && (
            <Notice
              text="Phiên bàn hoặc tổng tiền đã thay đổi. Đóng bảng này và kiểm tra lại trước khi nhận tiền."
              error
            />
          )}
        </Sheet>
      )}
    </Page>
  );
}

export default function PaymentScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? (
    <UnsupportedWaiterScreen
      title="Thu hộ tiền"
      subtitle="Kiểm tra hóa đơn trước khi nhận tiền từ khách."
    />
  ) : (
    <DemoPaymentScreen />
  );
}
