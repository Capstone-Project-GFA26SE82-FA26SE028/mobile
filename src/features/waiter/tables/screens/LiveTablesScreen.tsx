import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Chips,
  Empty,
  Icon,
  Page,
  Search,
  Title,
} from '../../shared/components/UI';
import { colors, ui } from '../../shared/utils/theme';
import { useServiceTables } from '../hooks/useTables';
import { useSessionOrders } from '../../ordering/hooks/useOrders';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { matches } from '../../shared/utils/rules';
export default function LiveTablesScreen() {
  const profile = useAppSelector((s) => s.waiter.waiter);
  const router = useRouter();
  const tables = useServiceTables();
  const apiTables = tables.data ?? [];
  const sessionIds = apiTables.flatMap((t) => t.openSessionIds);
  const orders = useSessionOrders(sessionIds);
  const activeTables = apiTables.map((t) => ({
    id: t.tableId,
    name: t.tableCode,
    area: t.areaName,
    sessionId: t.openSessionIds[0],
  }));
  const ready = (orders.data ?? [])
    .flatMap((o) => o.items.filter((i) => i.status === 'Ready'))
    .reduce((sum, i) => sum + i.quantity, 0);
  const pending = (orders.data ?? []).filter(
    (o) => o.source === 'Guest' && o.status === 'PendingConfirmation',
  ).length;
  const tableStatus = (table: (typeof activeTables)[number]) => {
    const source = apiTables.find((t) => t.tableId === table.id)!;
    if (source.openSessionIds.length) {
      return (orders.data ?? []).some(
        (o) =>
          source.openSessionIds.includes(o.tableSessionId) &&
          o.items.some((i) => i.status === 'Ready'),
      )
        ? 'Chờ trả món'
        : 'Có khách';
    }
    return source.cleaningStatus === 'Clean' ? 'Trống' : 'Cần dọn';
  };
  const [area, setArea] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
  const areas = [...new Set(activeTables.map((t) => t.area).filter(Boolean))];
  const rows = activeTables.filter(
    (t) =>
      (area === 'Tất cả' || t.area === area) &&
      (status === 'Tất cả' || tableStatus(t) === status) &&
      matches(t.name, query),
  );
  return (
    <Page>
      <Title
        title={`Xin chào, ${profile?.name || 'bạn'}!`}
        subtitle="Chúc bạn một ca làm việc thật thuận lợi."
        action={<Badge text="Ca phục vụ" />}
      />
      <Button
        title={`Đơn khách chờ xác nhận · ${orders.isSuccess || (tables.isSuccess && !sessionIds.length) ? pending : '…'}`}
        icon="receipt-outline"
        secondary
        onPress={() => router.push('/waiter/orders')}
      />
      <View style={ui.hero}>
        <View style={ui.between}>
          <Text style={{ color: '#DCECE3', fontSize: 12 }}>NHÀ HÀNG MỘC</Text>
          <View style={ui.row}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#9DD6B0',
              }}
            />
            <Text style={{ color: '#C3DECD', fontSize: 10 }}>Ca phục vụ</Text>
          </View>
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 21 }}>
          Mỗi bàn ăn, một trải nghiệm.
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 5 }}>
          {[
            {
              value: tables.isSuccess
                ? activeTables.filter((t) => t.sessionId).length
                : '—',
              label: 'Bàn có khách',
            },
            {
              value:
                orders.isSuccess || (tables.isSuccess && !sessionIds.length)
                  ? ready
                  : '—',
              label: 'Phần chờ lên',
            },
            {
              value: '—',
              label: 'Yêu cầu mới',
            },
          ].map((x, i) => (
            <View
              key={x.label}
              style={{
                flex: 1,
                gap: 5,
                borderLeftWidth: i ? 1 : 0,
                borderColor: '#ffffff20',
                paddingLeft: i ? 15 : 0,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700' }}>
                {typeof x.value === 'number'
                  ? String(x.value).padStart(2, '0')
                  : x.value}
              </Text>
              <Text style={{ color: '#BDD7C9', fontSize: 10 }}>{x.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {ready > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem món chờ phục vụ"
          onPress={() => router.push('/waiter/ready')}
          style={[
            ui.between,
            {
              padding: 13,
              borderRadius: 12,
              backgroundColor: '#FFF4DF',
              borderWidth: 1,
              borderColor: '#F2E5CB',
            },
          ]}
        >
          <View style={[ui.row, { flex: 1 }]}>
            <Icon name="restaurant-outline" color={colors.amber} size={20} />
            <Text style={{ fontSize: 12, color: '#8B6428', flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>
                {ready} phần món đã sẵn sàng.
              </Text>{' '}
              Mang đến khách ngay nhé!
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={colors.amber} />
        </Pressable>
      )}
      <QueryStatus query={tables} />
      {!!sessionIds.length && <QueryStatus query={orders} />}
      <View style={ui.between}>
        <Text accessibilityRole="header" style={ui.h2}>
          Sơ đồ bàn
        </Text>
        <Text style={ui.small}>
          {activeTables.length} bàn · {areas.length} khu vực
        </Text>
      </View>
      <Chips options={['Tất cả', ...areas]} value={area} onChange={setArea} />
      <Search value={query} onChange={setQuery} placeholder="Tìm số bàn…" />
      <View style={[ui.wrap, { gap: 12 }]}>
        {['Tất cả', 'Trống', 'Có khách', 'Chờ trả món', 'Cần dọn'].map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`Lọc ${s}`}
            onPress={() => setStatus(s)}
            style={ui.row}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  s === 'Trống'
                    ? '#9BAEA1'
                    : s === 'Chờ trả món'
                      ? '#D69A39'
                      : s === 'Cần dọn'
                        ? colors.red
                        : colors.green,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: status === s ? colors.green : colors.muted,
                fontWeight: status === s ? '700' : '400',
                textDecorationLine: status === s ? 'underline' : 'none',
              }}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        onLayout={({ nativeEvent }) => setGridWidth(nativeEvent.layout.width)}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
      >
        {rows.map((table) => {
          const label = tableStatus(table);
          const tone =
            label === 'Chờ trả món'
              ? 'amber'
              : label === 'Cần dọn'
                ? 'red'
                : label === 'Trống'
                  ? 'gray'
                  : 'green';
          return (
            <Pressable
              key={table.id}
              accessibilityRole="button"
              accessibilityLabel={`${table.name}, ${label}`}
              onPress={() =>
                router.push({
                  pathname: '/waiter/table/[id]',
                  params: { id: table.id },
                })
              }
              style={({ pressed }) => ({
                width: gridWidth > 0 ? (gridWidth - 12) / 2 : '47.8%',
                flexGrow: 0,
                flexShrink: 0,
                padding: 15,
                borderRadius: 17,
                backgroundColor: label === 'Chờ trả món' ? '#FFFAEF' : '#fff',
                borderWidth: 1,
                borderColor:
                  label === 'Chờ trả món'
                    ? '#EED9AE'
                    : label === 'Có khách'
                      ? '#BEDCCB'
                      : colors.line,
                gap: 12,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={ui.between}>
                <Icon
                  name="restaurant-outline"
                  size={25}
                  color={
                    label === 'Trống'
                      ? '#A0B0A5'
                      : label === 'Chờ trả món'
                        ? colors.amber
                        : colors.green
                  }
                />
                <Text style={ui.small}>{table.area}</Text>
              </View>
              <Text
                style={{ fontSize: 20, fontWeight: '700', color: colors.text }}
              >
                {table.name}
              </Text>
              <Badge text={label} tone={tone} />
              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: colors.line,
                  paddingTop: 10,
                }}
              >
                <Text style={ui.small}>{table.area}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {tables.isSuccess && !rows.length && (
        <Empty text="Không tìm thấy bàn phù hợp với bộ lọc." />
      )}
      <Text style={[ui.small, { textAlign: 'center' }]}>
        Trạng thái cập nhật mỗi 5 giây · —: chưa có dữ liệu
      </Text>
    </Page>
  );
}
