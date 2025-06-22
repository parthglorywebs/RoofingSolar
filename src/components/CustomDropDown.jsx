import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

const CustomDropdown = ({ data, selectedValue, onValueChange, placeholder, error }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (value) => {
    onValueChange(value);
    setIsDropdownOpen(false);
  };

  return (
    <View style={[styles.dropdownContainer, error && styles.errorInput]}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
        <Text style={styles.dropdownHeaderText}>
          {selectedValue ? data.find((item) => item.value === selectedValue)?.label : placeholder}
        </Text>
      </TouchableOpacity>

      {isDropdownOpen && (
        <View style={styles.dropdownBody}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView style={styles.dropdownList}>
            {filteredData.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                onPress={() => handleSelectItem(item.value)}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: 'red',
  },
  dropdownHeader: {
    padding: 10,
  },
  dropdownHeaderText: {
    color: '#333',
  },
  dropdownBody: {
    maxHeight: 150,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dropdownList: {
    maxHeight: 110,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    color: '#333',
  },
});

export default CustomDropdown;
