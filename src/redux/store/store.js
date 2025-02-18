import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiClient';
import authReducer from '../slices/authSlice';
import userReducer from '../slices/userSlice';
import appReducer from '../slices/appSlice';
import pipelineReducer from '../slices/pipelineSlice'; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    app: appReducer,
    pipeline: pipelineReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,  // Add the API reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),  // Add API middleware
});

export default store;
