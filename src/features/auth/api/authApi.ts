import axios, { type AxiosInstance } from 'axios';
import { apiConfig } from '../../../api/config';
import { authStorage } from '../storage';
import type {
  AuthCredentials,
  AuthStorage,
  SavedSession,
  StaffProfile,
} from '../types/types';

type Envelope<T> = { isSuccess: boolean; message?: string; result: T };

export function authError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return 'Unable to connect. Check your connection and API address.';
    return typeof error.response.data?.message === 'string'
      ? error.response.data.message
      : 'Unable to complete the authentication request.';
  }
  return error instanceof Error ? error.message : 'Unable to sign in.';
}

export function createAuthService(
  client: Pick<AxiosInstance, 'post'>,
  storage: AuthStorage,
) {
  let credentials: AuthCredentials | null = null;
  let revision = 0;
  let refreshing: Promise<string> | null = null;
  let restoring: Promise<void> | null = null;
  let writes: Promise<void> = Promise.resolve();
  let onChange: (
    user: StaffProfile | null,
    message?: string,
  ) => void = () => {};

  function save(value: SavedSession | null) {
    writes = writes.catch(() => {}).then(() => storage.write(value));
    return writes;
  }
  function clear(message = '') {
    revision++;
    credentials = null;
    refreshing = null;
    onChange(null, message);
    // Logout blocks access immediately; a failed device write is surfaced by logout.
    return save(null);
  }
  function validate(value: AuthCredentials): StaffProfile {
    if (
      !value?.user?.isActive ||
      !['waiter', 'inventory'].includes(value.user.roleId)
    )
      throw new Error(
        'Only active Waiter or Inventory accounts can access this app.',
      );
    if (
      !value.user.userId ||
      !value.user.email ||
      !value.accessToken ||
      !value.refreshToken ||
      !value.sessionId ||
      !(Date.parse(value.expiresAt) > Date.now()) ||
      !(Date.parse(value.sessionExpiresAt) > Date.now())
    )
      throw new Error('Invalid session response. Please sign in again.');
    return {
      id: value.user.userId,
      name:
        value.user.fullName?.trim() || value.user.userName || value.user.email,
      email: value.user.email,
      role: value.user.roleId as StaffProfile['role'],
      active: true,
    };
  }
  async function revoke(value: AuthCredentials) {
    if (value?.accessToken)
      await client
        .post('/api/auth/logout', undefined, {
          headers: { Authorization: `Bearer ${value.accessToken}` },
        })
        .catch(() => {});
  }
  async function accept(value: AuthCredentials, expectedRevision: number) {
    if (expectedRevision !== revision) {
      await revoke(value);
      throw new Error('The session changed. Please sign in again.');
    }
    let profile: StaffProfile;
    try {
      profile = validate(value);
      await save({
        refreshToken: value.refreshToken,
        sessionExpiresAt: value.sessionExpiresAt,
      });
    } catch (error) {
      await revoke(value);
      throw error;
    }
    if (expectedRevision !== revision) {
      await revoke(value);
      throw new Error('The session changed. Please sign in again.');
    }
    credentials = value;
    onChange(profile);
    return profile;
  }
  async function refreshSession(saved: SavedSession, expectedRevision: number) {
    if (!(Date.parse(saved.sessionExpiresAt) > Date.now()))
      throw new Error('Your session expired. Please sign in again.');
    const { data } = await client.post<Envelope<AuthCredentials>>(
      '/api/auth/refresh',
      { refreshToken: saved.refreshToken },
    );
    if (!data.isSuccess)
      throw new Error(data.message || 'Please sign in again.');
    if (
      credentials &&
      (data.result.user.userId !== credentials.user.userId ||
        data.result.sessionId !== credentials.sessionId)
    )
      throw new Error('The session changed. Please sign in again.');
    await accept(data.result, expectedRevision);
    return data.result.accessToken;
  }
  async function refresh(): Promise<string> {
    if (refreshing) return refreshing;
    if (!credentials) throw new Error('Please sign in again.');
    const previous = credentials;
    const expectedRevision = revision;
    const task = refreshSession(previous, expectedRevision).catch(
      async (error) => {
        if (expectedRevision === revision)
          await clear('Your session ended. Please sign in again.').catch(
            () => {},
          );
        throw error;
      },
    );
    refreshing = task;
    try {
      return await task;
    } finally {
      if (refreshing === task) refreshing = null;
    }
  }
  return {
    onChange(callback: typeof onChange) {
      onChange = callback;
    },
    clear,
    restore(): Promise<void> {
      if (restoring) return restoring;
      const expectedRevision = revision;
      restoring = (async () => {
        try {
          const saved = await storage.read();
          if (expectedRevision !== revision) return;
          if (!saved) {
            onChange(null);
            return;
          }
          await refreshSession(saved, expectedRevision);
        } catch (error) {
          if (expectedRevision === revision)
            await clear(authError(error)).catch(() => {});
        }
      })();
      return restoring;
    },
    async login(email: string, password: string) {
      const clearing = clear();
      const expectedRevision = revision;
      await clearing;
      const { data } = await client.post<Envelope<AuthCredentials>>(
        '/api/auth/login',
        { email: email.trim(), password },
      );
      if (!data.isSuccess)
        throw new Error(data.message || 'Unable to sign in.');
      return accept(data.result, expectedRevision);
    },
    identity() {
      return credentials
        ? credentials.user.userId + ':' + credentials.sessionId
        : null;
    },
    async token(): Promise<string | null> {
      if (!credentials) return null;
      return Date.parse(credentials.expiresAt) <= Date.now() + 30000
        ? refresh()
        : credentials.accessToken;
    },
    async unauthorized(rejectedToken: string) {
      if (!credentials) throw new Error('Please sign in again.');
      return credentials.accessToken !== rejectedToken
        ? credentials.accessToken
        : refresh();
    },
    async logout() {
      const previous = credentials;
      let storageError: unknown;
      const clearing = clear().catch((cause) => {
        storageError = cause;
      });
      const expectedRevision = revision;
      let error: unknown;
      if (previous) {
        try {
          await client.post('/api/auth/logout', undefined, {
            headers: { Authorization: `Bearer ${previous.accessToken}` },
          });
        } catch (cause) {
          error = cause;
        }
      }
      await clearing;
      if (storageError) {
        const message =
          'Signed out. Unable to remove the saved session from device storage.';
        if (expectedRevision === revision) onChange(null, message);
        throw new Error(message);
      }
      if (error) {
        const message =
          'Signed out on this device. Server sign-out could not be confirmed.';
        if (expectedRevision === revision) onChange(null, message);
        throw new Error(message);
      }
    },
  };
}

const client = axios.create({ baseURL: apiConfig.baseURL, timeout: 15000 });
client.interceptors.request.use((config) => {
  if (!config.baseURL)
    throw new Error('Set EXPO_PUBLIC_API_URL before signing in.');
  return config;
});
export const authService = createAuthService(client, authStorage);
