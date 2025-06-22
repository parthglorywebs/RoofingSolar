import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DrawerButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
      <Image
        source={require('../assets/images/drawer.png')} // Adjust the path if needed
        style={styles.drawerIcon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  drawerIcon: {
    width: 33,
    height: 25,
    right: 15,
  },
});

export default DrawerButton;
