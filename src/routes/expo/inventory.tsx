import { RoleGate } from '@/features/auth/components/RoleGate';
import InventoryHomeScreen from '@/features/inventory/screens/InventoryHomeScreen';

export default function InventoryRoute() {
  return (
    <RoleGate role="inventory">
      <InventoryHomeScreen />
    </RoleGate>
  );
}
