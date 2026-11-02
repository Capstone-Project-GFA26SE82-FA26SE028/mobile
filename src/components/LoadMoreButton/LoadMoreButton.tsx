import { ActivityIndicator, Pressable, Text } from 'react-native';

export function LoadMoreButton({
  busy,
  onPress,
  label = 'Tải thêm',
}: {
  busy: boolean;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Đang tải thêm' : label}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      className="min-h-[48px] border-[1px] border-[#CCDCD1] rounded-[14px] items-center justify-center mt-[16px]"
    >
      {busy ? (
        <ActivityIndicator
          accessibilityLabel="Đang tải thêm"
          color={'#236347'}
        />
      ) : (
        <Text className="text-[#236347] font-semibold text-[14px]">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
