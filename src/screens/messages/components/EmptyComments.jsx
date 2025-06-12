import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';

export default function EmptyComments() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="message-text"
        size={48}
        color={Colors.themePlaceHolder}
      />
      <Text style={styles.title}>No Comments Yet</Text>
      <Text style={styles.description}>
        Be the first to start a conversation
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.themeBlack,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.themePlaceHolder,
    textAlign: 'center',
  },
});
