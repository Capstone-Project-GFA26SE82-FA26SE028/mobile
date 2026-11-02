import { Tabs } from 'expo-router';

export default function InventoryTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="goods-receipts" />
      <Tabs.Screen name="inventory-profile" />
    </Tabs>
  );
}
