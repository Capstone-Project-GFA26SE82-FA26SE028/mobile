import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import { createQueryClient } from '@/app/queryClient';
import { store } from '@/app/store';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
