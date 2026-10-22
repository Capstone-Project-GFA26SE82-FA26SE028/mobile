import { configureStore } from '@reduxjs/toolkit';

import waiterReducer from '@/features/waiter/shared/waiterSlice';
import { signOut } from '@/features/waiter/shared/waiterSlice';
import { authService } from '@/features/waiter/auth/authService';
import waiterCartReducer from '@/features/waiter/ordering/cartSlice';
export const store = configureStore({ reducer: { waiter: waiterReducer, waiterCart: waiterCartReducer } });
authService.onExpired(() => { store.dispatch(signOut()); });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
