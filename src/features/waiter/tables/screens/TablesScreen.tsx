import { TableOverview } from '../components/TableOverview';
import { TableGrid } from '../components/TableGrid';
import LiveTablesScreen from './LiveTablesScreen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Chips,
  Empty,
  Icon,
  Page,
  Search,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import { useNow } from '../../shared/hooks/useWaiterCommands';
import { matches, minutes, tableStatus } from '../../shared/utils/rules';
function DemoTablesScreen() {
  const state = useAppSelector((s) => s.waiter);
  const router = useRouter();
  const now = useNow();
  const [area, setArea] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const activeTables = state.tables.filter((t) => t.active);
  const areas = [...new Set(activeTables.map((t) => t.area).filter(Boolean))];
  const ready = state.items
    .filter((i) => i.status === 'Ready')
    .reduce((n, i) => n + i.quantity - i.served, 0);
  const rows = activeTables.filter(
    (t) =>
      (area === 'Tất cả' || t.area === area) &&
      (status === 'Tất cả' || tableStatus(state, t, now) === status) &&
      matches(t.name, query),
  );
  return (
    <Page>
      <TableOverview
        name={state.waiter?.name || 'Nhân viên phục vụ'}
        occupied={activeTables.filter((table) => table.sessionId).length}
        ready={ready}
        pending={state.customerOrders.filter((order) => order.status === 'awaiting_confirmation').length}
        onOpenOrders={() => router.push('/waiter/orders')}
      />
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
        {[
          'Tất cả',
          'Trống',
          'Có khách',
          'Chờ trả món',
          'Cần dọn',
          'Giữ chỗ',
        ].map((s) => (
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
      <TableGrid
        items={rows}
        getKey={(table) => table.id}
        renderItem={(table) => {
          const label = tableStatus(state, table, now);
          const session = state.sessions.find((s) => s.id === table.sessionId);
          const tone =
            label === 'Chờ trả món'
              ? 'amber'
              : label === 'Cần dọn'
                ? 'red'
                : label === 'Giữ chỗ'
                  ? 'blue'
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
                flex: 1,
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
                  {table.capacity} chỗ
                </Text>
              </View>
              <Text className="text-[20px] font-[700] text-[#183B32]">
                {table.name}
              </Text>
              <Badge text={label} tone={tone} />
              <View className="border-t-[1px] border-[#E5EBE7] pt-[10px]">
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {session
                    ? `${session.guests} khách · ${minutes(session.openedAt, now)} phút`
                    : table.area}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      {!rows.length && <Empty text="Không tìm thấy bàn phù hợp với bộ lọc." />}
      <Text className="text-[11px] leading-[16px] text-[#7C8983] text-center">
        Dữ liệu mẫu · Trạng thái cập nhật theo thao tác trong ứng dụng
      </Text>
    </Page>
  );
}

export default function TablesScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveTablesScreen /> : <DemoTablesScreen />;
}
