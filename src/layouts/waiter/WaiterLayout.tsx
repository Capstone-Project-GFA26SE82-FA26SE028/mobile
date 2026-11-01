import { useEffect, useRef } from 'react';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { AppState, Pressable, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearFeedback } from '@/features/waiter/shared/store/waiterSlice';
import { Icon, type IconName } from '@/features/waiter/shared/components/UI';
import { colors } from '@/features/waiter/shared/utils/theme';
import { hasWaiterSession } from '@/features/waiter/auth/utils/session';
import { useServiceTables } from '@/features/waiter/tables/hooks/useTables';
import { useSessionOrders } from '@/features/waiter/ordering/hooks/useOrders';
const tabs: {
  path:
    | '/waiter/tables'
    | '/waiter/ready'
    | '/waiter/requests'
    | '/waiter/reservations'
    | '/waiter/account';
  title: string;
  icon: IconName;
}[] = [
  { path: '/waiter/tables', title: 'Bàn', icon: 'grid-outline' },
  { path: '/waiter/ready', title: 'Lên món', icon: 'restaurant-outline' },
  { path: '/waiter/requests', title: 'Yêu cầu', icon: 'notifications-outline' },
  { path: '/waiter/reservations', title: 'Đặt bàn', icon: 'calendar-outline' },
  { path: '/waiter/account', title: 'Cá nhân', icon: 'person-outline' },
];
export default function WaiterLayout() {
  const state = useAppSelector((s) => s.waiter);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = hasWaiterSession(state);
  const apiMode = state.authMode === 'api';
  const liveTables = useServiceTables(signedIn && apiMode);
  const liveOrders = useSessionOrders(
    signedIn && apiMode
      ? (liveTables.data ?? []).flatMap((t) => t.openSessionIds)
      : [],
  );
  const liveReady = (liveOrders.data ?? []).flatMap((order) =>
    order.items
      .filter((item) => item.status === 'Ready')
      .map((item) => ({
        id: item.orderItemId,
        sessionId: order.tableSessionId,
        name: item.nameSnapshot,
        quantity: item.quantity,
        note: item.note,
      })),
  );
  const unread = apiMode
    ? liveReady.length
    : state.items.filter((i) => i.status === 'Ready' && !i.seen).length;
  const requests = state.requests.filter((r) => r.status !== 'done').length;
  const announced = useRef(new Set<string>());
  const unseenItems = apiMode
    ? liveReady
    : state.items.filter((i) => i.status === 'Ready' && !i.seen);
  useEffect(() => {
    if (!signedIn || !state.alerts) {
      announced.current.clear();
      return;
    }
    const ready = state.items.filter((i) => i.status === 'Ready' && !i.seen);
    const keys = new Set(ready.map((i) => `${i.id}:${i.readyAt}`));
    announced.current = new Set(
      [...announced.current].filter((key) => keys.has(key)),
    );
    const announce = () => {
      if (AppState.currentState !== 'active') {
        Vibration.cancel();
        return;
      }
      const hasNew = ready.some(
        (i) => !announced.current.has(`${i.id}:${i.readyAt}`),
      );
      if (hasNew) Vibration.vibrate(250);
      ready.forEach((i) => announced.current.add(`${i.id}:${i.readyAt}`));
    };
    announce();
    const subscription = AppState.addEventListener('change', announce);
    return () => subscription.remove();
  }, [state.items, state.alerts, signedIn]);
  useEffect(() => {
    if (!state.alerts || !unread || !signedIn) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') Vibration.vibrate(250);
    }, 30000);
    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, [state.alerts, unread, signedIn]);
  useEffect(() => {
    if (!state.feedback) return;
    const timer = setTimeout(
      () => dispatch(clearFeedback()),
      state.feedback.error ? 7000 : 3500,
    );
    return () => clearTimeout(timer);
  }, [state.feedback, dispatch]);
  if (!signedIn) return <Redirect href="/login" />;
  const isDetail = !tabs.some((t) => t.path === pathname);
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View
        className="w-[100%] max-w-[820px] self-center bg-[#F5F7F5]"
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center justify-between gap-[10px] px-[20px] py-[14px] bg-[#fff] border-b-[1px] border-[#E5EBE7]">
          <View className="flex-row items-center gap-[10px]">
            {isDetail ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quay lại sơ đồ bàn"
                onPress={() => router.replace('/waiter/tables')}
                className="p-[7px]"
              >
                <Icon name="arrow-back" />
              </Pressable>
            ) : (
              <View className="bg-[#12664C] rounded-[13px] p-[9px]">
                <Icon name="leaf" color="#DDF0B5" size={23} />
              </View>
            )}
            <View>
              <Text className="text-[#093E30] text-[21px] font-[800] tracking-[-0.5px]">
                Mộc
                <Text className="text-[13px] font-[500] text-[#7C8983]">
                  {' '}
                  / phục vụ
                </Text>
              </Text>
              <Text className="text-[10px] text-[#7C8983] mt-[2px]">
                FOODHUB · KHÔNG GIAN NHÂN VIÊN
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở thông báo món sẵn sàng"
            onPress={() => router.push('/waiter/notifications')}
            className="p-[10px] bg-[#F5F7F5] rounded-[14px]"
          >
            <Icon name="notifications-outline" color={colors.text} />
            {unread > 0 && (
              <View className="absolute right-[7px] top-[5px] bg-[#CB534E] w-[14px] h-[14px] rounded-[7px] items-center justify-center">
                <Text className="text-[9px] text-[#fff] font-[700]">
                  {unread}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        {unseenItems.length > 0 && pathname !== '/waiter/notifications' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem thông báo món sẵn sàng"
            onPress={() => router.push('/waiter/notifications')}
            className="flex-row items-center gap-[10px] bg-[#FFF4DF] px-[20px] py-[12px]"
          >
            <Icon name="notifications-outline" color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text className="text-[14px] leading-[21px] text-[#183B32] font-[600]">
                {(apiMode
                  ? liveTables.data?.find((t) =>
                      t.openSessionIds.includes(unseenItems[0].sessionId),
                    )?.tableCode
                  : state.tables.find(
                      (t) => t.sessionId === unseenItems[0].sessionId,
                    )?.name) || 'Món sẵn sàng'}{' '}
                · {unseenItems[0].quantity} × {unseenItems[0].name}
              </Text>
              {!!unseenItems[0].note && (
                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                  {unseenItems[0].note}
                </Text>
              )}
              <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                {unseenItems.length}{' '}
                {apiMode ? 'món sẵn sàng' : 'thông báo chưa xem'} · Nhấn để kiểm
                tra
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.amber} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
        {state.feedback && (
          <Pressable
            accessibilityRole="alert"
            onPress={() => dispatch(clearFeedback())}
            className="absolute left-[20px] right-[20px] bottom-[80px] p-[15px] rounded-[13px] z-[20]"
            style={{
              backgroundColor: state.feedback.error ? '#A43F39' : colors.dark,
            }}
          >
            <Text className="text-[#fff] text-[13px] leading-[20px]">
              {state.feedback.text}
            </Text>
          </Pressable>
        )}
        <View className="flex-row pt-[10px] pb-[8px] bg-[#fff] border-t-[1px] border-[#E5EBE7]">
          {tabs.map((t) => {
            const active =
              pathname === t.path || (isDetail && t.path === '/waiter/tables');
            const count =
              t.path === '/waiter/ready'
                ? unread
                : t.path === '/waiter/requests'
                  ? requests
                  : 0;
            return (
              <Pressable
                key={t.path}
                accessibilityRole="tab"
                accessibilityLabel={t.title}
                accessibilityState={{ selected: active }}
                onPress={() => router.navigate(t.path)}
                className="items-center gap-[4px] py-[4px]"
                style={{ flex: 1 }}
              >
                <View>
                  <Icon
                    name={t.icon}
                    size={23}
                    color={active ? colors.green : '#99A69D'}
                  />
                  {count > 0 && (
                    <View className="absolute right-[-9px] top-[-4px] min-w-[14px] h-[14px] rounded-[7px] bg-[#CB534E] items-center justify-center">
                      <Text className="text-[#fff] text-[9px]">{count}</Text>
                    </View>
                  )}
                </View>
                <Text
                  className="text-[10px]"
                  style={{
                    fontWeight: active ? '700' : '500',
                    color: active ? colors.green : colors.muted,
                  }}
                >
                  {t.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
