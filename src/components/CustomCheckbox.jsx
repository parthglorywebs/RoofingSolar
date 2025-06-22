import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import Colors from '../assets/styling/colors';


const CustomCheckbox = ({ checked, onChange, label }) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={() => onChange(!checked)}>
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <Icon name="check" size={12} color="white" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: Colors.primary, // When checked, set background to primary color
    borderColor: Colors.primary, // Ensure the border color stays primary
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: Colors.themeBlack,
  },
});

export default CustomCheckbox;
