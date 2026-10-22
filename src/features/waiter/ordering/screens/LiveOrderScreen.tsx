import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Badge, Button, Card, Chips, Empty, Field, Notice, Page, Search, Sheet, Stepper, Title } from '../../shared/components/UI';
import { money } from '../../shared/rules';
import { ui } from '../../shared/theme';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useWaiterMenu, useMenuItem } from '../hooks/useMenu';
import type { MenuItem } from '../../api/types';
import { addCartLine, cartId } from '../cartSlice';


export default function LiveOrderScreen() {
  const { id, sessionId: routeSessionId } = useLocalSearchParams<{ id: string; sessionId?: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const tables = useServiceTables();
  const menu = useWaiterMenu();
  const table = tables.data?.find(t => t.tableId === id);
  const sessions = table?.openSessionIds ?? [];
  const [chosenSession, setChosenSession] = useState(routeSessionId || '');
  const sessionId = sessions.length === 1 ? sessions[0] : sessions.find(s => s === chosenSession);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const draft = useAppSelector(s => s.waiterCart.carts[cartId(id, sessionId || '')]);
  const cart = draft?.lines ?? [];
  const [added, setAdded] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const detail = useMenuItem(itemId);
  const dish = detail.data;
  const allOptions = dish?.optionGroups.flatMap(g => g.options) ?? [];
  const optionsValid = !!dish && dish.optionGroups.every(group => {
    const count = group.options.reduce((sum, option) => sum + (selected[option.optionId] || 0), 0);
    return count >= group.minSelection && count <= group.maxSelection &&
      group.options.every(option => !selected[option.optionId] || option.canSelect);
  });
  function unitPrice(item: MenuItem) {
    return (item.price ?? 0) + allOptions.reduce((sum, o) => sum + o.extraPrice * (selected[o.optionId] || 0), 0);
  }
  const locked = !!draft?.requestKey;
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  function openCart() {
    if (sessionId) router.push({ pathname: '/waiter/cart/[id]', params: { id, sessionId } });
  }
  const rows = (menu.data ?? []).filter(d => d.itemName.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
    (category === 'Tất cả' || d.categoryName === category));
  return <View style={{ flex: 1 }}>
    <Page>
    <Title title={`Gọi món · ${table?.tableCode || ''}`} subtitle="Giá và khả dụng được backend kiểm tra lại khi gửi." />
    <Button title={count ? `Giỏ hàng · ${count} phần` : 'Giỏ hàng'} icon="cart-outline" secondary disabled={!sessionId} onPress={openCart} />
    {!!added && <Notice text={added} />}
    {locked && <Notice text="Lượt gọi này đã gửi và đang chờ kết quả. Mở giỏ để kiểm tra hoặc thử lại." />}
    <QueryStatus query={tables} />
    <QueryStatus query={menu} />
    {tables.isSuccess && !sessions.length && <Notice error text="Bàn chưa mở phiên hoặc không còn phục vụ. Vui lòng quay lại bàn." />}
    {sessions.length > 1 && <>
      <Notice text="Bàn có nhiều phiên. Chọn đúng phiên trước khi gửi order." />
      <Chips options={sessions} value={chosenSession} onChange={value => { if (!locked) setChosenSession(value); }} />
    </>}
    <Search value={search} onChange={setSearch} placeholder="Tìm món…" />
    <Chips options={['Tất cả', ...new Set((menu.data ?? []).map(d => d.categoryName))]} value={category} onChange={setCategory} />
    {rows.map(item => <Card key={item.itemId}>
      {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 140, borderRadius: 12 }} />}
      <Title title={item.itemName} subtitle={item.categoryName} />
      {!!item.description && <Text style={ui.muted}>{item.description}</Text>}
      <Text style={ui.money}>{item.price === null ? 'Chưa có giá' : money(item.price)}</Text>
      {!item.canOrder && <Badge text="Hiện không nhận món" tone="gray" />}
      <Button title="Chọn món" disabled={!item.canOrder || !sessionId || locked} onPress={() => {
        setQuantity(1); setNote(''); setSelected({}); setItemId(item.itemId);
      }} />
    </Card>)}
    {menu.isSuccess && !rows.length && <Empty text="Không có món phù hợp." />}
    {itemId && <Sheet title={dish?.itemName || 'Chi tiết món'} onClose={() => setItemId(null)}>
      <QueryStatus query={detail} />
      {dish && <>
        <Stepper value={quantity} onChange={setQuantity} />
        {dish.optionGroups.map(group => <Card key={group.optionGroupId}>
          <Text style={ui.h2}>{group.optionGroupName}</Text>
          <Text style={ui.small}>Chọn từ {group.minSelection} đến {group.maxSelection}</Text>
          {group.options.map(option => <Button key={option.optionId} secondary disabled={!option.canSelect}
            title={`${selected[option.optionId] ? '✓ ' : ''}${option.optionName} · +${money(option.extraPrice)}`}
            onPress={() => setSelected(current => {
              if (current[option.optionId]) return { ...current, [option.optionId]: 0 };
              const next = { ...current };
              if (group.maxSelection === 1) group.options.forEach(o => { next[o.optionId] = 0; });
              return { ...next, [option.optionId]: 1 };
            })} />)}
        </Card>)}
        <Field label="Ghi chú cho bếp" value={note} onChangeText={setNote} multiline maxLength={300} />
        {!optionsValid && <Notice text="Vui lòng chọn tùy chọn đúng số lượng yêu cầu." />}
        <Button title={`Thêm vào giỏ · ${money(unitPrice(dish) * quantity)}`} disabled={locked || !dish.canOrder || !optionsValid || detail.isFetching}
          onPress={() => {
            if (!sessionId) return;
            dispatch(addCartLine({ tableId: id, sessionId, line: {
              id: `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
              itemId: dish.itemId, name: dish.itemName, quantity, note,
              price: unitPrice(dish), optionNames: allOptions.filter(o => selected[o.optionId]).map(o => o.optionName),
              options: Object.entries(selected).filter(([, n]) => n > 0).map(([optionId, quantity]) => ({ optionId, quantity })) } }));
            setAdded(`Đã thêm ${quantity} × ${dish.itemName} vào giỏ.`);
            setItemId(null);
          }} />
      </>}
    </Sheet>}
    </Page>
    <View style={[ui.card, { borderRadius: 0 }]}>
      <View style={ui.between}>
        <Text style={ui.h2}>Giỏ đặt hộ · {count} phần</Text>
        <Text style={ui.money}>{money(total)}</Text>
      </View>
      <Button title={count ? 'Xem giỏ hàng và đặt món' : 'Xem giỏ hàng'} icon="cart-outline" disabled={!sessionId} onPress={openCart} />
    </View>
  </View>;
}
