import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { StaffNotification } from '@/features/notifications/types/types';

export function NotificationCard({
  item,
  busy,
  onRead,
  onDetails,
}: {
  item: StaffNotification;
  busy: boolean;
  onRead: () => void;
  onDetails: () => void;
}) {
  return (
    <View className="gap-3 rounded-[18px] border border-[#E4EBE6] bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAF5EF]">
          <Ionicons name="notifications-outline" size={20} color="#236347" />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-[#23382D]">{item.title}</Text>
          <Text className="mt-1 text-[11px] text-[#53665B]">
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>
        <Text className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.readAt ? 'bg-[#EAF5EF] text-[#236347]' : 'bg-[#FFF4DE] text-[#8A5316]'}`}>
          {item.readAt ? 'Đã xem' : 'Chưa xem'}
        </Text>
      </View>
      <Text className="text-[14px] leading-[21px] text-[#53665B]">{item.message}</Text>
      <View className="flex-row flex-wrap items-center justify-end gap-2">
        <Pressable accessibilityRole="button" onPress={onDetails} className="min-h-[44px] justify-center px-3">
          <Text className="text-[13px] font-semibold text-[#12664C]">Xem chi tiết</Text>
        </Pressable>
        {!item.readAt && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onRead}
            className="min-h-[44px] justify-center rounded-[12px] bg-[#12664C] px-3 disabled:opacity-50"
          >
            <Text className="text-[13px] font-semibold text-white">Đánh dấu đã xem</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
