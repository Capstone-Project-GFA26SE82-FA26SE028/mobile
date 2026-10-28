import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { createQueryClient } from '@/app/queryClient';
import { store } from '@/app/store';
import { authService } from '@/features/auth/api/authApi';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  useEffect(() => {
    // Clear cached server data on account changes, including automatic session expiry.
    const identityKey = () => {
      const user = store.getState().auth.user;
      return user ? user.role + ':' + user.id : null;
    };
    let identity = identityKey();
    const unsubscribe = store.subscribe(() => {
      const next = identityKey();
      if (next !== identity) {
        identity = next;
        queryClient.clear();
      }
    });
    const checkSession = () => {
      void authService.token().catch(() => {});
    };
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
      if (status === 'active') checkSession();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') checkSession();
    }, 30000);
    void authService.restore();
    return () => {
      unsubscribe();
      subscription.remove();
      clearInterval(timer);
    };
  }, [queryClient]);
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
