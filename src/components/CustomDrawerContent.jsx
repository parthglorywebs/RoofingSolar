import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {logout} from '../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Styling from '../assets/styling/colors';
import config from '../config/config';

const CustomDrawerContent = ({state, navigation}) => {
  const dispatch = useDispatch();

  const handleClearLogout = async () => {
    Alert.alert(
      'Are you sure you want to logout?',
      '',
      [
        {
          text: 'No',
          onPress: () => {
            // console.log('Logout cancelled');
            // navigation.closeDrawer(); 
          },
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              const contractor_id = await AsyncStorage.getItem('contractor_id');
              const response = await axios.post(
                `${config.baseUrl}logout`,
                {contractor_id},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              if (response.data.success) {
                await AsyncStorage.clear();
                dispatch(logout());
                navigation.navigate('SignIn');
              } else {
                Alert.alert('Error', 'An error occurred while logging out.');
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'An error occurred while logging out.');
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <ScrollView>
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          if (['PropertyInfo', 'PropertyTabs', 'SignIn'].includes(route.name)) {
            return null;
          }
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[
                styles.menuItem,
                {backgroundColor: focused ? '#f0f0f0' : 'white'},
              ]}>
              <Text style={{color: focused ? '#007bff' : 'black'}}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={handleClearLogout}
        style={styles.logoutButton}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  menuItem: {
    padding: 16,
  },
  logoutButton: {
    margin: 16,
    padding: 12,
    backgroundColor: Styling.white,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Styling.primary,
    alignItems: 'center',
  },
  logoutText: {
    color: Styling.primary,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
