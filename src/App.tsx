import * as SplashScreen from 'expo-splash-screen';

import Router from '@/routes/router';
import { AppProviders } from '@/app/providers/app-providers';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <Router />
    </AppProviders>
  );
}
