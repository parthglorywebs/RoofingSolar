import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: config.baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.access_token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
    
  }),
    
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: 'login',
        method: 'POST',
        body: data,
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data?.data?.access_token) {
            const token = data.data.access_token;
            console.log('Login successful. Token:', token);

            await AsyncStorage.setItem('access_token', token);
            dispatch({
              type: 'auth/setLoginState',
              payload: {
                user: data.data,
                isLoggedIn: true,
                access_token: token,
              },
            });
          } else {
            console.error('No access token in response');
          }
        } catch (error) {
          if (error?.error?.status === 401) {
            console.error('Invalid email or password');
            // Optionally, show an alert or message in the UI
            // Alert.alert('Error', 'Invalid email or password.');
          } else {
            console.error('Error during login:', error);
          }
        }
      },
    }),

    
    getContractorProfile: builder.query({
      query: () => ({
        url: 'contractor/get-profile',
        method: 'POST',
        body: { contractor_id: 5 },  
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data?.success && data?.data) {
            dispatch({
              type: 'profile/setProfile', 
              payload: data.data,
            });

            // console.log('Contractor profile data:', data.data);
          } else {
            console.error('Failed to fetch contractor data');
          }
        } catch (error) {
          console.error('Error fetching contractor data:', error);
        }
      },
    }),
    // You can add more endpoints as needed...

    createProject: builder.mutation({
      query: (projectData) => ({
        url: 'contractor/create-project', // Assuming this is the correct endpoint for creating a project
        method: 'POST',
        body: projectData,
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data?.success) {
            console.log('Project created successfully:', data);
          } else {
            console.error('Failed to create project');
          }
        } catch (error) {
          console.error('Error creating project:', error);
        }
      },
    }),
    
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: 'forgot-password',
        method: 'POST',
        body: { email }, // Send email as the body
      }),
      onQueryStarted: async (email, { queryFulfilled, dispatch }) => {
        try {
          const { data } = await queryFulfilled;
          // console.log('Forgot Password Response:', data);
    
          if (data?.success) {
            // console.log(data.message);
          } else {
            // console.error('Error:', data?.message);
          }
        } catch (error) {
          if (error?.data?.errors?.email) {
            console.error('Invalid email:', error.data.errors.email.join(', '));
          } else if (error.error?.status === 404) {
            console.error('Endpoint not found:', error.error?.data);
          } else if (error.error?.status >= 500) {
            console.error('Server error:', error.error?.data);
          } else {
            console.error('Error during forgot password request:', error.error?.data);
          }
        }
      },
    }),

    getCurrentPipeline: builder.query({
      query: (contractorId) => ({
        url: 'contractor/current-pipeline',
        method: 'POST',
        body: { contractor_id: contractorId },
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            dispatch({
              type: 'pipeline/setPipelineData',
              payload: data.data,
            });
          } else {
            console.error('Failed to fetch pipeline data');
          }
        } catch (error) {
          console.error('Error fetching pipeline data:', error);
        }
      },
    }),
  }),
});

export const { useLoginMutation, useGetUserDataQuery, useGetCurrentPipelineQuery, useGetContractorProfileQuery, useForgotPasswordMutation, useCreateProjectMutation } = apiSlice;
