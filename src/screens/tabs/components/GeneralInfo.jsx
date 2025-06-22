import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const GeneralInfo = ({ navigation }) => {
  const handleNavigate = () => {
    // Navigate to SignIn
    navigation.navigate('SignInStack');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleNavigate}>
        <Text style={styles.text}>General Info Content (Click to go to SignIn)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GeneralInfo;
