import { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { profileError } from '../api/profileApi';
import { validatePassword } from '../schemas/profileSchema';
import type { FormErrors, PasswordValues } from '../types/types';

function PasswordField({
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="gap-[7px]">
      <Text className="text-[13px] font-medium text-[#607468]">{label}</Text>
      <View className="min-h-[50px] rounded-[13px] border border-[#E4EBE6] bg-[#F8FAF8] flex-row items-center">
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!visible}
          maxLength={256}
          placeholder={label}
          placeholderTextColor="#8B9A90"
          className="grow-[1] shrink-0 basis-[0px] min-w-[0px] px-[14px] py-[12px] text-[15px] text-[#23382D]"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
          onPress={() => setVisible(!visible)}
          className="h-[48px] w-[44px] items-center justify-center"
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#738078"
          />
        </Pressable>
      </View>
      {!!error && (
        <Text accessibilityRole="alert" className="text-[12px] text-[#B44741]">
          {error}
        </Text>
      )}
    </View>
  );
}

export function PasswordForm({
  onSave,
}: {
  onSave: (values: PasswordValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PasswordValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors<PasswordValues>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    const next = validatePassword(values);
    setErrors(next);
    setError('');
    if (Object.keys(next).length) return;
    lock.current = true;
    setBusy(true);
    try {
      await onSave(values);
    } catch (cause) {
      setError(profileError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const fields = [
    ['currentPassword', 'Mật khẩu hiện tại'],
    ['newPassword', 'Mật khẩu mới'],
    ['confirmPassword', 'Xác nhận mật khẩu mới'],
  ] as const;
  return (
    <View className="rounded-[22px] border border-[#E4EBE6] bg-white p-[20px] gap-[18px]">
      <View className="flex-row items-center gap-[10px]">
        <View className="h-[40px] w-[40px] rounded-[12px] bg-[#EAF4ED] items-center justify-center">
          <Ionicons name="shield-checkmark-outline" size={22} color="#236347" />
        </View>
        <Text className="text-[17px] font-bold text-[#23382D]">
          Đổi mật khẩu
        </Text>
      </View>
      {fields.map(([key, label]) => (
        <PasswordField
          key={key}
          label={label}
          value={values[key]}
          disabled={busy}
          error={errors[key]}
          onChange={(v) => {
            setValues((current) => ({ ...current, [key]: v }));
            setErrors((current) => ({ ...current, [key]: undefined }));
            setError('');
          }}
        />
      ))}
      <Text className="text-[12px] leading-[18px] text-[#738078]">
        Sau khi đổi mật khẩu, bạn cần đăng nhập lại.
      </Text>
      {!!error && <ErrorState message={error} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cập nhật mật khẩu"
        disabled={busy}
        onPress={() => void submit()}
        className={`min-h-[50px] rounded-[14px] bg-[#236347] items-center justify-center ${busy ? 'opacity-[0.5]' : 'active:opacity-[0.8]'}`}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-[14px] font-semibold text-white">
            Cập nhật mật khẩu
          </Text>
        )}
      </Pressable>
    </View>
  );
}
