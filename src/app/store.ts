import waiterCollectionReducer from '@/features/waiter/cash-collection/store/collectionSlice';
import { configureStore } from '@reduxjs/toolkit';

import waiterReducer from '@/features/waiter/shared/store/waiterSlice';
import {
  authenticated,
  profileUpdated,
  signOut,
} from '@/features/waiter/shared/store/waiterSlice';
import { authService } from '@/features/auth/api/authApi';
import authReducer, { sessionChanged } from '@/features/auth/authSlice';
import waiterCartReducer from '@/features/waiter/ordering/store/cartSlice';
import waiterNotificationsReducer from '@/features/waiter/notifications/store/notificationSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    waiter: waiterReducer,
    waiterCart: waiterCartReducer,
    waiterCollection: waiterCollectionReducer,
    waiterNotifications: waiterNotificationsReducer,
  },
});
authService.onChange((user, message) => {
  // Existing Waiter screens receive the common profile, not a separate login session.
  const previous = store.getState().waiter;
  if (user?.role === 'waiter') {
    if (previous.authMode !== 'api' || previous.waiter?.id !== user.id) {
      store.dispatch(authenticated({ ...user, role: 'waiter' }));
    } else store.dispatch(profileUpdated({ ...user, role: 'waiter' }));
  } else store.dispatch(signOut());
  store.dispatch(sessionChanged({ user, message }));
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
