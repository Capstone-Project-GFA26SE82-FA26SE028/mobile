import axios from 'axios';
import { apiConfig } from './config';
import { authService } from '../features/waiter/auth/authService';

export const axiosClient = axios.create({ baseURL: apiConfig.baseURL, timeout: 15_000 });
axiosClient.interceptors.request.use(async (config) => {
  if (!config.baseURL) throw new Error('Set EXPO_PUBLIC_API_URL before making API requests.');
  const token = await authService.token();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
axiosClient.interceptors.response.use(response => response, async (error) => {
  const config = error.config;
  if (error.response?.status !== 401 || !config?.headers?.Authorization) throw error;
  if (config.authRetried) {
    authService.clear();
    throw error;
  }
  config.authRetried = true;
  const rejectedToken = String(config.headers.Authorization).replace(/^Bearer /, '');
  const token = await authService.unauthorized(rejectedToken);
  config.headers.set('Authorization', `Bearer ${token}`);
  return axiosClient.request(config);
});
