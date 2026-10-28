import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthStorage } from './types/types';

const key = 'foodhub.staff.session';

// Web preview stays memory-only; credentials never go into browser storage.
export const authStorage: AuthStorage = {
  async read() {
    if (Platform.OS === 'web') return null;
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw);
      return typeof saved.refreshToken === 'string' &&
        typeof saved.sessionExpiresAt === 'string'
        ? saved
        : null;
    } catch {
      return null;
    }
  },
  async write(session) {
    if (Platform.OS === 'web') return;
    if (session)
      await SecureStore.setItemAsync(key, JSON.stringify(session), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    else await SecureStore.deleteItemAsync(key);
  },
};
