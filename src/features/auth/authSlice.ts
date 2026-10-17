import { createSlice } from '@reduxjs/toolkit';

// Demo navigation state only. Real authentication requires the backend contract.
const authSlice = createSlice({
  name: 'auth',
  initialState: { signedIn: false },
  reducers: {
    enterDemo(state) {
      state.signedIn = true;
    },
    signOut(state) {
      state.signedIn = false;
    },
  },
});

export const { enterDemo, signOut } = authSlice.actions;
export default authSlice.reducer;
