import { usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

const destinations = [
  { path: '/inventory', label: 'Tồn kho', icon: 'layers-outline' },
  { path: '/goods-receipts', label: 'Nhập kho', icon: 'download-outline' },
] as const;

export function InventoryNavigation({ maxWidth }: { maxWidth: number }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View className="bg-[#fff] border-t-[1px] border-[#E5EBE7]">
      <View
        accessibilityRole="tablist"
        className="w-[100%] self-center flex-row pt-[10px] pb-[8px]"
        style={{ maxWidth }}
      >
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
              className="grow-[1] shrink-0 basis-[0px] min-h-[50px] py-[4px] gap-[4px] items-center justify-center active:opacity-[0.65]"
            >
              <View className="w-[28px] h-[28px] items-center justify-center">
                <Ionicons
                  name={item.icon}
                  size={25}
                  color={active ? '#12664C' : '#99A69D'}
                />
              </View>
              <Text
                className={`text-[10px] ${active ? 'font-bold text-[#12664C]' : 'font-medium text-[#7C8983]'}`}
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
