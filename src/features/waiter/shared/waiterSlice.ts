import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createWaiterState } from './data/seed';
import { waiterMenu } from './data/menu';
import { applyCommand } from './rules';
import type { Command } from './types';
const slice = createSlice({
  name: 'waiter',
  initialState: createWaiterState(),
  reducers: {
    enterDemo(state) {
      state.signedIn = true;
      state.feedback = null;
    },
    signOut(state) {
      state.signedIn = false;
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
      if (payload.type !== 'seen')
        state.feedback = {
          id: payload.id,
          text: error || (payload.type === 'confirm-order'
            ? 'Đã xác nhận lượt gọi và ghi nhận chuyển bếp, thu ngân trong phiên dùng thử.'
            : 'Đã ghi nhận trong phiên dùng thử.'),
          error: !!error,
        };
    },
  },
});
export const { enterDemo, signOut, setAlerts, clearFeedback, execute } =
  slice.actions;
export default slice.reducer;
