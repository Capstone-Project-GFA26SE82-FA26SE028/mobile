import { configureStore } from '@reduxjs/toolkit';

import waiterReducer from '@/features/waiter/shared/waiterSlice';
import { signOut } from '@/features/waiter/shared/waiterSlice';
import { authService } from '@/features/waiter/auth/authService';
export const store = configureStore({ reducer: { waiter: waiterReducer } });
authService.onExpired(() => { store.dispatch(signOut()); });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
