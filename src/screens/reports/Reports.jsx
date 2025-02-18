import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../../assets/styling/colors';

const Reports = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reports page under development</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.themeBlack,
  },
  text: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Reports;
