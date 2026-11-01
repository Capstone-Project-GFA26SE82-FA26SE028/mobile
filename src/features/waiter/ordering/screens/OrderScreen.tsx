import LiveOrderScreen from './LiveOrderScreen';
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
import { colors } from '../../shared/utils/theme';
import { waiterMenu } from '../utils/menu';
import { matches, money } from '../../shared/utils/rules';
import { runCommand } from '../../shared/hooks/useWaiterCommands';
import type { Dish, DraftLine } from '../../shared/types/types';
function DemoOrderScreen() {
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
  if (
    !table?.active ||
    !session ||
    session.tableId !== table.id ||
    session.payment !== 'unpaid'
  )
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
          className="rounded-[18px] bg-[#fff] p-[17px] border-[1px] border-[#E5EBE7] gap-[10px] flex-row items-center"
          style={{ opacity: d.available ? 1 : 0.5 }}
        >
          <Image
            source={d.image}
            className="w-[66px] h-[66px] rounded-[14px] bg-[#EAF5EF]"
          />
          <View className="gap-[6px]" style={{ flex: 1 }}>
            <Text className="text-[14px] leading-[21px] text-[#183B32] font-[600]">
              {d.name}
            </Text>
            <Text className="text-[#12664C] text-[13px] font-[600]">
              {money(d.price)}
            </Text>
            {!d.available && <Badge text="Tạm hết món" tone="gray" />}
          </View>
          <View className="rounded-[10px] bg-[#EAF5EF] p-[7px]">
            <Icon name="add" size={20} />
          </View>
        </Pressable>
      ))}
      {!rows.length && <Empty text="Không có món phù hợp." />}
      {cart.length > 0 && (
        <Card>
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              {cart.reduce((n, l) => n + l.quantity, 0)} phần đã chọn
            </Text>
            <Text className="text-[#12664C] text-[18px] font-[700]">
              {money(total)}
            </Text>
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
            className="w-[100%] h-[160px] rounded-[14px]"
          />
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[#12664C] text-[18px] font-[700]">
              {money(dish.price)}
            </Text>
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
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            {table?.name} · {session.guests} khách
          </Text>
          {cart.map((line, i) => (
            <View
              key={i}
              className="gap-[10px] border-b-[1px] border-[#E5EBE7] pb-[14px]"
            >
              <View className="flex-row items-center justify-between gap-[10px]">
                <Text
                  className="text-[14px] leading-[21px] text-[#183B32] font-[600]"
                  style={{ flex: 1 }}
                >
                  {waiterMenu.find((d) => d.id === line.dishId)?.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bỏ món ${i + 1}`}
                  onPress={() =>
                    setCart(cart.filter((_, index) => i !== index))
                  }
                  className="p-[10px]"
                >
                  <Icon name="trash-outline" color={colors.red} size={18} />
                </Pressable>
              </View>
              <Field
                label={`Ghi chú món ${i + 1}`}
                value={line.note}
                onChangeText={(value) =>
                  setCart(
                    cart.map((l, j) => (i === j ? { ...l, note: value } : l)),
                  )
                }
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
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              Tổng tạm tính
            </Text>
            <Text className="text-[#12664C] text-[18px] font-[700]">
              {money(total)}
            </Text>
          </View>
          <Text className="text-[11px] leading-[16px] text-[#7C8983]">
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

export default function OrderScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveOrderScreen /> : <DemoOrderScreen />;
}
