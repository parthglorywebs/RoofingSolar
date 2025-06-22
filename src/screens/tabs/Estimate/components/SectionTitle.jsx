import React from 'react';
import {Text, StyleSheet} from 'react-native';

const SectionTitle = ({title}) => <Text style={styles.title}>{title}</Text>;

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
    color: '#333',
  },
});

export default SectionTitle;
