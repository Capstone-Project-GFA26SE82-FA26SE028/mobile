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
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const roomy = width >= 640;
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  if (auth.status === 'loading')
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#236347" />
      </View>
    );
  if (auth.user) return <Redirect href={getStaffHome(auth.user)} />;
  function login() {
    if (!email.trim() || !password) {
      setValidation('Enter your email or username and password.');
      return;
    }
    if (email.trim().length > 255) {
      setValidation('Email or username must not exceed 255 characters.');
      return;
    }
    setValidation('');
    void auth.login(email, password);
  }
  const error = validation || auth.error || auth.message;
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={[styles.layout, wide && styles.wideLayout]}>
            <View
              style={[
                styles.brandPanel,
                { padding: wide ? 40 : roomy ? 32 : 24 },
                wide && styles.wideBrandPanel,
              ]}
            >
              <View pointerEvents="none" style={styles.glow} />
              <Text style={styles.brand}>
                FoodHub<Text style={{ color: '#B8DF8D' }}>.</Text>
              </Text>
              {wide && (
                <View style={styles.illustrationPanel}>
                  <Image
                    source={require('../../../assets/images/login-dining.svg')}
                    accessibilityLabel="Illustration of a salad plate with cutlery"
                    style={styles.illustration}
                    contentFit="contain"
                  />
                  <View style={styles.illustrationAccent} />
                </View>
              )}
            </View>
            <View
              style={[
                styles.formPanel,
                { padding: roomy ? 40 : 24 },
                !wide && styles.compactFormPanel,
              ]}
            >
              <View style={styles.formContent}>
                <Text style={styles.title}>Sign In</Text>
                <Text style={styles.subtitle}>
                  Enter your account details to continue.
                </Text>
                <View style={styles.form}>
                  <Text style={styles.label}>Email or username</Text>
                  <TextInput
                    accessibilityLabel="Email or username"
                    style={[
                      styles.field,
                      focused === 'email' && styles.focusedField,
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email or username"
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
                  <Text style={[styles.label, { marginTop: 18 }]}>
                    Password
                  </Text>
                  <View
                    style={[
                      styles.password,
                      focused === 'password' && styles.focusedField,
                    ]}
                  >
                    <TextInput
                      ref={passwordInput}
                      accessibilityLabel="Password"
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
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
                        visible ? 'Hide password' : 'Show password'
                      }
                      onPress={() => setVisible(!visible)}
                      style={styles.eye}
                    >
                      <Ionicons
                        name={visible ? 'eye-off-outline' : 'eye-outline'}
                        size={21}
                        color="#667368"
                      />
                    </Pressable>
                  </View>
                  {!!error && (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {error}
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                    accessibilityState={{ disabled: auth.loading }}
                    disabled={auth.loading}
                    onPress={login}
                    style={[styles.button, auth.loading && { opacity: 0.65 }]}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign in</Text>
                    )}
                  </Pressable>
                  <Text style={styles.footer}>
                    Use the account provided by your restaurant. Contact your
                    administrator if you need help.
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flexGrow: 1,
    width: '100%',
  },
  layout: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  wideLayout: { flexDirection: 'row' },
  brandPanel: { backgroundColor: '#123D30', overflow: 'hidden' },
  wideBrandPanel: { width: '50%', minHeight: 580 },
  glow: {
    position: 'absolute',
    width: 384,
    height: 384,
    borderRadius: 192,
    right: -96,
    top: 64,
    backgroundColor: 'rgba(110, 231, 183, 0.05)',
  },
  brand: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  illustrationPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: { width: '100%', maxWidth: 380, aspectRatio: 400 / 380 },
  illustrationAccent: {
    width: 40,
    height: 4,
    marginTop: 24,
    borderRadius: 2,
    backgroundColor: 'rgba(184, 223, 141, 0.7)',
  },
  formPanel: { flex: 1, minWidth: 0, justifyContent: 'center' },
  compactFormPanel: { justifyContent: 'flex-start', paddingTop: 32 },
  formContent: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#23382D' },
  subtitle: { color: '#667368', fontSize: 14, lineHeight: 20, marginTop: 8 },
  form: { width: '100%', marginTop: 24 },
  label: { color: '#23382D', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    backgroundColor: '#fff',
    color: '#23382D',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  focusedField: { borderColor: '#236347' },
  password: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    color: '#23382D',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eye: { padding: 14 },
  error: {
    color: '#B33A3A',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#236347',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    color: '#667368',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 16,
  },
});
