import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

export function ErrorState({
  message,
  stale = false,
  onRetry,
  busy = false,
  retryLabel = 'Thử lại',
}: {
  message: string;
  stale?: boolean;
  onRetry?: () => void;
  busy?: boolean;
  retryLabel?: string;
}) {
  return (
    <View
      accessibilityRole="alert"
      className="bg-[#FFF6E7] rounded-[14px] p-[14px] flex-row gap-[9px] mb-[12px]"
    >
      <Ionicons name="alert-circle-outline" size={19} color={'#A76A1B'} />
      <View className="grow-[1] shrink-0 basis-[0px]">
        <Text className="text-[#86591E] text-[13px] leading-[20px]">
          {message}
        </Text>
        {stale && (
          <Text className="text-[#86591E] text-[13px] leading-[20px] mt-[4px]">
            Đang hiển thị dữ liệu đã tải gần nhất.
          </Text>
        )}
        {onRetry && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onRetry}
            className="min-h-[44px] justify-center self-start"
          >
            <Text className="text-[#153F30] font-semibold text-[13px]">
              {retryLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
