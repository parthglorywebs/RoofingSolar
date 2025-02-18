import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DesignerStudio = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Designer Studio</Text>
  </View>
);

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

export default DesignerStudio;
