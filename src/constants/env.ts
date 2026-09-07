// EXPO_PUBLIC values are bundled into the app. Never put secrets here.
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
} as const;
