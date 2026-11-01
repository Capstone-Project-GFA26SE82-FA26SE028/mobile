import LiveReservationsScreen from './LiveReservationsScreen';
import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Notice,
  Page,
  Search,
  Sheet,
  Title,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
import { matches, time } from '../../shared/utils/rules';
import { inHoldWindow, reservationTableError } from '../utils/rules';
function DemoReservationsScreen() {
  const state = useAppSelector((s) => s.waiter);
  const router = useRouter();
  const now = useNow();
  const [tab, setTab] = useState('Chờ duyệt');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState<'confirm' | 'reject'>('confirm');
  const [tableId, setTableId] = useState('');
  const [reason, setReason] = useState('');
  const selected = state.reservations.find((r) => r.id === selectedId);
  const statuses: Record<string, string> = {
    'Chờ duyệt': 'pending',
    'Đã xác nhận': 'confirmed',
    'Đã đến': 'arrived',
    'Từ chối': 'rejected',
  };
  const rows = state.reservations
    .filter(
      (r) =>
        r.status === statuses[tab] && matches(`${r.name} ${r.phone}`, query),
    )
    .sort((a, b) => a.time - b.time);
  const available = selected
    ? state.tables.filter(
        (t) => !reservationTableError(state, selected, t.id, now),
      )
    : [];
  return (
    <Page>
      <Title
        title="Đặt bàn trước"
        subtitle="Chuẩn bị một chỗ ngồi thật chu đáo cho khách."
      />
      <Chips options={Object.keys(statuses)} value={tab} onChange={setTab} />
      <Search
        placeholder="Tìm tên hoặc số điện thoại…"
        value={query}
        onChange={setQuery}
      />
      {rows.map((r) => {
        const table = state.tables.find((t) => t.id === r.tableId);
        const inWindow = inHoldWindow(r, now);
        return (
          <Card key={r.id}>
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="text-[17px] font-[700] text-[#183B32]">
                {r.name}
              </Text>
              <Badge text={`${r.guests} khách`} />
            </View>
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              {new Date(r.time).toLocaleDateString('vi-VN')} · {time(r.time)}–
              {time(r.endTime)} · {r.phone}
            </Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              {r.note}
            </Text>
            {table && (
              <Badge text={`${table.name} · ${table.area}`} tone="blue" />
            )}
            {!!r.reason && (
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                Lý do: {r.reason}
              </Text>
            )}
            {!!r.customerMessage && (
              <Notice
                text={`Nội dung thông báo cho khách (mẫu): ${r.customerMessage}`}
              />
            )}
            {r.status === 'pending' && (
              <View className="flex-row items-center gap-[10px]">
                <View style={{ flex: 1 }}>
                  <Button
                    title={`Duyệt ${r.name}`}
                    onPress={() => {
                      setSelectedId(r.id);
                      setMode('confirm');
                      setTableId('');
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={`Từ chối ${r.name}`}
                    secondary
                    onPress={() => {
                      setSelectedId(r.id);
                      setMode('reject');
                      setReason('');
                    }}
                  />
                </View>
              </View>
            )}
            {r.status === 'confirmed' && (
              <>
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {inWindow
                    ? 'Đang trong thời gian giữ bàn'
                    : now >= r.endTime
                      ? 'Đã hết khung giờ đặt bàn — liên hệ khách'
                      : 'Giữ bàn từ 30 phút trước giờ hẹn'}
                </Text>
                <Button
                  title="Khách đã đến · Mở phiên"
                  disabled={
                    !inWindow ||
                    !table?.active ||
                    !table.area ||
                    !!table.sessionId ||
                    table.needsCleaning ||
                    table.capacity < r.guests
                  }
                  onPress={() => {
                    if (
                      r.tableId &&
                      runCommand({
                        type: 'open',
                        tableId: r.tableId,
                        guests: r.guests,
                        reservationId: r.id,
                      })
                    )
                      router.push({
                        pathname: '/waiter/table/[id]',
                        params: { id: r.tableId },
                      });
                  }}
                />
              </>
            )}
          </Card>
        );
      })}
      {!rows.length && (
        <Empty text="Không có yêu cầu đặt bàn trong danh sách này." />
      )}
      {selected && (
        <Sheet
          title={
            mode === 'confirm'
              ? 'Xác nhận bàn phù hợp'
              : 'Từ chối yêu cầu đặt bàn'
          }
          onClose={() => setSelectedId('')}
        >
          <Text className="text-[17px] font-[700] text-[#183B32]">
            {selected.name} · {selected.guests} khách
          </Text>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            Khung giờ {time(selected.time)}–{time(selected.endTime)} ·{' '}
            {selected.phone}
          </Text>
          {mode === 'confirm' ? (
            <>
              <Notice text="Chọn bàn đang trống, đủ chỗ và không trùng lịch. Bàn được giữ từ 30 phút trước giờ hẹn đến hết khung giờ đặt." />
              <View className="flex-row flex-wrap gap-[10px]">
                {available.map((t) => (
                  <Pressable
                    key={t.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Chọn ${t.name}`}
                    accessibilityState={{ selected: tableId === t.id }}
                    onPress={() => setTableId(t.id)}
                    className="p-[14px] rounded-[12px] border-[1px]"
                    style={{
                      borderColor:
                        tableId === t.id ? colors.green : colors.line,
                      backgroundColor: tableId === t.id ? colors.mint : '#fff',
                    }}
                  >
                    <Text className="text-[14px] leading-[21px] text-[#183B32]">
                      {t.name}
                    </Text>
                    <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                      {t.capacity} chỗ · {t.area}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {!available.length && (
                <Empty text="Chưa có bàn phù hợp với khung giờ này." />
              )}
              <Button
                title="Xác nhận đặt bàn"
                disabled={
                  selected.status !== 'pending' ||
                  !available.some((t) => t.id === tableId)
                }
                onPress={() => {
                  if (
                    runCommand({
                      type: 'reservation',
                      reservationId: selected.id,
                      decision: 'confirmed',
                      tableId,
                    })
                  )
                    setSelectedId('');
                }}
              />
            </>
          ) : (
            <>
              <Field
                label="Lý do từ chối"
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={300}
              />
              <Button
                title="Xác nhận từ chối"
                danger
                disabled={!reason.trim() || selected.status !== 'pending'}
                onPress={() => {
                  if (
                    runCommand({
                      type: 'reservation',
                      reservationId: selected.id,
                      decision: 'rejected',
                      reason,
                    })
                  )
                    setSelectedId('');
                }}
              />
            </>
          )}
        </Sheet>
      )}
    </Page>
  );
}

export default function ReservationsScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveReservationsScreen /> : <DemoReservationsScreen />;
}
