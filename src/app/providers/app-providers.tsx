import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { createQueryClient } from '@/app/queryClient';
import { store } from '@/app/store';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  useEffect(() => {
    // Clear cached server data on account changes, including automatic session expiry.
    let identity = store.getState().waiter.waiter?.id;
    const unsubscribe = store.subscribe(() => {
      const next = store.getState().waiter.waiter?.id;
      if (next !== identity) {
        identity = next;
        queryClient.clear();
      }
    });
    const subscription = AppState.addEventListener('change', status => focusManager.setFocused(status === 'active'));
    return () => { unsubscribe(); subscription.remove(); };
  }, [queryClient]);
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
