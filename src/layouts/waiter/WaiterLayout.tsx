import { useEffect } from 'react';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { AppState, Pressable, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearFeedback } from '@/features/waiter/shared/waiterSlice';
import { Icon, type IconName } from '@/features/waiter/shared/components/UI';
import { colors, ui } from '@/features/waiter/shared/theme';
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
  const unread = state.items.filter(
    (i) => i.status === 'Ready' && !i.seen,
  ).length;
  const requests = state.requests.filter((r) => r.status !== 'done').length;
  useEffect(() => {
    if (!state.alerts || !unread || !state.signedIn) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') Vibration.vibrate(250);
    }, 30000);
    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, [state.alerts, unread, state.signedIn]);
  useEffect(() => {
    if (!state.feedback) return;
    const timer = setTimeout(
      () => dispatch(clearFeedback()),
      state.feedback.error ? 7000 : 3500,
    );
    return () => clearTimeout(timer);
  }, [state.feedback, dispatch]);
  if (!state.signedIn) return <Redirect href="/login" />;
  const isDetail = !tabs.some((t) => t.path === pathname);
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 820,
          alignSelf: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <View
          style={[
            ui.between,
            {
              paddingHorizontal: 20,
              paddingVertical: 14,
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderColor: colors.line,
            },
          ]}
        >
          <View style={ui.row}>
            {isDetail ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quay lại sơ đồ bàn"
                onPress={() => router.replace('/waiter/tables')}
                style={{ padding: 7 }}
              >
                <Icon name="arrow-back" />
              </Pressable>
            ) : (
              <View
                style={{
                  backgroundColor: colors.green,
                  borderRadius: 13,
                  padding: 9,
                }}
              >
                <Icon name="leaf" color="#DDF0B5" size={23} />
              </View>
            )}
            <View>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 21,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                Mộc
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.muted,
                  }}
                >
                  {' '}
                  / phục vụ
                </Text>
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>
                FOODHUB · KHÔNG GIAN NHÂN VIÊN
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở thông báo món sẵn sàng"
            onPress={() => router.push('/waiter/ready')}
            style={{
              padding: 10,
              backgroundColor: colors.bg,
              borderRadius: 14,
            }}
          >
            <Icon name="notifications-outline" color={colors.text} />
            {unread > 0 && (
              <View
                style={{
                  position: 'absolute',
                  right: 7,
                  top: 5,
                  backgroundColor: colors.red,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>
                  {unread}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
        {state.feedback && (
          <Pressable
            accessibilityRole="alert"
            onPress={() => dispatch(clearFeedback())}
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: 80,
              padding: 15,
              borderRadius: 13,
              backgroundColor: state.feedback.error ? '#A43F39' : colors.dark,
              zIndex: 20,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>
              {state.feedback.text}
            </Text>
          </Pressable>
        )}
        <View
          style={{
            flexDirection: 'row',
            paddingTop: 10,
            paddingBottom: 8,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderColor: colors.line,
          }}
        >
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
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 4,
                }}
              >
                <View>
                  <Icon
                    name={t.icon}
                    size={23}
                    color={active ? colors.green : '#99A69D'}
                  />
                  {count > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        right: -9,
                        top: -4,
                        minWidth: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: colors.red,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 9 }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
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
