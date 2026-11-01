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
import { colors } from '../../shared/utils/theme';
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
      <View className="bg-[#093E30] rounded-[20px] p-[21px] gap-[12px]">
        <View className="flex-row items-center justify-between gap-[10px]">
          <Text className="text-[#DCECE3] text-[12px]">NHÀ HÀNG MỘC</Text>
          <View className="flex-row items-center gap-[10px]">
            <View className="w-[6px] h-[6px] rounded-[3px] bg-[#9DD6B0]" />
            <Text className="text-[#C3DECD] text-[10px]">Ca phục vụ</Text>
          </View>
        </View>
        <Text className="text-[#fff] font-[700] text-[21px]">
          Mỗi bàn ăn, một trải nghiệm.
        </Text>
        <View className="flex-row mt-[5px]">
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
              className="gap-[5px] border-[#ffffff20]"
              style={{
                flex: 1,
                borderLeftWidth: i ? 1 : 0,
                paddingLeft: i ? 15 : 0,
              }}
            >
              <Text className="text-[#fff] text-[26px] font-[700]">
                {typeof x.value === 'number'
                  ? String(x.value).padStart(2, '0')
                  : x.value}
              </Text>
              <Text className="text-[#BDD7C9] text-[10px]">{x.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {ready > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem món chờ phục vụ"
          onPress={() => router.push('/waiter/ready')}
          className="flex-row items-center justify-between gap-[10px] p-[13px] rounded-[12px] bg-[#FFF4DF] border-[1px] border-[#F2E5CB]"
        >
          <View
            className="flex-row items-center gap-[10px]"
            style={{ flex: 1 }}
          >
            <Icon name="restaurant-outline" color={colors.amber} size={20} />
            <Text className="text-[12px] text-[#8B6428]" style={{ flex: 1 }}>
              <Text className="font-[700]">{ready} phần món đã sẵn sàng.</Text>{' '}
              Mang đến khách ngay nhé!
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={colors.amber} />
        </Pressable>
      )}
      <QueryStatus query={tables} />
      {!!sessionIds.length && <QueryStatus query={orders} />}
      <View className="flex-row items-center justify-between gap-[10px]">
        <Text
          accessibilityRole="header"
          className="text-[17px] font-[700] text-[#183B32]"
        >
          Sơ đồ bàn
        </Text>
        <Text className="text-[11px] leading-[16px] text-[#7C8983]">
          {activeTables.length} bàn · {areas.length} khu vực
        </Text>
      </View>
      <Chips options={['Tất cả', ...areas]} value={area} onChange={setArea} />
      <Search value={query} onChange={setQuery} placeholder="Tìm số bàn…" />
      <View className="flex-row flex-wrap gap-[12px]">
        {['Tất cả', 'Trống', 'Có khách', 'Chờ trả món', 'Cần dọn'].map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`Lọc ${s}`}
            onPress={() => setStatus(s)}
            className="flex-row items-center gap-[10px]"
          >
            <View
              className="w-[6px] h-[6px] rounded-[3px]"
              style={{
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
              className="text-[11px]"
              style={{
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
        className="flex-row flex-wrap gap-[12px]"
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
              className="p-[15px] rounded-[17px] border-[1px] gap-[12px] opacity-[1] active:opacity-[0.75]"
              style={{
                width: gridWidth > 0 ? (gridWidth - 12) / 2 : '47.8%',
                flexGrow: 0,
                flexShrink: 0,
                backgroundColor: label === 'Chờ trả món' ? '#FFFAEF' : '#fff',
                borderColor:
                  label === 'Chờ trả món'
                    ? '#EED9AE'
                    : label === 'Có khách'
                      ? '#BEDCCB'
                      : colors.line,
              }}
            >
              <View className="flex-row items-center justify-between gap-[10px]">
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
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {table.area}
                </Text>
              </View>
              <Text className="text-[20px] font-[700] text-[#183B32]">
                {table.name}
              </Text>
              <Badge text={label} tone={tone} />
              <View className="border-t-[1px] border-[#E5EBE7] pt-[10px]">
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {table.area}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {tables.isSuccess && !rows.length && (
        <Empty text="Không tìm thấy bàn phù hợp với bộ lọc." />
      )}
      <Text className="text-[11px] leading-[16px] text-[#7C8983] text-center">
        Trạng thái cập nhật mỗi 5 giây · —: chưa có dữ liệu
      </Text>
    </Page>
  );
}
