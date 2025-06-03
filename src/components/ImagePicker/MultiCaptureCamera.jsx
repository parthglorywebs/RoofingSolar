import React, {useRef, useState, forwardRef, useImperativeHandle} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {launchCamera} from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PhotoGalleryModal from './PhotoGalleryModal';

const MultiCaptureCamera = forwardRef(({maxPhoto = 5, onCaptureDone}, ref) => {
  const cameraRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photo');
  const [flashMode, setFlashMode] = useState('auto');
  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [zoom, setZoom] = useState(1);

  const maxZoom = 4;
  const minZoom = 1;
  const zoomStep = 0.1;

  useImperativeHandle(ref, () => ({
    openCamera,
  }));

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }
    setPhotos([]);
    setActiveTab('photo');
    setIsCameraOpen(true);
  };

  const handleVideoRecord = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    launchCamera(
      {
        mediaType: 'video',
        videoQuality: 'high',
        durationLimit: 60,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          //   const videoUri = response.assets[0].uri;
          onCaptureDone(response.assets);
        }
      },
    );
  };

  const takePicture = async () => {
    if (photos.length >= maxPhoto) {
      Alert.alert(
        'Limit Reached',
        `You can only take up to ${maxPhoto} photos.`,
      );
      return;
    }

    if (cameraRef.current) {
      const response = await cameraRef.current.capture();

      const extToMime = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        // add more as needed
      };

      const filePath = response.uri;
      const extension = filePath.split('.').pop().toLowerCase();
      const mimeType = extToMime[extension] || 'application/octet-stream';

      const file = {
        ...response,
        fileName: response.name,
        type: mimeType,
      };
      setPhotos(prev => [...prev, file]);
    }
  };

  const handleDone = () => {
    setIsCameraOpen(false);
    onCaptureDone(photos);
  };

  const toggleFlash = () => {
    setFlashMode(prev => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  };

  const toggleCameraType = () => {
    setCameraType(prev =>
      prev === CameraType.Back ? CameraType.Front : CameraType.Back,
    );
  };

  const getFlashIcon = () => {
    if (flashMode === 'on') return 'flash-on';
    if (flashMode === 'off') return 'flash-off';
    return 'flash-auto';
  };

  const increaseZoom = () => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const decreaseZoom = () => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  };

  return (
    <Modal visible={isCameraOpen} animationType="slide">
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setIsCameraOpen(false)}>
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={toggleFlash} style={styles.topBarIcon}>
              <MaterialIcons name={getFlashIcon()} size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleCameraType}
              style={styles.topBarIcon}>
              <MaterialIcons name="flip-camera-ios" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera Preview */}
        <Camera
          ref={cameraRef}
          style={styles.camera}
          cameraType={cameraType}
          flashMode={flashMode}
          zoom={zoom}
          maxZoom={maxZoom}
          onZoom={e => {
            const newZoom = parseFloat(e.nativeEvent.zoom.toFixed(2));
            setZoom(newZoom);
          }}
        />

        {/* Zoom Label */}
        <View style={styles.zoomLabelContainer}>
          <Text style={styles.zoomLabel}>{zoom.toFixed(1)}x</Text>
        </View>

        {/* Zoom Buttons */}
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={decreaseZoom} style={styles.zoomButton}>
            <MaterialIcons name="remove" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={increaseZoom} style={styles.zoomButton}>
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <PhotoGalleryModal
            showGalleryButton={true}
            photos={photos}
            onRemovePhoto={index => {
              setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
            }}
          />

          <TouchableOpacity onPress={takePicture} style={styles.shutterButton}>
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Tabs */}
        <View style={styles.bottomTabs}>
          <TouchableOpacity onPress={() => setActiveTab('photo')}>
            <Text
              style={[
                styles.tabItem,
                activeTab === 'photo' && styles.activeTab,
              ]}>
              PHOTO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsCameraOpen(false);
              setActiveTab('video');
              handleVideoRecord();
            }}>
            <Text
              style={[
                styles.tabItem,
                activeTab === 'video' && styles.activeTab,
              ]}>
              VIDEO
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default MultiCaptureCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
  },
  topBarIcon: {
    marginLeft: 16,
  },

  camera: {
    flex: 1,
    marginTop: 50,
  },
  zoomLabelContainer: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: '#00000088',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  galleryButton: {
    padding: 10,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shutterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#00b894',
    borderRadius: 8,
  },
  doneText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomTabs: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItem: {
    color: 'gray',
    fontSize: 14,
  },
  activeTab: {
    color: 'white',
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 200,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#00000088',
    borderRadius: 8,
    padding: 6,
  },
  zoomButton: {
    padding: 8,
  },
});
