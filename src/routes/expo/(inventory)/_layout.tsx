import { Stack } from 'expo-router';
import { RoleGate } from '@/features/auth/components/RoleGate';

import { useInventoryNotificationSound } from '@/features/inventory/notifications/hooks/useInventoryNotifications';

export default function InventoryRoutes() {
  useInventoryNotificationSound();
  return (
    <RoleGate role="inventory">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F7F5' },
        }}
      />
    </RoleGate>
  );
}
