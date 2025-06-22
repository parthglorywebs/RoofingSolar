import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import SectionTitle from './SectionTitle';

const CompanyInfoSection = () => (
  <View>
    <SectionTitle title="Company Name" />
    <Text style={styles.input}>360 Innovations Roofing Company</Text>
  </View>
);

const styles = StyleSheet.create({
  input: {
    fontSize: 14,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000',
  },
});

export default CompanyInfoSection;
