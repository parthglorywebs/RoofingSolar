import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoadingState: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoadingState } = appSlice.actions;
export default appSlice.reducer;
