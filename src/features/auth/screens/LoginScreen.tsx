import { useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { getStaffHome } from '../components/RoleGate';

// expo-image needs this mapping to receive NativeWind classes as native styles.
cssInterop(Image, { className: 'style' });

export default function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [validation, setValidation] = useState('');
  const passwordInput = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const roomy = width >= 640;
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  if (auth.status === 'loading')
    return (
      <View className="grow-[1] shrink-0 basis-[0px] items-center justify-center">
        <ActivityIndicator color="#236347" />
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
    <SafeAreaView className="grow-[1] shrink-0 basis-[0px] bg-[#fff]">
      <KeyboardAvoidingView
        className="grow-[1] shrink-0 basis-[0px]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow-[1] w-[100%]"
        >
          <View
            className={`grow-[1] w-[100%] bg-[#fff] ${wide ? 'flex-row' : ''}`}
          >
            <View
              className={`bg-[#123D30] overflow-hidden ${wide ? 'p-[40px] w-[50%] min-h-[580px]' : roomy ? 'p-[32px]' : 'p-[24px]'}`}
            >
              <View
                pointerEvents="none"
                className="absolute w-[384px] h-[384px] rounded-[192px] right-[-96px] top-[64px] bg-[rgba(110,231,183,0.05)]"
              />
              <Text className="text-[#fff] text-[24px] font-bold tracking-[-0.6px]">
                FoodHub<Text className="text-[#B8DF8D]">.</Text>
              </Text>
              {wide && (
                <View className="grow-[1] shrink-0 basis-[0px] items-center justify-center">
                  <Image
                    source={require('../../../assets/images/login-dining.svg')}
                    accessibilityLabel="Minh họa đĩa salad và bộ dao nĩa"
                    className="w-[100%] max-w-[380px] aspect-[400/380]"
                    contentFit="contain"
                  />
                  <View className="w-[40px] h-[4px] mt-[24px] rounded-[2px] bg-[rgba(184,223,141,0.7)]" />
                </View>
              )}
            </View>
            <View
              className={`grow-[1] shrink-0 basis-[0px] min-w-[0px] ${wide ? 'justify-center p-[40px]' : roomy ? 'justify-start p-[40px] pt-[32px]' : 'justify-start p-[24px] pt-[32px]'}`}
            >
              <View className="w-[100%] max-w-[440px] self-center">
                <Text className="text-[24px] font-bold text-[#23382D]">
                  Đăng nhập
                </Text>
                <Text className="text-[#667368] text-[14px] leading-[20px] mt-[8px]">
                  Nhập thông tin tài khoản để tiếp tục.
                </Text>
                <View className="w-[100%] mt-[24px]">
                  <Text className="text-[#23382D] text-[14px] font-semibold mb-[8px]">
                    Email hoặc tên đăng nhập
                  </Text>
                  <TextInput
                    accessibilityLabel="Email hoặc tên đăng nhập"
                    className={`min-h-[48px] border-[1px] rounded-[12px] bg-[#fff] text-[#23382D] text-[16px] px-[16px] py-[12px] ${focused === 'email' ? 'border-[#236347]' : 'border-[#E7E5E4]'}`}
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
                  <Text className="text-[#23382D] text-[14px] font-semibold mb-[8px] mt-[18px]">
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
                  <Text className="text-center text-[#667368] text-[12px] leading-[20px] mt-[16px]">
                    Sử dụng tài khoản do nhà hàng cấp. Liên hệ quản trị viên nếu
                    cần hỗ trợ.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
