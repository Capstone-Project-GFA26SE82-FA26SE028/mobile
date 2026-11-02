import axios from 'axios';
import { apiConfig } from './config';
import { authService } from '../features/auth/api/authApi';

declare module 'axios' {
  interface AxiosRequestConfig {
    staffSession?: string;
  }
}

export const axiosClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 15_000,
});
axiosClient.interceptors.request.use(async (config) => {
  if (!config.baseURL)
    throw new Error(
      'Vui lòng cấu hình EXPO_PUBLIC_API_URL trước khi kết nối máy chủ.',
    );
  const identity = authService.identity();
  if (config.staffSession && config.staffSession !== identity)
    throw new Error(
      'Tài khoản đã thay đổi. Vui lòng tải lại trước khi thử lại.',
    );
  const token = await authService.token();
  if (identity !== authService.identity())
    throw new Error(
      'Tài khoản đã thay đổi. Vui lòng tải lại trước khi thử lại.',
    );
  if (token && identity) {
    config.staffSession = identity;
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response?.status !== 401 || !config?.headers?.Authorization)
      throw error;
    if (config.staffSession !== authService.identity()) throw error;
    if (config.authRetried) {
      await authService
        .clear('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.')
        .catch(() => {});
      throw error;
    }
    config.authRetried = true;
    const rejectedToken = String(config.headers.Authorization).replace(
      /^Bearer /,
      '',
    );
    const token = await authService.unauthorized(rejectedToken);
    config.headers.set('Authorization', `Bearer ${token}`);
    return axiosClient.request(config);
  },
);
