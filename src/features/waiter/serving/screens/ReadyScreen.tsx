import LiveReadyScreen from './LiveReadyScreen';
import { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Page,
  Notice,
  Sheet,
  Stepper,
  Title,
} from '../../shared/components/UI';
import { waiterMenu } from '../../ordering/utils/menu';
import { minutes } from '../../shared/utils/rules';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
function DemoReadyScreen() {
  const state = useAppSelector((s) => s.waiter);
  const now = useNow();
  const [tab, setTab] = useState('Chờ lên món');
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewedServed, setReviewedServed] = useState(0);
  const sending = useRef(false);
  const selected = state.items.find((i) => i.id === selectedId);
  const changed =
    !!selected &&
    (selected.status !== 'Ready' || selected.served !== reviewedServed);
  const items = state.items
    .filter((i) =>
      tab === 'Chờ lên món' ? i.status === 'Ready' : i.served > 0,
    )
    .sort((a, b) => (a.readyAt || 0) - (b.readyAt || 0));
  const tableName = (sessionId: string) =>
    state.tables.find((t) => t.sessionId === sessionId)?.name ||
    'Phiên đã đóng';
  return (
    <Page>
      <Title
        title="Món chờ phục vụ"
        subtitle="Món ngon đã sẵn sàng, mang đến khách thôi."
        action={
          <Badge
            text={`${state.items.filter((i) => i.status === 'Ready').length} món`}
            tone="amber"
          />
        }
      />
      <Chips
        options={['Chờ lên món', 'Đã phục vụ']}
        value={tab}
        onChange={setTab}
      />
      {items.map((item) => (
        <Card key={item.id}>
          <View className="flex-row items-center justify-between gap-[10px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              {tableName(item.sessionId)}
            </Text>
            <Badge
              text={
                item.status === 'Ready'
                  ? `Chờ ${minutes(item.readyAt || now, now)} phút`
                  : 'Đã phục vụ'
              }
              tone={item.status === 'Ready' ? 'amber' : 'green'}
            />
          </View>
          <View className="flex-row items-center gap-[10px]">
            <Image
              source={waiterMenu.find((d) => d.id === item.dishId)?.image}
              className="w-[66px] h-[66px] rounded-[14px] bg-[#EAF5EF]"
            />
            <View className="gap-[6px]" style={{ flex: 1 }}>
              <Text className="text-[14px] leading-[21px] text-[#183B32] font-[700]">
                {item.name}
              </Text>
              <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                Tổng {item.quantity} phần · Đã lên {item.served} phần
              </Text>
              {!!item.note && (
                <Text className="text-[12px] leading-[19px] text-[#7C8983]">
                  {item.note}
                </Text>
              )}
              {item.servings?.map((serving) => (
                <Text
                  key={serving.id}
                  className="text-[11px] leading-[16px] text-[#7C8983]"
                >
                  {serving.waiterName} · Đã lên {serving.quantity} phần
                </Text>
              ))}
            </View>
          </View>
          {item.status === 'Ready' && (
            <Button
              title={`Xác nhận lên món · còn ${item.quantity - item.served} phần`}
              icon="checkmark-circle-outline"
              onPress={() => {
                runCommand({ type: 'seen', itemId: item.id });
                setSelectedId(item.id);
                setReviewedServed(item.served);
                sending.current = false;
                setQuantity(item.quantity - item.served);
              }}
            />
          )}
        </Card>
      ))}
      {!items.length && (
        <Empty
          text={
            tab === 'Chờ lên món'
              ? 'Đã phục vụ hết món sẵn sàng. Hãy tiếp tục theo dõi bếp.'
              : 'Chưa có món được xác nhận đã lên bàn.'
          }
        />
      )}
      {selected && (
        <Sheet
          title={`Lên món · ${tableName(selected.sessionId)}`}
          onClose={() => setSelectedId('')}
        >
          <Text className="text-[17px] font-[700] text-[#183B32]">
            {selected.name}
          </Text>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            Chỉ xác nhận số phần bạn đã thực sự mang ra bàn.
          </Text>
          <Stepper
            value={quantity}
            onChange={setQuantity}
            max={Math.max(1, selected.quantity - selected.served)}
          />
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Sau xác nhận: {selected.served + quantity}/{selected.quantity} phần
            đã phục vụ.
          </Text>
          <Button
            title="Xác nhận đã lên bàn"
            disabled={
              changed ||
              quantity < 1 ||
              quantity > selected.quantity - selected.served
            }
            onPress={() => {
              if (sending.current) return;
              sending.current = true;
              if (
                runCommand({
                  type: 'serve',
                  itemId: selected.id,
                  quantity,
                  expectedServed: reviewedServed,
                })
              )
                setSelectedId('');
              else sending.current = false;
            }}
          />
          {changed && (
            <Notice
              text="Số phần hoặc trạng thái món đã thay đổi. Đóng bảng này và mở lại để kiểm tra."
              error
            />
          )}
          <Text className="text-[11px] leading-[16px] text-[#7C8983]">
            Nhân viên xác nhận: {state.waiter?.name}
          </Text>
        </Sheet>
      )}
    </Page>
  );
}

export default function ReadyScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveReadyScreen /> : <DemoReadyScreen />;
}
