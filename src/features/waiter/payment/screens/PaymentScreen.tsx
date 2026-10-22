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
import { colors, ui } from '../../shared/theme';
import { runCommand } from '../../shared/hooks';
import { money, sessionTotal, time } from '../../shared/rules';
function DemoPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppSelector((s) => s.waiter);
  const table = state.tables.find((t) => t.id === id);
  const session = state.sessions.find((s) => s.id === table?.sessionId);
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState<{ sessionId: string; tableId: string; total: number; received: number } | null>(null);
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
  const validAmount = !!amount && Number.isSafeInteger(received) && received >= total && total > 0;
  const changed = !!confirm && (confirm.sessionId !== session.id || confirm.tableId !== table.id || confirm.total !== total || session.payment !== 'unpaid');
  const unfinished = items.some((i) => i.status !== 'Served');
  return (
    <Page>
      <Title
        title="Thu hộ tiền mặt"
        subtitle={`${table.name} · Phiên ${session.id}`}
      />
      <View style={ui.hero}>
        <Text style={{ color: '#BBD7C9', fontSize: 12 }}>SỐ TIỀN CẦN THU</Text>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '700' }}>
          {money(total)}
        </Text>
        <Text style={{ color: '#BBD7C9', fontSize: 11 }}>
          Tổng tiền món trong phiên dùng thử
        </Text>
      </View>
      <Card>
        <Text style={ui.h2}>Kiểm tra hóa đơn</Text>
        {items.map((i) => (
          <View key={i.id} style={ui.between}>
            <Text style={[ui.body, { flex: 1 }]}>
              {i.quantity} × {i.name}
            </Text>
            <Text style={ui.body}>{money(i.quantity * i.price)}</Text>
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
          <View style={ui.row}>
            <Icon name="time-outline" color={colors.amber} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={ui.h2}>Chờ bàn giao cho thu ngân</Text>
              <Text style={ui.muted}>Chưa hoàn tất thanh toán</Text>
            </View>
          </View>
          <Badge text="Pending_Settlement" tone="amber" />
          {session.cashCollectedBy && <Text style={ui.muted}>Nhân viên nhận tiền: {session.cashCollectedBy.name}{session.cashCollectedAt ? ` · ${time(session.cashCollectedAt)}` : ''}</Text>}
          <Text style={ui.body}>
            Đã nhận từ khách: {money(session.cashReceived || 0)}
          </Text>
          <Text style={ui.body}>
            Trả lại khách: {money((session.cashReceived || 0) - total)}
          </Text>
          <Text style={[ui.body, { fontWeight: '700' }]}>
            Giao thu ngân: {money(total)}
          </Text>
          <Notice text="Mang tiền đến thu ngân ngay. Chỉ Cashier xác nhận đã nhận tiền mới chuyển đơn sang Paid. Bản dùng thử không tự thực hiện bước này." />
        </Card>
      ) : (
        <Card>
          <Text style={ui.h2}>Khách đưa bao nhiêu?</Text>
          <Field
            label="Số tiền nhận (₫)"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="Nhập số tiền khách đưa"
            maxLength={12}
          />
          <View style={ui.wrap}>
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
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text style={ui.link}>{money(v)}</Text>
                </Pressable>
              ))}
          </View>
          <View style={[ui.between, { paddingVertical: 12 }]}>
            <Text style={ui.body}>Tiền thối lại khách</Text>
            <Text style={ui.money}>{money(Math.max(0, received - total))}</Text>
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
              setConfirm({ sessionId: session.id, tableId: table.id, total, received });
            }}
          />
          <Text style={ui.small}>
            Bước 1: Waiter nhận tiền → Bước 2: Cashier xác nhận bàn giao.
          </Text>
        </Card>
      )}
      {confirm && (
        <Sheet
          title="Xác nhận đã nhận tiền mặt"
          onClose={() => setConfirm(null)}
        >
          <Text style={ui.body}>
            Bạn đã nhận {money(confirm.received)} từ khách tại {table.name}?
          </Text>
          <Text style={ui.body}>
            Tiền thối: {money(confirm.received - confirm.total)}. Số tiền giao thu ngân:{' '}
            {money(confirm.total)}.
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
          {changed && <Notice text="Phiên bàn hoặc tổng tiền đã thay đổi. Đóng bảng này và kiểm tra lại trước khi nhận tiền." error />}
        </Sheet>
      )}
    </Page>
  );
}

export default function PaymentScreen() {
  const apiMode = useAppSelector(s => s.waiter.authMode === 'api');
  return apiMode ? <UnsupportedWaiterScreen /> : <DemoPaymentScreen />;
}
