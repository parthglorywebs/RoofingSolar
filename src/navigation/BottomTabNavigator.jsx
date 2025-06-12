import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Alert, Image} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useColorScheme, Text, TouchableOpacity} from 'react-native';
import Colors from '../assets/styling/colors';
import DashboardScreen from '../screens/propertyDashboard/DashboardScreen';
import LeadsStack from '../screens/leads/LeadScreen';
import Messages from '../screens/messages/MessageScreen';
import Reports from '../screens/reports/Reports';
import Profile from '../screens/auth/Profile';
import {useNavigation} from '@react-navigation/native';
import PropertyInfo from '../screens/propertyInfo/LeadDetailInfo';
import axios from 'axios';
import {clearLoginDetails, getLoginDetails} from '../utils/AsyncStorage';
import config from '../config/config';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Lead Screen
const LeadStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LeadsInner"
      component={LeadsStack}
      options={{
        headerShown: false,
      }}
    />
    {/* You can add more screens here inside the LeadStack if needed */}
  </Stack.Navigator>
);

const ProfileStackNavigator = () => {
  const navigation = useNavigation(); // Get navigation object

  const handleLogout = async () => {
    // Mark as async
    Alert.alert('Logout Confirmation', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          // Mark as async
          try {
            const {access_token, contractor_id, rememberMe} =
              await getLoginDetails();

            const formData = new FormData();
            formData.append('contractor_id', contractor_id);

            const response = await axios.post(
              `${config.baseUrl}logout`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            if (response.data) {
              // console.log('Logout successful:', response.data.message);
              await clearLoginDetails(rememberMe); // Pass rememberMe to clearLoginDetails
              navigation.navigate('SignIn'); // Use navigation here!
            } else {
              Alert.alert('Error', response.data.message);
            }
          } catch (error) {
            if (error.response) {
              console.error('Server Error:', error.response.data);
              Alert.alert(
                'Error',
                error.response.data.message || 'Logout failed.',
              );
            } else {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'An error occurred during logout.');
            }
          }
        },
      },
    ]);
  };

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'Profile',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.themeBlack,
          },
          headerTintColor: Colors.white,
          headerBackTitleVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{marginRight: 15}}>
              <MaterialCommunityIcons
                name="logout"
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
  );
};

const BottomTabNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          borderTopWidth: 0,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          // tabBarIcon: ({color}) => (
          //   <Image
          //     source={require('../assets/images/home.png')}
          //     style={{tintColor: color}}
          //   />
          // ),
          // tabBarLabel: 'Home',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              size={24}
              color={color}
            />
          ),
          tabBarLabel: 'Dashboard',
          headerStyle: {
            backgroundColor: Colors.themeBlack,
          },
          headerTitleAlign: 'center',
          headerLeft: null,
          headerTitle: () => (
            <Text
              style={{color: Colors.white, fontSize: 20, fontWeight: 'bold'}}>
              Dashboard
            </Text>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileStack')}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={Colors.white}
                style={{marginRight: 15}}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={24}
              color={color}
            />
          ),
          tabBarLabel: 'Leads',
          headerStyle: {
            backgroundColor: Colors.themeBlack,
          },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text style={{color: Colors.white, fontSize: 20}}>Leads</Text>
          ),
        }}
      />
      {/* <Tab.Screen
        name="Search"
        component={Messages}
        options={{
          tabBarIcon: ({color}) => (
            // <MaterialCommunityIcons name="search-web" size={24} color={color} />
            <Image
              source={require('../assets/images/search.png')}
              style={ {tintColor: color}}
            />
          ),
          tabBarLabel: 'Search',
          headerStyle: {
            backgroundColor: Colors.themeBlack,
          },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text style={{color: Colors.white, fontSize: 20}}>Search</Text>
          ),
        }}
      /> */}
      <Tab.Screen
        name="Reports"
        component={Reports}
        options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="chart-bar" size={24} color={color} />
          ),
          tabBarLabel: 'Reports',
          headerStyle: {
            backgroundColor: Colors.themeBlack,
          },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{color: Colors.white, fontSize: 20, fontWeight: 'bold'}}>
              Reports
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen
      name="MainTabs"
      component={BottomTabNavigator}
      options={{
        title: '',
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: Colors.themeBlack,
        },
        headerTintColor: Colors.white,
        headerBackTitleVisible: false,
        headerShown: false,
        headerBackTitle: false,
      }}
    />

    <Stack.Screen
      name="ProfileStack"
      component={ProfileStackNavigator}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="PropertyInfo"
      component={PropertyInfo}
      // options={{headerShown: true}}
      options={{
        title: 'Leads Info',
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: Colors.themeBlack,
        },
        headerTintColor: Colors.white,
        headerBackTitleVisible: false,
        headerShown: true,
        headerBackTitle: false,
      }}
    />
  </Stack.Navigator>
);

export default MainNavigator;
