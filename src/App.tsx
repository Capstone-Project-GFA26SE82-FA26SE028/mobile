import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/app/providers/app-providers';
export default function App() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F7F5' },
        }}
      />
    </AppProviders>
  );
}
