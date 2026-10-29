import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Pressable, Text, View } from 'react-native';

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
    <View accessibilityRole="alert" style={s.error}>
      <Ionicons name="alert-circle-outline" size={19} color={'#A76A1B'} />
      <View style={{ flex: 1 }}>
        <Text style={s.errorText}>{message}</Text>
        {stale && (
          <Text style={[s.errorText, { marginTop: 4 }]}>
            Đang hiển thị dữ liệu đã tải gần nhất.
          </Text>
        )}
        {onRetry && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onRetry}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: '#153F30', fontWeight: '600', fontSize: 13 }}>
              {retryLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  error: {
    backgroundColor: '#FFF6E7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },
  errorText: { color: '#86591E', fontSize: 13, lineHeight: 20 },
});
