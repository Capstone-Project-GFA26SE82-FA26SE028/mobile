import { env } from '../constants/env';

// Set EXPO_PUBLIC_API_URL before connecting feature services to a backend.
export const apiConfig = {
  baseURL: env.apiUrl,
} as const;
