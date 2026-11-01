import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Notice,
  Page,
  Search,
  Title,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { matches } from '../../shared/utils/rules';
import { useNow } from '../../shared/hooks/useWaiterCommands';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useReservations } from '../hooks/useReservations';
import {
  reservationCanCheckIn,
  reservationStatusLabel,
  reservationTabs,
} from '../utils/liveReservation';
import {
  ReservationSheet,
  type ReservationMode,
} from '../components/ReservationSheet';

export default function LiveReservationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('Chờ duyệt');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{
    id: string;
    mode: ReservationMode;
  } | null>(null);
  const [message, setMessage] = useState('');
  const reservations = useReservations(reservationTabs[tab]);
  const tables = useServiceTables();
  const now = useNow();
  const rows = [...(reservations.data ?? [])]
    .filter((r) => matches(`${r.contactName} ${r.phone}`, search))
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  function open(id: string, mode: ReservationMode) {
    setMessage('');
    setSelected({ id, mode });
  }
  return (
    <Page>
      <Title
        title="Đặt bàn trước"
        subtitle="Chuẩn bị một chỗ ngồi thật chu đáo cho khách."
      />
      <Chips
        options={Object.keys(reservationTabs)}
        value={tab}
        onChange={setTab}
      />
      <Search
        placeholder="Tìm tên hoặc số điện thoại…"
        value={search}
        onChange={setSearch}
      />
      {!!message && <Notice text={message} />}
      <QueryStatus query={reservations} />
      <Button
        title={reservations.isFetching ? 'Đang cập nhật…' : 'Làm mới danh sách'}
        secondary
        disabled={reservations.isFetching}
        onPress={() => {
          void reservations.refetch();
        }}
      />
      {rows.map((r) => (
        <Card key={r.reservationId}>
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text
              className="text-[17px] font-[700] text-[#183B32]"
              style={{ flex: 1 }}
            >
              {r.contactName}
            </Text>
            <Badge text={`${r.partySize} khách`} />
          </View>
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            {new Date(r.startAt).toLocaleString('vi-VN')} –{' '}
            {new Date(r.endAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {r.phone}
          </Text>
          <Badge
            text={reservationStatusLabel(r.status)}
            tone={
              r.status === 'Pending'
                ? 'amber'
                : r.status === 'Confirmed' || r.status === 'CheckedIn'
                  ? 'green'
                  : 'gray'
            }
          />
          {!!r.assignedTableIds.length && (
            <View className="flex-row flex-wrap gap-[10px]">
              {r.assignedTableIds.map((id) => {
                const table = tables.data?.find((t) => t.tableId === id);
                return (
                  <Badge
                    key={id}
                    text={
                      table
                        ? `${table.tableCode} · ${table.areaName}`
                        : `Bàn ${id.slice(0, 8)}`
                    }
                    tone="blue"
                  />
                );
              })}
            </View>
          )}
          <Button
            title="Xem chi tiết"
            secondary
            onPress={() => open(r.reservationId, 'detail')}
          />
          {r.status === 'Pending' && (
            <View className="flex-row items-center gap-[10px]">
              <View style={{ flex: 1 }}>
                <Button
                  title={`Duyệt ${r.contactName}`}
                  onPress={() => open(r.reservationId, 'confirm')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={`Từ chối ${r.contactName}`}
                  secondary
                  onPress={() => open(r.reservationId, 'reject')}
                />
              </View>
            </View>
          )}
          {r.status === 'Confirmed' && (
            <>
              <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                {reservationCanCheckIn(r, now)
                  ? 'Đang trong thời gian đón khách'
                  : 'Đón khách từ 30 phút trước giờ hẹn đến hạn giữ bàn'}
              </Text>
              <Button
                title="Khách đã đến"
                disabled={!reservationCanCheckIn(r, now)}
                onPress={() => open(r.reservationId, 'check-in')}
              />
              <Button
                title="Đổi lịch / bàn"
                secondary
                onPress={() => open(r.reservationId, 'update')}
              />
              <Button
                title="Hủy đặt bàn"
                secondary
                onPress={() => open(r.reservationId, 'cancel')}
              />
            </>
          )}
          {r.status === 'CheckedIn' &&
            r.assignedTableIds.map((id) => (
              <Button
                key={id}
                title={`Mở ${tables.data?.find((t) => t.tableId === id)?.tableCode || 'bàn phục vụ'}`}
                secondary
                onPress={() =>
                  router.push({
                    pathname: '/waiter/table/[id]',
                    params: { id },
                  })
                }
              />
            ))}
        </Card>
      ))}
      {reservations.isSuccess && !reservations.error && !rows.length && (
        <Empty text="Không có yêu cầu đặt bàn trong danh sách này." />
      )}
      {selected && (
        <ReservationSheet
          key={`${selected.id}:${selected.mode}`}
          id={selected.id}
          initialMode={selected.mode}
          onClose={() => setSelected(null)}
          onDone={(text) => {
            setSelected(null);
            setMessage(text);
          }}
        />
      )}
    </Page>
  );
}
