import React from 'react';
import {View, Text, Alert, StyleSheet, TouchableOpacity} from 'react-native';
import PhotoEditor from '@baronha/react-native-photo-editor';

const ImageEditor = ({imagePath}) => {
  const openEditor = async () => {
    try {
      await PhotoEditor.open({
        path: imagePath,
        stickers: [],
        hiddenControls: [],
        colors: undefined,
        onDone: () => console.log('✅ Edit complete'),
        onCancel: () => console.log('❌ Edit cancelled'),
      });
    } catch (err) {
      console.error('❌ Error opening editor:', err);
      Alert.alert('Error', 'Failed to open photo editor');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openEditor} style={styles.button}>
        <Text style={styles.buttonText}>Edit Image</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ImageEditor;

const styles = StyleSheet.create({
  container: {marginTop: 10, alignItems: 'center'},
  button: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {color: '#fff', fontSize: 16},
});
