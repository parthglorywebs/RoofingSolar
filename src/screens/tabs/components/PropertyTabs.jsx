import React from 'react';
import {Text} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import GeneralInfo from './GeneralInfo';
import Documents from './Documents';
import DesignerStudio from './DesignerStudio';
import ContractorPortal from './ContractorPortal';

const Tab = createMaterialTopTabNavigator();

function PropertyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarLabel: ({focused}) => (
          <Text
            style={{
              fontSize: focused ? 14 : 10,
              fontWeight: focused ? 'bold' : 'normal',
              color: focused ? '#007bff' : '#6c757d',
            }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#f8f9fa',
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#007bff',
          height: 3,
        },
      })}>
      <Tab.Screen name="General Info" component={GeneralInfo} />
      <Tab.Screen name="Designer Studio" component={DesignerStudio} />
      <Tab.Screen name="Documents" component={Documents} />
      <Tab.Screen name="Contractor Portal" component={ContractorPortal} />
    </Tab.Navigator>
  );
}

export default PropertyTabs;



// import React from 'react';
// import { Text } from 'react-native';
// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import GeneralInfo from './GeneralInfo';
// import Documents from './Documents';
// import DesignerStudio from './DesignerStudio';
// import ContractorPortal from './ContractorPortal';
// import Overview from './Overview';
// import Messages from './Messages';
// import PhotosAndVideos from './PhotosAndVideos';
// import Worksheet from './Worksheet';
// import Payments from './Payments';

// const Tab = createMaterialTopTabNavigator();

// function PropertyTabs({ role }) {
//   // Define the tabs for each role
//   const customerTabs = [
//     { name: 'General Info', component: GeneralInfo },
//     { name: 'Designer Studio', component: DesignerStudio },
//     { name: 'Documents', component: Documents },
//     { name: 'Contractor Portal', component: ContractorPortal },
//   ];

//   const contractorTabs = [
//     { name: 'Overview', component: Overview },
//     { name: 'Messages', component: Messages },
//     { name: 'Documents', component: Documents },
//     { name: 'Photos & Videos', component: PhotosAndVideos },
//     { name: 'Worksheet', component: Worksheet },
//     { name: 'Payments', component: Payments },
//   ];

//   // Set the tabs based on the user role
//   const tabs = role === 'Customer' ? customerTabs : contractorTabs;

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarLabel: ({ focused }) => (
//           <Text
//             style={{
//               fontSize: focused ? 12 : 11,
//               fontWeight: focused ? 'bold' : 'normal',
//               color: focused ? '#007bff' : '#6c757d',
//             }}>
//             {route.name}
//           </Text>
//         ),
//         tabBarStyle: {
//           backgroundColor: '#f8f9fa',
//         },
//         tabBarIndicatorStyle: {
//           backgroundColor: '#007bff',
//           height: 3,
//         },
//       })}>
//       {tabs.map((tab) => (
//         <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
//       ))}
//     </Tab.Navigator>
//   );
// }

// export default PropertyTabs;

