import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DrawerButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
      <Image
        source={require('../assets/images/drawer.png')}
        style={{ width: 33, height: 25, right: 15 }}
      />
    </TouchableOpacity>
  );
};

export default DrawerButton;
