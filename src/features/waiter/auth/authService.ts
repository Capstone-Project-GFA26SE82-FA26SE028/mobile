import axios, { type AxiosInstance } from 'axios';
import { apiConfig } from '../../../api/config';
import { endpoints } from '../../../api/endpoints';
import type { WaiterProfile } from './data/demo';

type Envelope<T> = { isSuccess: boolean; message: string; result: T };
type Credentials = {
  user: { userId: string; userName: string; fullName?: string; email: string; roleId: string; isActive: boolean };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: string;
  sessionExpiresAt: string;
};

export function authError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được backend. Kiểm tra địa chỉ API và kết nối mạng.';
    return error.response.data?.message || 'Không thể xử lý yêu cầu đăng nhập.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu đăng nhập.';
}

// Credentials stay in memory; never persist refresh tokens in public environment or web storage.
export function createAuthService(client: Pick<AxiosInstance, 'post'>) {
  let credentials: Credentials | null = null;
  let revision = 0;
  let refreshing: Promise<string> | null = null;
  let onExpired = () => {};

  function clear() {
    revision++;
    credentials = null;
    refreshing = null;
    onExpired();
  }

  function validate(value: Credentials): WaiterProfile {
    if (!value?.user?.isActive || value.user.roleId !== 'waiter') {
      throw new Error('Chỉ tài khoản nhân viên phục vụ đang hoạt động mới được đăng nhập.');
    }
    if (!value.user.userId || !value.accessToken || !value.refreshToken || !value.sessionId ||
        !(Date.parse(value.expiresAt) > Date.now()) || !(Date.parse(value.sessionExpiresAt) > Date.now())) {
      throw new Error('Dữ liệu phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
    }
    return { id: value.user.userId, name: value.user.fullName?.trim() || value.user.userName || value.user.email,
      role: 'waiter', active: true, email: value.user.email };
  }

  async function refresh(): Promise<string> {
    if (refreshing) return refreshing;
    const previous = credentials;
    const currentRevision = revision;
    if (!previous) throw new Error('Vui lòng đăng nhập lại.');
    const task = (async () => {
      try {
        if (Date.parse(previous.sessionExpiresAt) <= Date.now()) throw new Error('Phiên đăng nhập đã hết hạn.');
        const { data } = await client.post<Envelope<Credentials>>(endpoints.refresh, { refreshToken: previous.refreshToken });
        if (currentRevision !== revision) throw new Error('Phiên đăng nhập đã thay đổi.');
        if (!data.isSuccess) throw new Error(data.message);
        validate(data.result);
        credentials = data.result;
        return data.result.accessToken;
      } catch (error) {
        if (currentRevision === revision) clear();
        throw error;
      }
    })();
    refreshing = task;
    try { return await task; }
    finally { if (refreshing === task) refreshing = null; }
  }

  return {
    onExpired(callback: () => void) { onExpired = callback; },
    clear,
    async login(email: string, password: string): Promise<WaiterProfile> {
      clear();
      const currentRevision = revision;
      const { data } = await client.post<Envelope<Credentials>>(endpoints.login, { email: email.trim(), password });
      if (currentRevision !== revision) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (!data.isSuccess) throw new Error(data.message);
      try {
        const profile = validate(data.result);
        credentials = data.result;
        return profile;
      } catch (error) {
        // The server may have created a session for a non-Waiter account; revoke it.
        if (data.result?.accessToken) {
          await client.post(endpoints.logout, undefined, {
            headers: { Authorization: `Bearer ${data.result.accessToken}` },
          }).catch(() => {});
        }
        throw error;
      }
    },
    async token(): Promise<string | null> {
      if (!credentials) return null;
      return Date.parse(credentials.expiresAt) <= Date.now() + 30_000 ? refresh() : credentials.accessToken;
    },
    async unauthorized(rejectedToken: string): Promise<string> {
      if (!credentials) throw new Error('Vui lòng đăng nhập lại.');
      // Concurrent 401s may arrive after another request has rotated the token.
      return credentials.accessToken !== rejectedToken ? credentials.accessToken : refresh();
    },
    async logout() {
      try {
        const token = credentials ? await this.token() : null;
        if (token) await client.post(endpoints.logout, undefined, { headers: { Authorization: `Bearer ${token}` } });
      } finally { clear(); }
    },
  };
}

const transport = axios.create({ baseURL: apiConfig.baseURL, timeout: 15_000 });
transport.interceptors.request.use((config) => {
  if (!config.baseURL) throw new Error('Chưa cấu hình EXPO_PUBLIC_API_URL cho backend.');
  return config;
});
export const authService = createAuthService(transport);
