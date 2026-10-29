import { ActivityIndicator, View } from 'react-native';

export function Loading({
  label = 'Đang tải dữ liệu',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <View style={{ paddingVertical: compact ? 12 : 48 }}>
      <ActivityIndicator accessibilityLabel={label} color={'#236347'} />
    </View>
  );
}
