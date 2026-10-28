import WaiterLayout from '@/layouts/waiter/WaiterLayout';
import { RoleGate } from '@/features/auth/components/RoleGate';

export default function WaiterRoute() {
  return (
    <RoleGate role="waiter">
      <WaiterLayout />
    </RoleGate>
  );
}
