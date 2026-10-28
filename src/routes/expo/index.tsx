import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import { getStaffHome } from '@/features/auth/components/RoleGate';
export default function Index() {
  const auth = useAppSelector((state) => state.auth);
  if (auth.status === 'loading')
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color="#236347" />
      </View>
    );
  return <Redirect href={auth.user ? getStaffHome(auth.user) : '/login'} />;
}
