import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StaffProfile } from './types/types';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: StaffProfile | null;
  message: string;
};
const initialState: AuthState = { status: 'loading', user: null, message: '' };
const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionChanged(
      state,
      {
        payload,
      }: PayloadAction<{ user: StaffProfile | null; message?: string }>,
    ) {
      state.user = payload.user;
      state.status = payload.user ? 'signedIn' : 'signedOut';
      state.message = payload.message || '';
    },
  },
});
export const { sessionChanged } = slice.actions;
export default slice.reducer;
