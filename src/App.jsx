import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {Provider} from 'react-redux';
import config from './config/config';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {store} from './redux/store/store';
import {getLoginDetails} from './utils/AsyncStorage';
import InternetConnectivityMessage from './utils/InternetConnectivityMessage';
import {useColorScheme} from 'react-native';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import {createStackNavigator} from '@react-navigation/stack';
import StackNavigator from './navigation/StackNavigation';
import Colors from './assets/styling/colors';

import SignIn from './screens/auth/SignInScreen';
import PushNotification from 'react-native-push-notification';

const Stack = createStackNavigator();

// ✅ Configure push notifications ONLY for Android
PushNotification.configure({
    onNotification: function (notification) {
      console.log('Notification:', notification);
    },
    popInitialNotification: true,
    requestPermissions: true,
  });

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [contractorName, setContractorName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
  }, []);

  const fetchContractorProfile = useCallback(async () => {
    setLoading(true);
    try {
      const {access_token, contractor_id, name} = await getLoginDetails();
      const response = await axios.post(
        `${config.baseUrl}contractor/get-profile`,
        {contractor_id},
        {headers: {Authorization: `Bearer ${access_token}`}},
      );

      const data = response.data;
      if (data.success) {
        setContractorName(data.data.name);
        const imageUrl = profileImage
          ? `${config.profileImage}${profileImage}`
          : null;
        setProfileImage(imageUrl);
      } else {
        throw new Error('Profile fetch failed');
      }
    } catch (error) {
      console.error('Error fetching contractor profile:', error);

      if (error.response?.status === 404 || error.response?.status === 401) {
        await AsyncStorage.clear();
        setIsAuthenticated(false);
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        Alert.alert('Error', 'Failed to load contractor profile');
      }

      const {name} = await getLoginDetails();
      setContractorName(name);
    } finally {
      setLoading(false);
    }
  }, [profileImage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContractorProfile();
    }
  }, [isAuthenticated, fetchContractorProfile]);

  if (isAuthenticated === null) {
    return <ActivityIndicator size="large" color={Colors.themeBlack} />;
  }

  return (
    <Provider store={store}>
      <SafeAreaView style={{flex: 1, backgroundColor: Colors.themeBlack}}>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={isAuthenticated ? 'BottomTabs' : 'SignIn'}>
              <Stack.Screen
                name="SignIn"
                component={StackNavigator}
                options={{headerShown: false}}
              />
              <Stack.Screen
                name="BottomTabs"
                component={BottomTabNavigator}
                options={{headerShown: false}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
        <InternetConnectivityMessage />
      </SafeAreaView>
    </Provider>
  );
};

export default App;
