import { StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';

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
      style={s.loadMore}
    >
      {busy ? (
        <ActivityIndicator
          accessibilityLabel="Đang tải thêm"
          color={'#236347'}
        />
      ) : (
        <Text style={{ color: '#236347', fontWeight: '600', fontSize: 14 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  loadMore: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CCDCD1',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
