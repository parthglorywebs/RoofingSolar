import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Styling from '../../src/assets/styling/colors';

const CustomSafeAreaView = ({ children, style }) => {
  return <SafeAreaView style={[styles.safeArea, style]}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Styling.white, 
  },
});

export default CustomSafeAreaView;
