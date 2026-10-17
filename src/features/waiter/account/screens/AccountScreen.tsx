import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setAlerts, signOut } from '../../shared/waiterSlice';
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
import { colors, ui } from '../../shared/theme';
import { time } from '../../shared/rules';
export default function AccountScreen() {
  const state = useAppSelector((s) => s.waiter);
  const dispatch = useAppDispatch();
  const [confirm, setConfirm] = useState(false);
  return (
    <Page>
      <Title title="Cá nhân" subtitle="Thông tin và thiết lập ca phục vụ." />
      <Card>
        <View style={ui.row}>
          <View
            style={{
              width: 56,
              height: 56,
              backgroundColor: colors.mint,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{ color: colors.green, fontSize: 20, fontWeight: '700' }}
            >
              TH
            </Text>
          </View>
          <View style={{ gap: 5 }}>
            <Text style={ui.h2}>Trần Hoàng</Text>
            <Text style={ui.muted}>Nhân viên phục vụ · Nhà hàng Mộc</Text>
            <Text style={ui.small}>Tài khoản dùng thử</Text>
          </View>
        </View>
      </Card>
      <Card>
        <View style={ui.between}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={ui.body}>Rung nhắc món chưa xem</Text>
            <Text style={ui.small}>
              Mỗi 30 giây khi ứng dụng đang mở, trên thiết bị hỗ trợ rung.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Rung nhắc món chưa xem"
            value={state.alerts}
            onValueChange={(v) => { dispatch(setAlerts(v)); }}
            trackColor={{ false: '#DDE5DF', true: '#92C5AC' }}
            thumbColor={state.alerts ? colors.green : '#fff'}
          />
        </View>
        <Notice text="Chưa kết nối push notification, đồng bộ bếp hoặc đăng nhập thật. Dữ liệu trong phiên dùng thử được đặt lại khi tải lại ứng dụng." />
      </Card>
      <View style={ui.between}>
        <Text style={ui.h2}>Hoạt động trong phiên</Text>
        <Icon name="time-outline" size={19} />
      </View>
      <Card>
        {state.logs.slice(0, 12).map((log) => (
          <View
            key={log.id}
            style={{
              gap: 4,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={ui.body}>{log.text}</Text>
            <Text style={ui.small}>{time(log.time)}</Text>
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
          title="Kết thúc phiên dùng thử?"
          onClose={() => setConfirm(false)}
        >
          <Text style={ui.body}>Bạn sẽ quay về màn hình đăng nhập.</Text>
          {state.sessions.some((s) => s.payment === 'pending_settlement') && (
            <Notice
              text="Có khoản thu hộ đang chờ bàn giao. Hãy kiểm tra với thu ngân."
              error
            />
          )}
          <Button
            title="Xác nhận đăng xuất"
            onPress={() => {
              setConfirm(false);
              dispatch(signOut());
            }}
          />
        </Sheet>
      )}
    </Page>
  );
}
