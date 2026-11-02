import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, View } from 'react-native';

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
          accessibilityLabel="Mở thông báo kho"
          onPress={() => setNotificationsOpen(true)}
          className="w-[44px] h-[44px] bg-[#F5F7F5] rounded-[14px] items-center justify-center"
        >
          <Ionicons name="notifications-outline" size={23} color="#23382D" />
        </Pressable>
      </View>
      <Modal
        visible={notificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <View className="grow-[1] shrink-0 basis-[0px] justify-center p-[24px] bg-[rgba(12,34,24,0.4)]">
          <Pressable
            accessibilityLabel="Đóng thông báo"
            onPress={() => setNotificationsOpen(false)}
            className="absolute top-[0px] bottom-[0px] left-[0px] right-[0px]"
          />
          <View
            accessibilityViewIsModal
            className="w-[100%] max-w-[400px] self-center rounded-[24px] bg-[#fff] p-[24px]"
          >
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="grow-[1] shrink-0 basis-[0px] text-[19px] font-bold text-[#23382D]">
                Thông báo
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setNotificationsOpen(false)}
                className="w-[44px] h-[44px] items-center justify-center"
              >
                <Ionicons name="close" size={22} color="#738078" />
              </Pressable>
            </View>
            <View className="items-center gap-[12px] py-[24px]">
              <Ionicons name="notifications-outline" size={32} color="#738078" />
              <Text className="text-center text-[13px] leading-[20px] text-[#738078]">
                Chưa có thông báo
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
