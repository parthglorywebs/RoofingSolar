import React from 'react';
import {View, Text, TouchableOpacity, Switch, StyleSheet} from 'react-native';

const Sidebar = ({sections, toggleSection}) => {
  return (
    <View style={styles.sidebar}>
      {Object.keys(sections).map((key, index) => (
        <View key={key} style={styles.item}>
          <Text style={styles.index}>{index + 1}</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => toggleSection(key)}>
            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1')}</Text>
            <Switch
              value={sections[key]}
              onValueChange={() => toggleSection(key)}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 140,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  index: {color: '#007aff', fontWeight: 'bold', marginRight: 4},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  label: {fontSize: 13, flex: 1, color: '#333'},
});

export default Sidebar;
