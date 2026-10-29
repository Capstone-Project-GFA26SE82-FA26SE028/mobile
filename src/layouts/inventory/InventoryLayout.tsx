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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <InventoryHeader
        title={title}
        subtitle={subtitle}
        onBack={goBack}
        maxWidth={maxWidth}
      />
      <View style={{ flex: 1, backgroundColor: '#F5F7F5' }}>{children}</View>
      {(showNavigation ?? (!back && !onBack)) && (
        <InventoryNavigation maxWidth={maxWidth} />
      )}
    </SafeAreaView>
  );
}
