import axios from 'axios';
import { apiConfig } from './config';

export const axiosClient = axios.create({ baseURL: apiConfig.baseURL });
axiosClient.interceptors.request.use((config) => {
  if (!config.baseURL) throw new Error('Set EXPO_PUBLIC_API_URL before making API requests.');
  return config;
});
