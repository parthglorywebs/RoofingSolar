import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoginState(state, action) {
      state.user = action.payload.user;
      state.isLoggedIn = action.payload.isLoggedIn;
    },
    logout(state) {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setLoginState, logout } = authSlice.actions;
export default authSlice.reducer;
