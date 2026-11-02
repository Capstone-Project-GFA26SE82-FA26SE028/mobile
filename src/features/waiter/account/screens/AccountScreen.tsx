import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setAlerts,
  signOut,
  setAuthMessage,
} from '../../shared/store/waiterSlice';
import {
  Button,
  Card,
  Empty,
  Icon,
  Notice,
  Page,
  Sheet,
  Title,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import { time } from '../../shared/utils/rules';
import { authError, authService } from '@/features/auth/api/authApi';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
export default function AccountScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? <ProfileScreen /> : <DemoAccountScreen />;
}

function DemoAccountScreen() {
  const state = useAppSelector((s) => s.waiter);
  const dispatch = useAppDispatch();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      if (state.authMode === 'api') await authService.logout();
      else await authService.clear();
      dispatch(signOut());
      setConfirm(false);
    } catch (error) {
      // Local credentials are cleared even when the revocation request fails.
      dispatch(signOut());
      dispatch(
        setAuthMessage(
          `Đã đăng xuất trên thiết bị, nhưng chưa xác nhận thu hồi phiên trên máy chủ. ${authError(error)}`,
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Page>
      <Title title="Cá nhân" subtitle="Thông tin và thiết lập ca phục vụ." />
      <Card>
        <View className="flex-row items-center gap-[10px]">
          <View className="w-[56px] h-[56px] bg-[#EAF5EF] rounded-[28px] items-center justify-center">
            <Text className="text-[#12664C] text-[20px] font-[700]">
              {(state.waiter?.name || 'NV')
                .split(/\s+/)
                .slice(-2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View className="gap-[5px]">
            <Text className="text-[17px] font-[700] text-[#183B32]">
              {state.waiter?.name || 'Nhân viên phục vụ'}
            </Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              Nhân viên phục vụ
            </Text>
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              {state.authMode === 'api'
                ? state.waiter?.email
                : 'Tài khoản dùng thử'}
            </Text>
          </View>
        </View>
      </Card>
      <Card>
        <View className="flex-row items-center justify-between gap-[10px]">
          <View className="gap-[5px]" style={{ flex: 1 }}>
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              Rung nhắc món chưa xem
            </Text>
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              Khi có món mới và mỗi 30 giây nếu chưa xem, trên thiết bị hỗ trợ
              rung.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Rung nhắc món chưa xem"
            value={state.alerts}
            disabled={state.authMode === 'api'}
            onValueChange={(v) => {
              dispatch(setAlerts(v));
            }}
            trackColor={{ false: '#DDE5DF', true: '#92C5AC' }}
            thumbColor={state.alerts ? colors.green : '#fff'}
          />
        </View>
        <Notice
          text={
            state.authMode === 'api'
              ? 'Bàn, thực đơn và order được lấy từ backend. Chưa hỗ trợ push notification. Mở lại ứng dụng cần đăng nhập lại.'
              : 'Chưa kết nối push notification hoặc đồng bộ bếp. Dữ liệu dùng thử được đặt lại khi tải lại ứng dụng.'
          }
        />
      </Card>
      <View className="flex-row items-center justify-between gap-[10px]">
        <Text className="text-[17px] font-[700] text-[#183B32]">
          Hoạt động trong phiên
        </Text>
        <Icon name="time-outline" size={19} />
      </View>
      <Card>
        {state.logs.slice(0, 12).map((log) => (
          <View
            key={log.id}
            className="gap-[4px] pb-[12px] border-b-[1px] border-[#E5EBE7]"
          >
            <Text className="text-[14px] leading-[21px] text-[#183B32]">
              {log.text}
            </Text>
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              {time(log.time)}
            </Text>
          </View>
        ))}
        {!state.logs.length && (
          <Empty text="Các thao tác phục vụ của bạn sẽ xuất hiện tại đây." />
        )}
      </Card>
      <Button
        title="Đăng xuất"
        secondary
        icon="log-out-outline"
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Sheet
          title={
            state.authMode === 'api'
              ? 'Đăng xuất tài khoản?'
              : 'Kết thúc phiên dùng thử?'
          }
          onClose={() => {
            if (!loading) setConfirm(false);
          }}
        >
          <Text className="text-[14px] leading-[21px] text-[#183B32]">
            Bạn sẽ quay về màn hình đăng nhập.
          </Text>
          {state.sessions.some((s) => s.payment === 'pending_settlement') && (
            <Notice
              text="Có khoản thu hộ đang chờ bàn giao. Hãy kiểm tra với thu ngân."
              error
            />
          )}
          <Button
            title={loading ? 'Đang đăng xuất…' : 'Xác nhận đăng xuất'}
            disabled={loading}
            onPress={logout}
          />
        </Sheet>
      )}
    </Page>
  );
}
