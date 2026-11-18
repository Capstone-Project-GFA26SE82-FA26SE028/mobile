import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
export function NotificationBanner() {
  const router = useRouter();
  const feed = useNotifications();
  const item = feed.data?.find((row) => !row.readAt);
  if (!item) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Xem thông báo mới"
      onPress={() => router.push('/waiter/notifications')}
      className="bg-[#FFF4DF] px-[20px] py-[12px]"
    >
      <Text className="text-[14px] font-[600] text-[#183B32]">
        {item.title}
      </Text>
      <Text className="text-[12px] text-[#7C8983]">{item.message}</Text>
    </Pressable>
  );
}
