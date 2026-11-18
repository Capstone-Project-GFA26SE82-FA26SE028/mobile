import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { CollectionDraft } from '../types';
const keyFor = (user: string, request: string) =>
  `waiter.cash.${user}.${request}`;
export async function readCollection(
  user: string,
  request: string,
): Promise<CollectionDraft | null> {
  const key = keyFor(user, request);
  const raw =
    Platform.OS === 'web'
      ? globalThis.localStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
  if (!raw) return null;
  const value = JSON.parse(raw) as CollectionDraft;
  if (
    !value.key ||
    !value.billId ||
    !value.checkoutId ||
    !Number.isSafeInteger(value.received) ||
    value.received <= 0
  ) {
    throw new Error(
      'Thông tin thu hộ đã lưu không hợp lệ. Hãy kiểm tra với thu ngân.',
    );
  }
  return value;
}
export async function saveCollection(
  user: string,
  request: string,
  draft: CollectionDraft,
) {
  const key = keyFor(user, request);
  const value = JSON.stringify(draft);
  if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value);
  else
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
}
