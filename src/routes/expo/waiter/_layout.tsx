import { Redirect, Slot } from 'expo-router';
import { useAppSelector } from '@/app/hooks';

export default function WaiterLayout() {
  const signedIn = useAppSelector((state) => state.auth.signedIn);
  return signedIn ? <Slot /> : <Redirect href="/login" />;
}
