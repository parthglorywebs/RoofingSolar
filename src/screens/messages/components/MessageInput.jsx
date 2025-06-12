import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';
import MediaPickerModal from './MediaPickerModal';

export default function MessageInput({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  replyingTo,
  onCancelReply,
  inputRef,
  onCamera,
  onGallery,
  onVideo,
}) {
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);

  const openMediaOptions = () => setIsMediaModalVisible(true);
  const closeMediaOptions = () => setIsMediaModalVisible(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return true;
    }
  };

  const handleCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    launchCamera({mediaType: 'photo', saveToPhotos: true}, response => {
      if (response.didCancel || response.errorCode) return;
      closeMediaOptions();
      onCamera?.(response.assets?.[0]);
      console.log('Camera photo:', response.assets?.[0]?.uri);
    });
  };

  const handleGallery = async () => {
    // const hasPermission = await requestPhotoLibraryPermission();
    // if (!hasPermission) return;

    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel || response.errorCode) return;
      closeMediaOptions();
      onGallery?.(response.assets?.[0]);
      console.log('Gallery photo:', response.assets?.[0]?.uri);
    });
  };

  const handleVideo = async () => {
    // const hasPermission = await requestVideoPermission();
    // if (!hasPermission) return;

    launchImageLibrary({mediaType: 'video'}, response => {
      if (response.didCancel || response.errorCode) return;
      closeMediaOptions();
      onVideo?.(response.assets?.[0]);
      console.log('Video selected:', response.assets?.[0]?.uri);
    });
  };

  return (
    <View style={styles.container}>
      {replyingTo && (
        <View style={styles.replyingToContainer}>
          <View style={styles.replyingToContent}>
            <Text style={styles.replyingToText}>
              Replying to{' '}
              <Text style={styles.replyingToName}>
                {replyingTo.contractor_name ||
                  replyingTo.name ||
                  'Unknown User'}
              </Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelButton}>
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={Colors.themePlaceHolder}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={replyingTo ? 'Write a reply...' : 'Type a message...'}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
        />

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={openMediaOptions}
            style={styles.iconButton}>
            <MaterialCommunityIcons
              name="paperclip"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {isSubmitting ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={styles.iconButton}
            />
          ) : (
            <TouchableOpacity onPress={onSubmit} style={styles.sendButton}>
              <MaterialCommunityIcons
                name="send"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Media Modal */}
      <MediaPickerModal
        visible={isMediaModalVisible}
        onClose={closeMediaOptions}
        onCamera={handleCamera}
        onGallery={handleGallery}
        onVideo={handleVideo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#e0e0e0',
  },
  replyingToContent: {flex: 1},
  replyingToText: {fontSize: 13, color: Colors.themePlaceHolder},
  replyingToName: {fontWeight: 'bold', color: Colors.primary},
  cancelButton: {padding: 4},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    color: Colors.themeBlack,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 8,
    marginLeft: 6,
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
});
