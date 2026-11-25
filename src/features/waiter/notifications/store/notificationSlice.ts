import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StaffNotification } from '@/features/notifications/types/types';
import type { NotificationState } from '../types/api';
const initialState: NotificationState = {
  initialized: false,
  knownIds: {},
  soundEnabled: true,
  soundCue: 0,
  soundError: null,
};
const slice = createSlice({
  name: 'waiterNotifications',
  initialState,
  reducers: {
    notificationsReceived(
      state,
      { payload }: PayloadAction<StaffNotification[]>,
    ) {
      const hasNew =
        state.initialized &&
        payload.some((item) => !item.readAt && !state.knownIds[item.id]);
      payload.forEach((item) => {
        state.knownIds[item.id] = true;
      });
      state.initialized = true;
      if (hasNew && state.soundEnabled) state.soundCue++;
    },
    setNotificationSound(state, { payload }: PayloadAction<boolean>) {
      state.soundEnabled = payload;
      state.soundError = null;
    },
    notificationSoundFailed(state, { payload }: PayloadAction<string | null>) {
      state.soundError = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        ['waiter/signOut', 'waiter/authenticated', 'waiter/enterDemo'].includes(
          action.type,
        ),
      () => initialState,
    );
  },
});
export const {
  notificationsReceived,
  setNotificationSound,
  notificationSoundFailed,
} = slice.actions;
export default slice.reducer;
