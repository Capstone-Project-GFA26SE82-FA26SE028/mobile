import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createWaiterState } from './data/seed';
import { waiterMenu } from './data/menu';
import { applyCommand } from './rules';
import type { Command } from './types';
import { receiveKitchenReady, type KitchenReadyEvent } from '../notifications/events';
import { demoWaiter } from '../auth/data/demo';
import type { WaiterProfile } from '../auth/data/demo';
const slice = createSlice({
  name: 'waiter',
  initialState: createWaiterState(),
  reducers: {
    setAuthMessage(state, { payload }: PayloadAction<string>) {
      state.authMessage = payload;
    },
    authenticated(state, { payload }: PayloadAction<WaiterProfile>) {
      state.authMessage = undefined;
      state.signedIn = true;
      state.authMode = 'api';
      state.waiter = payload;
      state.feedback = null;
    },
    kitchenReady(state, { payload }: PayloadAction<KitchenReadyEvent & { now: number }>) {
      const error = receiveKitchenReady(state, payload, payload.now);
      state.feedback = error
        ? { id: `ready-${payload.itemId}-${payload.now}`, text: error, error: true }
        : null;
    },
    enterDemo(state) {
      state.authMessage = undefined;
      state.authMode = 'demo';
      state.signedIn = true;
      state.waiter = { ...demoWaiter };
      state.feedback = null;
    },
    signOut(state) {
      state.authMessage = undefined;
      state.authMode = undefined;
      state.signedIn = false;
      state.waiter = null;
      state.alerts = false;
      state.feedback = null;
    },
    setAlerts(state, action: PayloadAction<boolean>) {
      state.alerts = action.payload;
    },
    clearFeedback(state) {
      state.feedback = null;
    },
    execute(state, { payload }: PayloadAction<Command>) {
      const error = applyCommand(state, payload, waiterMenu);
      if (payload.type !== 'seen' || error)
        state.feedback = {
          id: payload.id,
          text: error || (payload.type === 'confirm-order'
            ? 'Đã xác nhận lượt gọi và ghi nhận chuyển bếp, thu ngân trong phiên dùng thử.'
            : 'Đã ghi nhận trong phiên dùng thử.'),
          error: !!error,
        };
      else state.feedback = null;
    },
  },
});
export const { setAuthMessage, authenticated, enterDemo, signOut, setAlerts, clearFeedback, execute, kitchenReady } =
  slice.actions;
export default slice.reducer;
