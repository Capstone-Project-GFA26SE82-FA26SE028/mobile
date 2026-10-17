import { configureStore } from '@reduxjs/toolkit';

import waiterReducer from '@/features/waiter/shared/waiterSlice';
export const store = configureStore({ reducer: { waiter: waiterReducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
