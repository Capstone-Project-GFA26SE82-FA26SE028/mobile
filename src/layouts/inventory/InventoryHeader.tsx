import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function InventoryHeader({
  title,
  subtitle,
  onBack,
  maxWidth,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  maxWidth: number;
}) {
  const auth = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const initials =
    auth.user?.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'FH';
  return (
    <>
      <View
        className="w-[100%] self-center flex-row items-center gap-[12px] px-[20px] py-[16px]"
        style={{ maxWidth }}
      >
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack}
            className="w-[44px] h-[44px] rounded-[14px] bg-[#fff] border-[1px] border-[#E4EBE6] items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#23382D" />
          </Pressable>
        ) : (
          <View className="w-[44px] h-[44px] rounded-[14px] bg-[#236347] items-center justify-center">
            <Ionicons name="layers-outline" size={23} color="#fff" />
          </View>
        )}
        <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px]">
          <Text
            className={`font-extrabold tracking-[-0.5px] text-[#153F30] ${title ? 'text-[20px]' : 'text-[23px]'}`}
          >
            {title || (
              <>
                FoodHub<Text className="text-[#8DA76A]">.</Text>
              </>
            )}
          </Text>
          <Text className="text-[11px] leading-[16px] text-[#738078] mt-[3px]">
            {subtitle || 'Không gian quản lý kho'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở tài khoản"
          onPress={() => setAccountOpen(true)}
          className="w-[44px] h-[44px] rounded-[22px] border-[1px] border-[#D6E5DB] bg-[#E8F0E8] items-center justify-center"
        >
          <Text className="text-[#153F30] text-[13px] font-bold">
            {initials}
          </Text>
        </Pressable>
      </View>
      <Modal
        visible={accountOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountOpen(false)}
      >
        <View className="grow-[1] shrink-0 basis-[0px] justify-center p-[24px] bg-[rgba(12,34,24,0.4)]">
          <Pressable
            accessibilityLabel="Đóng tài khoản"
            onPress={() => setAccountOpen(false)}
            className="absolute top-[0px] bottom-[0px] left-[0px] right-[0px]"
          />
          <View
            accessibilityViewIsModal
            className="w-[100%] max-w-[400px] self-center rounded-[24px] bg-[#fff] p-[24px]"
          >
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="grow-[1] shrink-0 basis-[0px] text-[19px] font-bold text-[#23382D]">
                Tài khoản của bạn
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setAccountOpen(false)}
                className="w-[44px] h-[44px] items-center justify-center"
              >
                <Ionicons name="close" size={22} color="#738078" />
              </Pressable>
            </View>
            <Text className="mt-[18px] text-[21px] font-semibold text-[#23382D]">
              {auth.user?.name}
            </Text>
            <Text className="mt-[6px] text-[14px] text-[#738078]">
              {auth.user?.email}
            </Text>
            <Text className="mt-[12px] text-[12px] text-[#236347]">
              Nhân viên kho
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={auth.loading}
              onPress={() => {
                setAccountOpen(false);
                void auth.logout();
              }}
              className="mt-[24px] pt-[16px] min-h-[48px] border-t-[1px] border-[#E4EBE6] flex-row items-center gap-[10px]"
            >
              <Ionicons name="log-out-outline" size={21} color="#B44741" />
              <Text className="text-[#B44741] font-semibold">Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
