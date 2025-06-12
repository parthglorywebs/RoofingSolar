import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import SectionTitle from './SectionTitle';

const EstimateDetailsSection = () => (
  <View>
    <SectionTitle title="Estimate Type" />
    <Text style={styles.input}>Inspection / Replacement Estimate</Text>

    <SectionTitle title="Estimate Date" />
    <Text style={styles.input}>03/26/2025</Text>
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

export default EstimateDetailsSection;
