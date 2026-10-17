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
  Title,
} from '../../shared/components/UI';
import { colors, ui } from '../../shared/theme';
import { useNow } from '../../shared/hooks';
import { matches, minutes, tableStatus } from '../../shared/rules';
export default function TablesScreen() {
  const state = useAppSelector((s) => s.waiter);
  const router = useRouter();
  const now = useNow();
  const [area, setArea] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const ready = state.items
    .filter((i) => i.status === 'Ready')
    .reduce((n, i) => n + i.quantity - i.served, 0);
  const rows = state.tables.filter(
    (t) =>
      (area === 'Tất cả' || t.area === area) &&
      (status === 'Tất cả' || tableStatus(state, t, now) === status) &&
      matches(t.name, query),
  );
  return (
    <Page>
      <Title
        title="Xin chào, Hoàng!"
        subtitle="Chúc bạn một ca làm việc thật thuận lợi."
        action={<Badge text="Ca phục vụ" />}
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
            <Text style={{ color: '#C3DECD', fontSize: 10 }}>
              Đang dùng thử
            </Text>
          </View>
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 21 }}>
          Mỗi bàn ăn, một trải nghiệm.
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 5 }}>
          {[
            {
              value: state.tables.filter((t) => t.sessionId).length,
              label: 'Bàn có khách',
            },
            { value: ready, label: 'Phần chờ lên' },
            {
              value: state.requests.filter((r) => r.status !== 'done').length,
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
                {String(x.value).padStart(2, '0')}
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
      <View style={ui.between}>
        <Text accessibilityRole="header" style={ui.h2}>
          Sơ đồ bàn
        </Text>
        <Text style={ui.small}>{state.tables.length} bàn · 3 khu vực</Text>
      </View>
      <Chips
        options={['Tất cả', 'Tầng 1', 'Tầng 2', 'Sân vườn']}
        value={area}
        onChange={setArea}
      />
      <Search value={query} onChange={setQuery} placeholder="Tìm số bàn…" />
      <View style={[ui.wrap, { gap: 12 }]}>
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {rows.map((table) => {
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
              style={({ pressed }) => ({
                width: '47.8%',
                flexGrow: 1,
                minWidth: 130,
                maxWidth: 260,
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
                <Text style={ui.small}>{table.capacity} chỗ</Text>
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
                <Text style={ui.small}>
                  {session
                    ? `${session.guests} khách · ${minutes(session.openedAt, now)} phút`
                    : table.area}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!rows.length && <Empty text="Không tìm thấy bàn phù hợp với bộ lọc." />}
      <Text style={[ui.small, { textAlign: 'center' }]}>
        Dữ liệu mẫu · Trạng thái cập nhật theo thao tác trong ứng dụng
      </Text>
    </Page>
  );
}
