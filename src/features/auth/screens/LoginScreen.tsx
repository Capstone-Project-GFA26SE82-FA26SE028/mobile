import { useState } from 'react';
import { Redirect } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { enterDemo } from '../authSlice';
import { Button, Field, Icon, Notice } from '../components/UI';
import { colors, ui } from '../theme';
export default function LoginScreen() {
  const signedIn = useAppSelector((s) => s.auth.signedIn);
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (signedIn) return <Redirect href="/waiter/account" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 26,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
            gap: 25,
          }}
        >
          <View style={{ gap: 17 }}>
            <View
              style={{
                backgroundColor: colors.dark,
                borderRadius: 22,
                padding: 18,
                alignSelf: 'flex-start',
              }}
            >
              <Icon name="leaf" size={36} color="#DDF0B5" />
            </View>
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 2,
                fontWeight: '700',
                color: colors.green,
              }}
            >
              MỘC · FOODHUB
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                lineHeight: 40,
                color: colors.dark,
              }}
            >
              Chăm chút từng trải nghiệm.
            </Text>
            <Text style={[ui.body, { color: colors.muted }]}>
              Chào mừng bạn trở lại. Sẵn sàng mang những bữa ăn ngon đến khách
              hàng.
            </Text>
          </View>
          <View style={[ui.card, { padding: 22, gap: 18 }]}>
            <Text style={ui.h2}>Đăng nhập nhân viên</Text>
            <Field
              label="Email / Số điện thoại / Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="Nhập tài khoản của bạn"
            />
            <Field
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
            {!!error && <Notice text={error} error />}
            <Button
              title="Đăng nhập"
              onPress={() =>
                setError(
                  !username.trim() || !password
                    ? 'Vui lòng nhập đủ tài khoản và mật khẩu.'
                    : 'Chưa kết nối dịch vụ đăng nhập. Bạn có thể trải nghiệm bằng chế độ dùng thử bên dưới.',
                )
              }
            />
            <View style={ui.divider} />
            <Button
              title="Vào chế độ dùng thử"
              secondary
              icon="play-outline"
              onPress={() => {
                setPassword('');
                dispatch(enterDemo());
              }}
            />
            <Text style={[ui.small, { textAlign: 'center' }]}>
              Dữ liệu mẫu · Không sử dụng tài khoản thật
            </Text>
          </View>
          <Text style={[ui.small, { textAlign: 'center' }]}>
            Dành cho nhân viên phục vụ nhà hàng Mộc
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
