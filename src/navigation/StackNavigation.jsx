import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignIn from '../screens/auth/SignInScreen';
import ForgotPassword from '../screens/auth/ForgotPassword';
import ResetPassword from '../screens/auth/ResetPassword';
import Register from '../screens/auth/Register';
import { Image } from 'react-native';
import Profile from '../screens/auth/Profile';

const Stack = createStackNavigator();

const stackScreenOptions = {
  headerBackImage: () => (
    <Image
      source={require('../assets/images/back.png')}
      style={{ width: 8, height: 15, marginHorizontal: 15 }}
    />
  ),
  headerStyle: {
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerShadowVisible: false,
};

const StackNavigator = () => (
  <Stack.Navigator initialRouteName="SignInScreen">
    <Stack.Screen
      name="SignInScreen"
      component={SignIn}
      options={{
        title: '',
        ...stackScreenOptions,
        headerLeft: null
      }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPassword}
      options={{
        title: 'Forgot Password',
        headerBackTitle: null,
        ...stackScreenOptions,
      }}
    />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPassword}
      options={{
        title: 'Reset Password',
        headerBackTitle: null,
        ...stackScreenOptions,
      }}
    />
    <Stack.Screen
      name="Register"
      component={Register}
      options={{
        title: 'Register',
        ...stackScreenOptions,
      }}
    />

  <Stack.Screen
      name="Profile"
      component={Profile}
      options={{
        title: 'Profile',
        ...stackScreenOptions,
      }}
    />
  </Stack.Navigator>
);

export default StackNavigator;
