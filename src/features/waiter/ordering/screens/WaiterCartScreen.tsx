import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { store } from '@/app/store';
import {
  Button,
  Card,
  Empty,
  Field,
  Notice,
  Page,
  Stepper,
  Title,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { ui } from '../../shared/utils/theme';
import { money } from '../../shared/utils/rules';
import { authError } from '@/features/auth/api/authApi';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useOrderActions } from '../hooks/useOrders';
import {
  cartId,
  clearCart,
  completeCartSubmission,
  failCartSubmission,
  removeCartLine,
  startCartSubmission,
  updateCartLine,
} from '../store/cartSlice';

export default function WaiterCartScreen() {
  const { id, sessionId } = useLocalSearchParams<{
    id: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tables = useServiceTables();
  const table = tables.data?.find((t) => t.tableId === id);
  const key = cartId(id, sessionId);
  const cart = useAppSelector((s) => s.waiterCart.carts[key]);
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  const { create } = useOrderActions();
  const lines = cart?.lines ?? [];
  const locked = !!cart?.requestKey;
  const sending = cart?.status === 'sending';
  const active = !!table?.openSessionIds.includes(sessionId);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.quantity * line.price,
    0,
  );
  function continueOrdering() {
    router.replace({
      pathname: '/waiter/order/[id]',
      params: { id, sessionId },
    });
  }
  async function submit() {
    // Read Redux synchronously so repeated taps or a remounted screen cannot submit twice.
    const current = store.getState().waiterCart.carts[key];
    if (
      !active ||
      !apiMode ||
      !current?.lines.length ||
      current.status === 'sending'
    )
      return;
    const requestKey =
      current.requestKey ??
      `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    dispatch(startCartSubmission({ cartId: key, key: requestKey }));
    try {
      await create.mutateAsync({
        sessionId,
        tableId: id,
        key: requestKey,
        items: current.lines.map(({ itemId, quantity, note, options }) => ({
          itemId,
          quantity,
          note,
          options,
        })),
      });
      if (store.getState().waiterCart.carts[key]?.requestKey !== requestKey)
        return;
      dispatch(completeCartSubmission({ cartId: key, key: requestKey }));
      router.replace({ pathname: '/waiter/table/[id]', params: { id } });
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      dispatch(
        failCartSubmission({
          cartId: key,
          key: requestKey,
          error: authError(error),
          definitive:
            status !== undefined && [400, 403, 404, 409, 422].includes(status),
        }),
      );
    }
  }
  return (
    <View style={{ flex: 1 }}>
      <Page>
        <Title
          title={`Giỏ hàng · ${table?.tableCode || 'Bàn'}`}
          subtitle="Kiểm tra món đặt hộ khách trước khi gửi xuống bếp."
        />
        <QueryStatus query={tables} />
        {tables.isSuccess && !active && (
          <Notice
            error
            text="Phiên bàn đã đóng hoặc thay đổi. Giỏ này không thể gửi sang phiên khác."
          />
        )}
        {!lines.length && (
          <Empty text="Giỏ hàng chưa có món. Hãy chọn món để đặt hộ khách." />
        )}
        {lines.map((line) => (
          <Card key={line.id}>
            <Title title={line.name} subtitle={`${money(line.price)} / phần`} />
            {!!line.optionNames.length && (
              <Text style={ui.muted}>{line.optionNames.join(', ')}</Text>
            )}
            <Field
              label="Ghi chú cho bếp"
              value={line.note}
              editable={!locked}
              multiline
              maxLength={300}
              onChangeText={(note) =>
                dispatch(updateCartLine({ cartId: key, lineId: line.id, note }))
              }
            />
            <View style={ui.between}>
              <Stepper
                value={line.quantity}
                min={locked ? line.quantity : 1}
                max={locked ? line.quantity : 99}
                onChange={(quantity) =>
                  dispatch(
                    updateCartLine({ cartId: key, lineId: line.id, quantity }),
                  )
                }
              />
              <Text style={ui.money}>{money(line.price * line.quantity)}</Text>
            </View>
            <Button
              title="Xóa món"
              secondary
              disabled={locked}
              onPress={() =>
                dispatch(removeCartLine({ cartId: key, lineId: line.id }))
              }
            />
          </Card>
        ))}
        <Button
          title="Tiếp tục chọn món"
          secondary
          disabled={locked || !active}
          onPress={continueOrdering}
        />
        {!!lines.length && (
          <Button
            title="Xóa toàn bộ giỏ"
            secondary
            disabled={locked}
            onPress={() => dispatch(clearCart(key))}
          />
        )}
        {!!cart?.error && <Notice text={cart.error} error />}
        {cart?.status === 'uncertain' && (
          <Notice text="Chưa xác định được kết quả gửi. Kiểm tra đơn tại bàn hoặc thử lại cùng lượt gọi để tránh trùng đơn." />
        )}
        <Notice text="Giá tạm tính. Backend sẽ kiểm tra giá và tình trạng món khi gửi. Giỏ được giữ theo bàn và phiên trong lần mở ứng dụng này." />
        {locked && (
          <Button
            title="Kiểm tra order tại bàn"
            secondary
            onPress={() =>
              router.push({ pathname: '/waiter/table/[id]', params: { id } })
            }
          />
        )}
      </Page>
      <View style={[ui.card, { borderRadius: 0 }]}>
        <View style={ui.between}>
          <Text style={ui.h2}>{count} phần · Tạm tính</Text>
          <Text style={ui.money}>{money(total)}</Text>
        </View>
        <Button
          title={
            sending
              ? 'Đang gửi order…'
              : locked
                ? 'Thử gửi lại cùng lượt gọi'
                : 'Xác nhận đặt hộ và gửi bếp'
          }
          disabled={!apiMode || !active || !lines.length || sending}
          onPress={() => {
            void submit();
          }}
        />
      </View>
    </View>
  );
}
