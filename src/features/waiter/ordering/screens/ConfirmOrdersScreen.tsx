import LiveOrdersScreen from './LiveOrdersScreen';
import { useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge, Button, Card, Chips, Empty, Icon, Notice, Page, Search, Sheet, Title,
} from '../../shared/components/UI';
import { waiterMenu } from '../../shared/data/menu';
import { runCommand, useNow } from '../../shared/hooks';
import { matches, minutes, money, time } from '../../shared/rules';
import { colors, ui } from '../../shared/theme';
import type { CustomerOrder } from '../types';

const total = (order: CustomerOrder) => order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

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
  const pending = state.customerOrders.filter((o) => o.status === 'awaiting_confirmation');
  const tableFor = (order: CustomerOrder) => {
    const session = state.sessions.find((s) => s.id === order.sessionId);
    return state.tables.find((t) => t.id === session?.tableId);
  };
  const openSession = (order: CustomerOrder) => {
    const session = state.sessions.find((s) => s.id === order.sessionId);
    const table = tableFor(order);
    return !!session && session.payment === 'unpaid' && !!table?.active && table.sessionId === session.id;
  };
  const rows = state.customerOrders.filter((o) =>
    o.status === (tab === 'Chờ xác nhận' ? 'awaiting_confirmation' : 'confirmed') &&
    matches(`${o.id} ${tableFor(o)?.name || ''}`, query),
  ).sort((a, b) => tab === 'Chờ xác nhận'
    ? a.createdAt - b.createdAt
    : (b.confirmedAt || 0) - (a.confirmedAt || 0));
  const current = review && state.customerOrders.find((o) => o.id === review.id);
  const changed = !!review && (!current || current.version !== review.version || current.status !== review.status);
  const unavailable = review?.lines.some((line) => !waiterMenu.some((d) => d.id === line.dishId && d.available));

  return (
    <Page>
      <Title title="Xác nhận đơn khách" subtitle="Kiểm tra từng lượt gọi trước khi chuyển bếp." action={<Badge text={`${pending.length} chờ`} tone="amber" />} />
      <View style={ui.hero}>
        <Text style={{ color: '#BBD7C9', fontSize: 12 }}>ĐƠN GỌI TỪ QR MENU</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{pending.length} lượt gọi cần kiểm tra</Text>
        <Text style={{ color: '#DCECE3', fontSize: 12, lineHeight: 19 }}>Mỗi lượt gọi thêm cần xác nhận riêng. Đơn chưa xác nhận chưa được chuyển bếp hoặc cộng vào hóa đơn.</Text>
      </View>
      <Chips options={['Chờ xác nhận', 'Đã xác nhận']} value={tab} onChange={setTab} />
      <Search value={query} onChange={setQuery} placeholder="Tìm số bàn hoặc mã đơn…" />
      {rows.map((order) => {
        const table = tableFor(order);
        const isPending = order.status === 'awaiting_confirmation';
        return (
          <Card key={order.id}>
            <View style={ui.between}>
              <View style={[ui.row, { flex: 1 }]}>
                <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.mint }}><Icon name="receipt-outline" /></View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={ui.h2}>{table?.name || 'Không tìm thấy bàn'}</Text>
                  <Text style={ui.small}>{order.id} · {table?.area || 'Phiên không còn hoạt động'}</Text>
                </View>
              </View>
              <Badge text={isPending ? 'Chờ xác nhận' : 'Đã xác nhận'} tone={isPending ? 'amber' : 'green'} />
            </View>
            <Text style={ui.muted}>{time(order.createdAt)} · {minutes(order.createdAt, now)} phút trước · {order.lines.reduce((n, line) => n + line.quantity, 0)} phần</Text>
            {order.lines.map((line, index) => <Text key={index} style={ui.body}>{line.quantity} × {line.name}</Text>)}
            {!!order.note && <Text style={ui.muted}>Khách nhắn: {order.note}</Text>}
            <View style={ui.divider} />
            <View style={ui.between}><Text style={ui.muted}>Tổng lượt gọi</Text><Text style={ui.money}>{money(total(order))}</Text></View>
            {!isPending && <Text style={ui.small}>{order.confirmedBy?.name} · Xác nhận lúc {time(order.confirmedAt!)} · Đã ghi nhận chuyển bếp trong phiên dùng thử</Text>}
            {isPending && !openSession(order) && <Notice text="Phiên bàn đã đóng hoặc đang thanh toán. Không thể xác nhận lượt gọi này." error />}
            <Button title={isPending ? `Kiểm tra đơn ${order.id}` : `Xem đơn ${order.id}`} secondary={!isPending} icon={isPending ? 'checkmark-circle-outline' : 'receipt-outline'} onPress={() => {
              setChecked(false);
              sending.current = false;
              setReview(order);
            }} />
          </Card>
        );
      })}
      {!rows.length && <Empty text={query ? 'Không tìm thấy đơn phù hợp.' : tab === 'Chờ xác nhận' ? 'Đã kiểm tra hết đơn. Các lượt gọi mới của khách sẽ xuất hiện tại đây.' : 'Chưa có đơn được xác nhận.'} />}
      <Text style={[ui.small, { textAlign: 'center' }]}>Dữ liệu mẫu · Chưa kết nối QR Menu, bếp và thu ngân</Text>
      {review && (
        <Sheet title={`Kiểm tra đơn · ${review.id}`} onClose={() => setReview(null)}>
          <View style={ui.between}><Text style={ui.h2}>{tableFor(review)?.name || 'Không tìm thấy bàn'}</Text><Badge text={review.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'} tone={review.status === 'confirmed' ? 'green' : 'amber'} /></View>
          <Text style={ui.muted}>{tableFor(review)?.area} · Gửi lúc {time(review.createdAt)}</Text>
          {review.lines.map((line, index) => (
            <View key={index} style={{ gap: 9, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.line }}>
              <View style={ui.row}>
                <Image source={waiterMenu.find((d) => d.id === line.dishId)?.image} style={ui.image} />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={[ui.body, { fontWeight: '700' }]}>{line.name}</Text>
                  <Text style={ui.muted}>{line.quantity} phần × {money(line.price)}</Text>
                  <Text style={ui.link}>{money(line.price * line.quantity)}</Text>
                </View>
              </View>
              {!!line.note && <Notice text={`Ghi chú cho bếp: ${line.note}`} />}
            </View>
          ))}
          {!!review.note && <Notice text={`Khách nhắn: ${review.note}`} />}
          <View style={ui.between}><Text style={ui.h2}>Tổng lượt gọi</Text><Text style={ui.money}>{money(total(review))}</Text></View>
          {review.status === 'confirmed' ? (
            <Notice text={`Đã xác nhận bởi ${review.confirmedBy?.name} lúc ${time(review.confirmedAt!)}. Lượt gọi này đã được ghi nhận cho bếp và thu ngân trong phiên dùng thử.`} />
          ) : (
            <>
              {changed && <Notice text="Đơn đã thay đổi. Đóng bảng này và mở lại đơn để kiểm tra nội dung mới." error />}
              {!openSession(review) && <Notice text="Phiên bàn không còn nhận món. Vui lòng kiểm tra lại trước khi xác nhận." error />}
              {unavailable && <Notice text="Có món hiện không còn phục vụ. Vui lòng trao đổi lại với khách." error />}
              <Pressable accessibilityRole="checkbox" accessibilityLabel="Đã kiểm tra bàn, món, số lượng và ghi chú" accessibilityState={{ checked }} onPress={() => setChecked(!checked)} style={[ui.row, { paddingVertical: 10, alignItems: 'flex-start' }]}>
                <Icon name={checked ? 'checkbox' : 'square-outline'} size={24} />
                <Text style={[ui.body, { flex: 1 }]}>Tôi đã kiểm tra đúng bàn, món, số lượng và ghi chú của khách.</Text>
              </Pressable>
              <Button title="Xác nhận và chuyển bếp" icon="checkmark-circle-outline" disabled={!checked || changed || !openSession(review) || unavailable} onPress={() => {
                if (sending.current) return;
                sending.current = true;
                if (runCommand({ type: 'confirm-order', orderId: review.id, version: review.version })) {
                  setReview(null);
                } else sending.current = false;
              }} />
              <Text style={ui.small}>Nhân viên xác nhận: {waiter?.name}. Chỉ lượt gọi này được chuyển bếp và ghi nhận tính tiền sau khi bạn xác nhận.</Text>
            </>
          )}
        </Sheet>
      )}
    </Page>
  );
}

export default function ConfirmOrdersScreen() {
  const apiMode = useAppSelector(s => s.waiter.authMode === 'api');
  return apiMode ? <LiveOrdersScreen /> : <DemoConfirmOrdersScreen />;
}
