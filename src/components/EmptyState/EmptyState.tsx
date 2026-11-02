import type { ComponentProps, PropsWithChildren } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

export function EmptyState({
  title,
  children,
  icon = 'cube-outline',
}: PropsWithChildren<{
  title: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}>) {
  return (
    <View className="px-[24px] py-[44px] items-center bg-[#fff] border-[1px] border-[#E4EBE6] rounded-[20px]">
      <View className="w-[58px] h-[58px] rounded-[18px] items-center justify-center bg-[#EAF4ED]">
        <Ionicons name={icon} size={28} color={'#236347'} />
      </View>
      <Text className="text-[#23382D] text-[18px] font-bold text-center mt-[16px]">
        {title}
      </Text>
      {!!children && (
        <Text className="text-[#738078] text-[13px] leading-[21px] text-center mt-[8px]">
          {children}
        </Text>
      )}
    </View>
  );
}
