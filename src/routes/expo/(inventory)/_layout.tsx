import { Stack } from 'expo-router';
import { RoleGate } from '@/features/auth/components/RoleGate';

export default function InventoryRoutes() {
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
