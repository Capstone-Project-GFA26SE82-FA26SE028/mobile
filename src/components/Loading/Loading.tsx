import { ActivityIndicator, View } from 'react-native';

export function Loading({
  label = 'Đang tải dữ liệu',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <View className={` ${compact ? 'py-[12px]' : 'py-[48px]'}`}>
      <ActivityIndicator accessibilityLabel={label} color={'#236347'} />
    </View>
  );
}
