import { useEffect, useRef, useState } from 'react';
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
import { validateProfile } from '../schemas/profileSchema';
import type { FormErrors, Profile, ProfileValues } from '../types/types';

function valuesFor(profile: Profile): ProfileValues {
  return {
    fullName: profile.fullName || '',
    phoneNumber: profile.phoneNumber || '',
    avatarUrl: profile.avatarUrl || '',
  };
}

export function ProfileForm({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (values: ProfileValues) => Promise<Profile>;
}) {
  const [values, setValues] = useState(() => valuesFor(profile));
  const [errors, setErrors] = useState<FormErrors<ProfileValues>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const lock = useRef(false);
  const original = valuesFor(profile);
  const dirty = (Object.keys(values) as (keyof ProfileValues)[]).some(
    (key) => values[key].trim() !== original[key],
  );
  useEffect(() => {
    if (!dirty) setValues(valuesFor(profile));
  }, [profile, dirty]);
  function change(key: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage('');
    setError('');
  }
  async function submit() {
    if (lock.current) return;
    const next = validateProfile(values);
    setErrors(next);
    setMessage('');
    setError('');
    if (Object.keys(next).length) return;
    lock.current = true;
    setBusy(true);
    try {
      const saved = await onSave(values);
      setValues(valuesFor(saved));
      setMessage('Đã lưu thông tin cá nhân.');
    } catch (cause) {
      setError(profileError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View className="rounded-[22px] border border-[#E4EBE6] bg-white p-[20px] gap-[18px]">
      <Text className="text-[17px] font-bold text-[#23382D]">
        Thông tin cá nhân
      </Text>
      <View className="gap-[7px]">
        <Text className="text-[13px] font-medium text-[#607468]">
          Họ và tên
        </Text>
        <TextInput
          accessibilityLabel="Họ và tên"
          value={values.fullName}
          onChangeText={(v) => change('fullName', v)}
          editable={!busy}
          maxLength={255}
          autoComplete="name"
          placeholder="Nhập họ và tên"
          placeholderTextColor="#8B9A90"
          className="min-h-[50px] rounded-[13px] border border-[#E4EBE6] bg-[#F8FAF8] px-[14px] py-[12px] text-[15px] text-[#23382D]"
        />
        {!!errors.fullName && (
          <Text
            accessibilityRole="alert"
            className="text-[12px] text-[#B44741]"
          >
            {errors.fullName}
          </Text>
        )}
      </View>
      <View className="gap-[7px]">
        <Text className="text-[13px] font-medium text-[#607468]">
          Số điện thoại
        </Text>
        <TextInput
          accessibilityLabel="Số điện thoại"
          value={values.phoneNumber}
          onChangeText={(v) => change('phoneNumber', v)}
          editable={!busy}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={20}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#8B9A90"
          className="min-h-[50px] rounded-[13px] border border-[#E4EBE6] bg-[#F8FAF8] px-[14px] py-[12px] text-[15px] text-[#23382D]"
        />
        {!!errors.phoneNumber && (
          <Text
            accessibilityRole="alert"
            className="text-[12px] text-[#B44741]"
          >
            {errors.phoneNumber}
          </Text>
        )}
      </View>
      <View className="gap-[12px] rounded-[14px] bg-[#F5F7F5] p-[14px]">
        <View className="gap-[4px]">
          <Text className="text-[11px] text-[#738078]">Tên đăng nhập</Text>
          <Text selectable className="text-[14px] text-[#23382D]">
            {profile.userName}
          </Text>
        </View>
        <View className="gap-[4px]">
          <Text className="text-[11px] text-[#738078]">Email</Text>
          <Text selectable className="text-[14px] text-[#23382D]">
            {profile.email}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thay đổi ảnh đại diện"
        accessibilityState={{ expanded: imageOpen }}
        onPress={() => setImageOpen(!imageOpen)}
        className="min-h-[44px] flex-row items-center gap-[8px]"
      >
        <Ionicons name="image-outline" size={19} color="#236347" />
        <Text className="text-[13px] font-semibold text-[#236347]">
          Thay đổi ảnh đại diện
        </Text>
        <Ionicons
          name={imageOpen ? 'chevron-up' : 'chevron-down'}
          size={15}
          color="#738078"
        />
      </Pressable>
      {imageOpen && (
        <View className="gap-[7px]">
          <Text className="text-[12px] text-[#738078]">Đường dẫn ảnh</Text>
          <TextInput
            accessibilityLabel="Đường dẫn ảnh đại diện"
            value={values.avatarUrl}
            onChangeText={(v) => change('avatarUrl', v)}
            editable={!busy}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={2048}
            placeholder="https://..."
            placeholderTextColor="#8B9A90"
            className="min-h-[50px] rounded-[13px] border border-[#E4EBE6] bg-[#F8FAF8] px-[14px] py-[12px] text-[14px] text-[#23382D]"
          />
          {!!errors.avatarUrl && (
            <Text
              accessibilityRole="alert"
              className="text-[12px] text-[#B44741]"
            >
              {errors.avatarUrl}
            </Text>
          )}
        </View>
      )}
      {!!error && <ErrorState message={error} />}
      {!!message && (
        <Text
          accessibilityRole="alert"
          className="rounded-[12px] bg-[#EAF4ED] p-[12px] text-[13px] text-[#236347]"
        >
          {message}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lưu thay đổi"
        disabled={busy || !dirty}
        onPress={() => void submit()}
        className={`min-h-[50px] rounded-[14px] bg-[#236347] flex-row items-center justify-center gap-[8px] ${busy || !dirty ? 'opacity-[0.5]' : 'active:opacity-[0.8]'}`}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text className="text-[14px] font-semibold text-white">
              Lưu thay đổi
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
