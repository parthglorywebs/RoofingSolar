import React, {useRef} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import MultiCaptureCamera from './MultiCaptureCamera';

const ImageSelector = ({onImagesSelected, children}) => {
  const cameraComponentRef = useRef();

  const handleSelectSource = () => {
    Alert.alert('Choose source', 'Select images from:', [
      {text: 'Camera', onPress: () => pickImages('camera')},
      {text: 'Gallery', onPress: () => pickImages('gallery')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  const pickImages = async source => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: true,
        selectionLimit: 0, // 0 = unlimited
      };
      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert('Camera permission denied');
          return false;
        }
        handleOpenCamera();
        return true;
      }

      const response =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (
        response.didCancel ||
        response.errorCode ||
        !response.assets?.length
      ) {
        Alert.alert('No image selected');
        return;
      }

      const uris = response.assets
        .map(asset => asset.uri)
        .filter(Boolean)
        .map(uri =>
          Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        );

      onImagesSelected(response.assets);
    } catch (error) {
      console.error('❌ Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleOpenCamera = () => {
    cameraComponentRef.current?.openCamera();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleSelectSource}>
        {children ?? <Text style={styles.buttonText}>Select Images</Text>}
      </TouchableOpacity>
      <MultiCaptureCamera
        ref={cameraComponentRef}
        maxPhoto={30}
        onCaptureDone={onImagesSelected}
      />
    </View>
  );
};

export default ImageSelector;

const styles = StyleSheet.create({
  container: {marginVertical: 20, alignItems: 'center'},
  button: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {color: '#fff', fontSize: 16},
});
