import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Icon,
  Page,
  Search,
  Sheet,
  Stepper,
  Title,
} from '../../shared/components/UI';
import { colors, ui } from '../../shared/theme';
import { waiterMenu } from '../../shared/data/menu';
import { matches, money } from '../../shared/rules';
import { runCommand } from '../../shared/hooks';
import type { Dish, DraftLine } from '../../shared/types';
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppSelector((s) => s.waiter);
  const router = useRouter();
  const sent = useRef(false);
  const table = state.tables.find((t) => t.id === id);
  const session = state.sessions.find((s) => s.id === table?.sessionId);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [cart, setCart] = useState<DraftLine[]>([]);
  const [dish, setDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [review, setReview] = useState(false);
  if (!table?.active || !session || session.tableId !== table.id || session.payment !== 'unpaid')
    return (
      <Page>
        <Empty text="Phiên bàn chưa mở hoặc đang thanh toán, không thể nhận thêm món." />
        <Button
          title="Về sơ đồ bàn"
          onPress={() => router.replace('/waiter/tables')}
        />
      </Page>
    );
  const rows = waiterMenu.filter(
    (d) =>
      matches(d.name, query) &&
      (category === 'Tất cả' || d.category === category),
  );
  const total = cart.reduce(
    (n, l) => n + waiterMenu.find((d) => d.id === l.dishId)!.price * l.quantity,
    0,
  );
  return (
    <Page>
      <Title
        title={`Gọi món · ${table?.name}`}
        subtitle="Chọn món và ghi chú theo yêu cầu của khách."
      />
      <Search
        value={query}
        onChange={setQuery}
        placeholder="Tìm món ăn, đồ uống…"
      />
      <Chips
        options={['Tất cả', 'Khai vị', 'Món chính', 'Đồ uống']}
        value={category}
        onChange={setCategory}
      />
      {rows.map((d) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chọn ${d.name}`}
          accessibilityState={{ disabled: !d.available }}
          disabled={!d.available}
          key={d.id}
          onPress={() => {
            setDish(d);
            setQuantity(1);
            setNote('');
          }}
          style={[ui.card, ui.row, { opacity: d.available ? 1 : 0.5 }]}
        >
          <Image source={d.image} style={ui.image} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[ui.body, { fontWeight: '600' }]}>{d.name}</Text>
            <Text style={ui.link}>{money(d.price)}</Text>
            {!d.available && <Badge text="Tạm hết món" tone="gray" />}
          </View>
          <View
            style={{
              borderRadius: 10,
              backgroundColor: colors.mint,
              padding: 7,
            }}
          >
            <Icon name="add" size={20} />
          </View>
        </Pressable>
      ))}
      {!rows.length && <Empty text="Không có món phù hợp." />}
      {cart.length > 0 && (
        <Card>
          <View style={ui.between}>
            <Text style={ui.h2}>
              {cart.reduce((n, l) => n + l.quantity, 0)} phần đã chọn
            </Text>
            <Text style={ui.money}>{money(total)}</Text>
          </View>
          <Button
            title="Xem và xác nhận gọi món"
            icon="receipt-outline"
            onPress={() => setReview(true)}
          />
        </Card>
      )}
      {dish && (
        <Sheet title={dish.name} onClose={() => setDish(null)}>
          <Image
            source={dish.image}
            style={{ width: '100%', height: 160, borderRadius: 14 }}
          />
          <View style={ui.between}>
            <Text style={ui.money}>{money(dish.price)}</Text>
            <Stepper value={quantity} onChange={setQuantity} />
          </View>
          <Field
            label="Ghi chú cho bếp"
            placeholder="Ít cay, không hành…"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={300}
          />
          <Button
            title={`Thêm vào lượt gọi · ${money(dish.price * quantity)}`}
            onPress={() => {
              setCart([...cart, { dishId: dish.id, quantity, note }]);
              setDish(null);
            }}
          />
        </Sheet>
      )}
      {review && (
        <Sheet title="Xác nhận lượt gọi món" onClose={() => setReview(false)}>
          <Text style={ui.muted}>
            {table?.name} · {session.guests} khách
          </Text>
          {cart.map((line, i) => (
            <View
              key={i}
              style={{
                gap: 10,
                borderBottomWidth: 1,
                borderColor: colors.line,
                paddingBottom: 14,
              }}
            >
              <View style={ui.between}>
                <Text style={[ui.body, { flex: 1, fontWeight: '600' }]}>
                  {waiterMenu.find((d) => d.id === line.dishId)?.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bỏ món ${i + 1}`}
                  onPress={() =>
                    setCart(cart.filter((_, index) => i !== index))
                  }
                  style={{ padding: 10 }}
                >
                  <Icon name="trash-outline" color={colors.red} size={18} />
                </Pressable>
              </View>
              <Field
                label={`Ghi chú món ${i + 1}`}
                value={line.note}
                onChangeText={(value) => setCart(cart.map((l, j) => i === j ? { ...l, note: value } : l))}
                placeholder="Ít cay, không hành…"
                multiline
                maxLength={300}
              />
              <Stepper
                value={line.quantity}
                onChange={(value) =>
                  setCart(
                    cart.map((l, j) =>
                      i === j ? { ...l, quantity: value } : l,
                    ),
                  )
                }
              />
            </View>
          ))}
          <View style={ui.between}>
            <Text style={ui.h2}>Tổng tạm tính</Text>
            <Text style={ui.money}>{money(total)}</Text>
          </View>
          <Text style={ui.small}>
            Lượt gọi sẽ xuất hiện ở trạng thái chờ chế biến trong phiên dùng
            thử.
          </Text>
          <Button
            title="Xác nhận gọi món"
            disabled={!cart.length}
            onPress={() => {
              if (sent.current) return;
              sent.current = true;
              if (
                runCommand({
                  type: 'order',
                  sessionId: session.id,
                  lines: cart,
                })
              ) {
                setReview(false);
                setCart([]);
                router.replace({
                  pathname: '/waiter/table/[id]',
                  params: { id },
                });
              } else sent.current = false;
            }}
          />
        </Sheet>
      )}
    </Page>
  );
}
