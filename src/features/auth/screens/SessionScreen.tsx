import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/app/hooks';
import { signOut } from '../authSlice';
import { Button, Card, Notice, Page, Title } from '../components/UI';
import { colors, ui } from '../theme';

export default function SessionScreen() {
  const dispatch = useAppDispatch();
  const [confirm, setConfirm] = useState(false);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Page>
        <Title title="Cá nhân" subtitle="Thông tin phiên dùng thử." />
        <Card>
          <Text style={ui.h2}>Trần Hoàng</Text>
          <Text style={ui.body}>Nhân viên phục vụ · Nhà hàng Mộc</Text>
          <Text style={ui.small}>Tài khoản dùng thử</Text>
        </Card>
        <Notice text="Chưa kết nối dịch vụ đăng nhập thật. Phiên dùng thử được đặt lại khi tải lại ứng dụng." />
        <Button title="Đăng xuất" secondary icon="log-out-outline" onPress={() => setConfirm(true)} />
      </Page>
      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0D2C2566' }}>
          <View accessibilityViewIsModal style={[ui.card, { width: '100%', maxWidth: 480, alignSelf: 'center' }]}>
            <Text style={ui.h2}>Kết thúc phiên dùng thử?</Text>
            <Text style={ui.body}>Bạn sẽ quay về màn hình đăng nhập.</Text>
            <Button title="Xác nhận đăng xuất" onPress={() => {
              setConfirm(false);
              dispatch(signOut());
            }} />
            <Button title="Tiếp tục sử dụng" secondary onPress={() => setConfirm(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
