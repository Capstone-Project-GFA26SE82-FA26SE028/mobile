import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/hooks/useAuth';

export default function InventoryHomeScreen() {
  const auth = useAuth();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.brand}>FoodHub</Text>
        <Text style={styles.role}>Inventory</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, {auth.user?.name}</Text>
        <Text style={styles.email}>{auth.user?.email}</Text>
        <Text style={styles.description}>
          You are signed in to the inventory workspace.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={auth.loading}
          onPress={() => void auth.logout()}
          style={styles.button}
        >
          {auth.loading ? (
            <ActivityIndicator color="#236347" />
          ) : (
            <Text style={styles.buttonText}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAF9F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderColor: '#E1E7E2',
  },
  brand: { fontSize: 24, fontWeight: '700', color: '#153F30' },
  role: { fontSize: 13, color: '#236347' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#23382D' },
  email: { marginTop: 8, color: '#667368' },
  description: { marginTop: 24, color: '#667368', lineHeight: 22 },
  button: {
    minHeight: 48,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBDDD0',
    borderRadius: 12,
  },
  buttonText: { color: '#236347', fontWeight: '600' },
});
