import { usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const destinations = [
  { path: '/inventory', label: 'Tồn kho', icon: 'layers-outline' },
  { path: '/goods-receipts', label: 'Nhập kho', icon: 'download-outline' },
] as const;

export function InventoryNavigation({ maxWidth }: { maxWidth: number }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View style={s.container}>
      <View accessibilityRole="tablist" style={[s.tabs, { maxWidth }]}>
        {destinations.map((item) => {
          const active = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) router.navigate(item.path);
              }}
              style={({ pressed }) => [s.tab, pressed && s.pressed]}
            >
              <View style={s.icon}>
                <Ionicons
                  name={item.icon}
                  size={25}
                  color={active ? '#12664C' : '#99A69D'}
                />
              </View>
              <Text
                style={[
                  s.label,
                  active && s.activeLabel,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5EBE7',
  },
  tabs: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 4,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65 },
  label: { fontSize: 10, fontWeight: '500', color: '#7C8983' },
  activeLabel: { color: '#12664C', fontWeight: '700' },
});
