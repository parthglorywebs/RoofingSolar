import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../config/config';
import { logout } from '../redux/slices/authSlice';

import Dashboard from '../screens/propertyDashboard/Dashboard';
import PropertyInfo from '../screens/propertyInfo/PropertyInfo';
import Messages from '../screens/messages/MessageScreen';
import PhotosVideoScreen from '../screens/photosvideos/PhotosVideoScreen';
import DocumentsTabs from '../screens/tabs/Documents/DocumentsTabs';
import CustomProfile from '../screens/auth/Profile';
import Styling from '../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawerButton from '../components/CustomDrawerButton';


const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ state, navigation, contractorName, profileImage }) => {
  const dispatch = useDispatch();

 

  
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const contractor_id = await AsyncStorage.getItem('contractor_id');

      const response = await axios.post(
        `${config.baseUrl}logout`,
        { contractor_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await AsyncStorage.clear();
        dispatch(logout());
        navigation.navigate('SignIn');
      } else {
        Alert.alert('Error', 'An error occurred while logging out.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, alignItems: 'center' }}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }}
          />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={60} color={Styling.primary} />
        )}
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{contractorName}</Text>
      </View>
      {state.routes.map((route, index) => (
        <TouchableOpacity
          key={route.key}
          onPress={() => navigation.navigate(route.name)}
          style={{
            padding: 16,
            backgroundColor: index === state.index ? '#f0f0f0' : 'white',
          }}>
          <Text style={{ color: index === state.index ? '#007bff' : 'black' }}>{route.name}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          margin: 16,
          padding: 12,
          backgroundColor: Styling.white,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: Styling.primary,
          alignItems: 'center',
        }}>
        <Text style={{ color: Styling.primary, fontWeight: 'bold' }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = ({ contractorName, profileImage }) => (
  <Drawer.Navigator
    initialRouteName="Dashboard"
    drawerContent={(props) => (
      <CustomDrawerContent
        {...props}
        contractorName={contractorName}
        profileImage={profileImage}
      />
    )}
    screenOptions={({navigation}) => ({
      drawerPosition: 'right',
      headerTitleAlign: 'center',
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {profileImage ? (
              <Image
                source={{uri: profileImage}}
                style={{width: 30, height: 30, borderRadius: 15, marginRight: 8}}
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle"
                size={30}
                color={Styling.primary}
                style={{marginRight: 8}}
              />
            )}
            <Text style={{fontSize: 16, fontWeight: 'bold'}}>
              Hello, {contractorName ? contractorName : 'User'}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      headerRight: () => <DrawerButton />,
      headerLeft: () => null,
    })}>
    <Drawer.Screen name="Dashboard" component={Dashboard} />
    <Drawer.Screen name="PropertyInfo" component={PropertyInfo} initialParams={{ property: {} }} />
    <Drawer.Screen name="Messages" component={Messages} />
    <Drawer.Screen name="Photos & Videos" component={PhotosVideoScreen} />
    <Drawer.Screen name="Documents" component={DocumentsTabs} />
    <Drawer.Screen name="Profile" component={CustomProfile} />
  </Drawer.Navigator>
);

export default DrawerNavigator;