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
import { ui } from '../../shared/utils/theme';
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
          <View style={ui.between}>
            <Text style={ui.h2}>{tableName(item.sessionId)}</Text>
            <Badge
              text={
                item.status === 'Ready'
                  ? `Chờ ${minutes(item.readyAt || now, now)} phút`
                  : 'Đã phục vụ'
              }
              tone={item.status === 'Ready' ? 'amber' : 'green'}
            />
          </View>
          <View style={ui.row}>
            <Image
              source={waiterMenu.find((d) => d.id === item.dishId)?.image}
              style={ui.image}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[ui.body, { fontWeight: '700' }]}>{item.name}</Text>
              <Text style={ui.muted}>
                Tổng {item.quantity} phần · Đã lên {item.served} phần
              </Text>
              {!!item.note && <Text style={ui.muted}>{item.note}</Text>}
              {item.servings?.map((serving) => (
                <Text key={serving.id} style={ui.small}>
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
          <Text style={ui.h2}>{selected.name}</Text>
          <Text style={ui.muted}>
            Chỉ xác nhận số phần bạn đã thực sự mang ra bàn.
          </Text>
          <Stepper
            value={quantity}
            onChange={setQuantity}
            max={Math.max(1, selected.quantity - selected.served)}
          />
          <Text style={ui.body}>
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
          <Text style={ui.small}>Nhân viên xác nhận: {state.waiter?.name}</Text>
        </Sheet>
      )}
    </Page>
  );
}

export default function ReadyScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <LiveReadyScreen /> : <DemoReadyScreen />;
}
