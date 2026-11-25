import { useInventoryUnread } from '../../features/inventory/notifications/hooks/useInventoryNotifications';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

export function InventoryHeader({
  title,
  subtitle,
  onBack,
  maxWidth,
  showNotifications = true,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  maxWidth: number;
  showNotifications?: boolean;
}) {
  const router = useRouter();
  const count = useInventoryUnread().data ?? 0;

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
        {showNotifications && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={count ? `Mở thông báo kho, ${count} chưa đọc` : 'Mở thông báo kho'}
            onPress={() => router.push('/inventory-notifications')}
            className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#F5F7F5]"
          >
            <Ionicons name="notifications-outline" size={23} color="#23382D" />
            {count > 0 && (
              <View className="absolute right-[1px] top-[1px] min-w-[17px] rounded-[12px] bg-[#12664C] px-[3px]">
                <Text className="text-center text-[10px] font-bold text-white">
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </>
  );
}
