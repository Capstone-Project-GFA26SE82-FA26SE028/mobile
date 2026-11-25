import { useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { getStaffHome } from '../components/RoleGate';

export default function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [validation, setValidation] = useState('');
  const passwordInput = useRef<TextInput>(null);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  if (auth.status === 'loading')
    return (
      <View className="grow-[1] shrink-0 basis-[0px] items-center justify-center bg-[#123D30]">
        <ActivityIndicator color="#fff" />
      </View>
    );
  if (auth.user) return <Redirect href={getStaffHome(auth.user)} />;
  function login() {
    if (!email.trim() || !password) {
      setValidation('Vui lòng nhập email hoặc tên đăng nhập và mật khẩu.');
      return;
    }
    if (email.trim().length > 255) {
      setValidation('Email hoặc tên đăng nhập không được vượt quá 255 ký tự.');
      return;
    }
    setValidation('');
    void auth.login(email, password);
  }
  const error = validation || auth.error || auth.message;
  return (
    <SafeAreaView className="flex-1 bg-[#123D30]">
      <Image
        source={require('../../../assets/images/login-background.svg')}
        accessible={false}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        contentFit="fill"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow items-center justify-center px-[8px] pb-[32px] pt-[96px]"
        >
          <Image
            source={require('../../../assets/images/dinelink-logo.png')}
            accessibilityLabel="DineLink"
            style={{ width: 144, height: 40 }}
            contentFit="cover"
          />
          <View className="mt-[28px] w-full max-w-[448px] rounded-[24px] border border-white/10 bg-white px-[24px] py-[32px]">
            <Text accessibilityRole="header" className="text-center text-[24px] leading-[32px] font-bold tracking-[-0.5px] text-[#173E32]">
              Đăng nhập DineLink
            </Text>
            <View className="mt-[32px]">
              <Text className="text-[#173E32] text-[14px] leading-[20px] font-semibold mb-[8px]">
                Email hoặc tên đăng nhập
              </Text>
              <TextInput
                accessibilityLabel="Email hoặc tên đăng nhập"
                className={`min-h-[50px] border-[1px] rounded-[12px] bg-[#fff] text-[#23382D] text-[16px] px-[16px] py-[12px] ${focused === 'email' ? 'border-[#236347]' : 'border-[#E7E5E4]'}`}
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập email hoặc tên đăng nhập"
                placeholderTextColor="#8B978F"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                autoComplete="username"
                textContentType="username"
                editable={!auth.loading}
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
              <Text className="text-[#173E32] text-[14px] leading-[20px] font-semibold mb-[8px] mt-[20px]">
                Mật khẩu
              </Text>
              <View
                className={`flex-row items-center border-[1px] rounded-[12px] bg-[#fff] ${focused === 'password' ? 'border-[#236347]' : 'border-[#E7E5E4]'}`}
              >
                <TextInput
                  ref={passwordInput}
                  accessibilityLabel="Mật khẩu"
                  className="grow-[1] shrink-0 basis-[0px] min-w-[0px] min-h-[48px] text-[#23382D] text-[16px] px-[16px] py-[12px]"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#8B978F"
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  editable={!auth.loading}
                  returnKeyType="go"
                  onSubmitEditing={login}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                  }
                  onPress={() => setVisible(!visible)}
                  className="p-[14px]"
                >
                  <Ionicons
                    name={visible ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color="#667368"
                  />
                </Pressable>
              </View>
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  className="text-[#B33A3A] bg-[#FFF0F0] p-[12px] rounded-[12px] text-[13px] leading-[20px] mt-[16px]"
                >
                  {error}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đăng nhập"
                accessibilityState={{ disabled: auth.loading }}
                disabled={auth.loading}
                onPress={login}
                className={`min-h-[48px] rounded-[16px] bg-[#236347] items-center justify-center mt-[20px] ${auth.loading ? 'opacity-[0.65]' : ''}`}
              >
                {auth.loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[#fff] text-[14px] font-semibold">
                    Đăng nhập
                  </Text>
                )}
              </Pressable>
              <Text className="mt-[24px] text-center text-[12px] leading-[20px] text-[#667368]">
                Nhân viên dùng tài khoản do nhà hàng cấp.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
