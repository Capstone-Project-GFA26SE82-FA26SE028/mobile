import { RoleGate } from '@/features/auth/components/RoleGate';
import StockDetailScreen from '@/features/inventory/stock/screens/StockDetailScreen';

export default function InventoryDetailRoute() {
  return (
    <RoleGate role="inventory">
      <StockDetailScreen />
    </RoleGate>
  );
}
