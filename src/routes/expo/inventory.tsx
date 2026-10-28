import { RoleGate } from '@/features/auth/components/RoleGate';
import StockListScreen from '@/features/inventory/stock/screens/StockListScreen';

export default function InventoryRoute() {
  return (
    <RoleGate role="inventory">
      <StockListScreen />
    </RoleGate>
  );
}
