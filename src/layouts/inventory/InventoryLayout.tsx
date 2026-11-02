import type { PropsWithChildren } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InventoryHeader } from './InventoryHeader';
import { InventoryNavigation } from './InventoryNavigation';

export default function InventoryLayout({
  children,
  title,
  subtitle,
  back,
  onBack,
  maxWidth = 1000,
  showNavigation,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  back?: '/inventory' | '/goods-receipts';
  onBack?: () => void;
  maxWidth?: number;
  showNavigation?: boolean;
}>) {
  const router = useRouter();
  const goBack =
    onBack ||
    (back
      ? () => (router.canGoBack() ? router.back() : router.replace(back))
      : undefined);
  return (
    <SafeAreaView className="grow-[1] shrink-0 basis-[0px] bg-[#fff]">
      <InventoryHeader
        title={title}
        subtitle={subtitle}
        onBack={goBack}
        maxWidth={maxWidth}
      />
      <View className="grow-[1] shrink-0 basis-[0px] bg-[#F5F7F5]">
        {children}
      </View>
      {(showNavigation ?? (!back && !onBack)) && (
        <InventoryNavigation maxWidth={maxWidth} />
      )}
    </SafeAreaView>
  );
}
