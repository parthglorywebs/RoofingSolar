import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';

export default function CommentsHeader({
  count,
  onBack,
  onSearch,
  onFilter,
  onMore,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={Colors.themeBlack}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Comments ({count})</Text>
      </View>

      <View style={styles.rightSection}>
        {onSearch && (
          <TouchableOpacity onPress={onSearch} style={styles.actionButton}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={Colors.themeBlack}
            />
          </TouchableOpacity>
        )}

        {onFilter && (
          <TouchableOpacity onPress={onFilter} style={styles.actionButton}>
            <MaterialCommunityIcons
              name="filter"
              size={20}
              color={Colors.themeBlack}
            />
          </TouchableOpacity>
        )}

        {onMore && (
          <TouchableOpacity onPress={onMore} style={styles.actionButton}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={20}
              color={Colors.themeBlack}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.themeBlack,
  },
  rightSection: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});
