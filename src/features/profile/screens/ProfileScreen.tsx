import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Loading } from '../../../components/Loading/Loading';
import { useAuth } from '../../auth/hooks/useAuth';
import { profileError } from '../api/profileApi';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from '../components/ProfileForm';
import { PasswordForm } from '../components/PasswordForm';

function Avatar({ url, name }: { url: string | null; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return url && failedUrl !== url ? (
    <Image
      accessibilityLabel="Ảnh đại diện"
      source={{ uri: url }}
      onError={() => setFailedUrl(url)}
      className="w-[68px] h-[68px] rounded-[22px] bg-[#EAF4ED]"
    />
  ) : (
    <View className="w-[68px] h-[68px] rounded-[22px] bg-[#DDECCB] items-center justify-center">
      <Text className="text-[23px] font-bold text-[#153F30]">
        {name
          .trim()
          .split(/\s+/)
          .slice(-2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || 'NV'}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const model = useProfile();
  const auth = useAuth();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const data = model.profile.data;
  const busy = model.save.isPending || model.password.isPending || auth.loading;
  function logout() {
    Alert.alert('Đăng xuất?', 'Bạn sẽ quay về màn hình đăng nhập.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => void auth.logout(),
      },
    ]);
  }
  return (
    <KeyboardAvoidingView
      className="grow-[1] shrink-0 basis-[0px]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="w-[100%] max-w-[760px] self-center p-[18px] pt-[8px] pb-[28px] gap-[18px]"
      >
        {model.profile.isPending ? (
          <Loading />
        ) : !data ? (
          <ErrorState
            message={profileError(model.profile.error)}
            busy={model.profile.isFetching}
            onRetry={() => void model.profile.refetch()}
          />
        ) : (
          <>
            <View className="bg-[#153F30] rounded-[24px] p-[20px] flex-row items-center gap-[16px]">
              <Avatar
                url={data.avatarUrl}
                name={data.fullName || data.userName}
              />
              <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px] gap-[5px]">
                <Text
                  numberOfLines={2}
                  className="text-[20px] font-bold text-white"
                >
                  {data.fullName || data.userName}
                </Text>
                <Text numberOfLines={1} className="text-[12px] text-[#BDD2C5]">
                  @{data.userName}
                </Text>
                <Text className="text-[11px] text-[#DDECCB]">
                  {data.roleId === 'inventory'
                    ? 'Nhân viên kho'
                    : 'Nhân viên phục vụ'}
                </Text>
              </View>
            </View>
            <View
              accessibilityRole="tablist"
              className="rounded-[14px] bg-[#E8EEE9] p-[4px] flex-row gap-[4px]"
            >
              {(
                [
                  { id: 'info', title: 'Thông tin', icon: 'person-outline' },
                  {
                    id: 'password',
                    title: 'Mật khẩu',
                    icon: 'lock-closed-outline',
                  },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityLabel={item.title}
                  accessibilityState={{
                    selected: tab === item.id,
                    disabled: busy,
                  }}
                  disabled={busy}
                  onPress={() => setTab(item.id)}
                  className={`grow-[1] shrink-0 basis-[0px] min-h-[44px] rounded-[11px] flex-row items-center justify-center gap-[7px] ${tab === item.id ? 'bg-white' : ''}`}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={tab === item.id ? '#236347' : '#738078'}
                  />
                  <Text
                    className={`text-[13px] font-semibold ${tab === item.id ? 'text-[#236347]' : 'text-[#738078]'}`}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tab === 'info' ? (
              <ProfileForm
                key={data.userId}
                profile={data}
                onSave={(values) => model.save.mutateAsync(values)}
              />
            ) : (
              <PasswordForm
                onSave={(values) => model.password.mutateAsync(values)}
              />
            )}
          </>
        )}
        {!!auth.error && <ErrorState message={auth.error} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
          disabled={busy}
          onPress={logout}
          className="min-h-[50px] rounded-[14px] border border-[#F0DEDA] bg-[#FFF6F4] flex-row items-center justify-center gap-[8px]"
        >
          <Ionicons name="log-out-outline" size={20} color="#B44741" />
          <Text className="text-[14px] font-semibold text-[#B44741]">
            Đăng xuất
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
