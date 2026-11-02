import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppSelector } from '../../../app/hooks';
import type { StaffProfile, StaffRole } from '../types/types';

export function getStaffHome(user: StaffProfile) {
  return user.role === 'waiter' ? '/waiter/tables' : '/inventory';
}

export function RoleGate({
  role,
  children,
}: PropsWithChildren<{ role: StaffRole }>) {
  const auth = useAppSelector((state) => state.auth);
  if (auth.status === 'loading')
    return (
      <View className="grow-[1] shrink-0 basis-[0px] justify-center">
        <ActivityIndicator color="#236347" />
      </View>
    );
  if (!auth.user) return <Redirect href="/login" />;
  if (auth.user.role !== role)
    return <Redirect href={getStaffHome(auth.user)} />;
  return <>{children}</>;
}
