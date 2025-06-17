import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import PhotoEditor from '@baronha/react-native-photo-editor';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getLoginDetails} from '../../utils/AsyncStorage';
import Video from 'react-native-video';
import axios from 'axios';
import config from '../../config/config';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';
import {Buffer} from 'buffer';
import {uploadMultipleFiles, uploadSingleFile} from '../../utils/common';
import ImagePreviewer from './ImagePreviewer';
global.Buffer = global.Buffer || Buffer;

const ImageVideoEditor = ({
  media_url,
  mediaList,
  selectedJob,
  media_type,
  media,
  handleSetAsCoverPhoto,
  onDelete,
  onRefresh,
  children,
}) => {
  const {
    created_by_name: authorName = 'Unknown Author',
    authorInitials = 'UA',
    timestamp = '',
    description = '',
    notes,
  } = media;

  const [previewVisible, setPreviewVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [note, setNote] = useState(notes || '');
  const [videoVisible, setVideoVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNote(notes);
  }, [notes]);

  const openEditor = () => {
    setPreviewVisible(true);
  };

  const getFileExtension = filename => {
    return filename?.split('.')?.pop()?.toLowerCase();
  };

  const storeMetadata = async ({project_id, uuid, media_variants}) => {
    try {
      setLoading(true);
      const mediaVariants = media_variants;
      const requestPayload = {
        media_id: media.id,
        images: mediaVariants.map(variant => ({
          type: variant.key,
          url: `${variant.filename}`,
        })),
      };
      const {access_token} = await getLoginDetails();

      const response = await axios.post(
        `${config.baseUrl}contractor/update-image-variants`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      const sources = response.data;
      if (sources?.message) {
        setLoading(false);
        Alert.alert(
          'Uploaded Sccess!',
          'Your File has been updated successfully!',
        );
      }
      onRefresh?.();
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      console.log(granted);

      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    }
    return true;
  };

  const launchPhotoEditor = async () => {
    try {
      const checkPermission = await requestPermission();
      if (!checkPermission) {
        Alert.alert(
          'Permission Denied',
          'Uploading File Permission has denied!',
        );
        return false;
      }
      setPreviewVisible(false);
      setLoading(true);

      const editedPath = await PhotoEditor.open({
        path: media.url,
        stickers: [],
        hiddenControls: ['sticker', 'share'],
      });
      const path = editedPath.replace('file://', '');
      const fileInfo = await RNFS.stat(path);
      const filepath = fileInfo.path;
      const filename = filepath?.split('/')?.pop();
      const extension = getFileExtension(filename);

      const mimeTypes = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
      };

      const fileType = mimeTypes[extension] || 'jpeg';

      const file = {
        uri: `${editedPath}`,
        fileName: filename,
        type: fileType || 'image/jpeg',
      };

      await uploadMultipleFiles({
        files: [file],
        selectedJobId: selectedJob.id,
        onProgressUpdate: progress => console.log('progress', progress),
        onFileChange: name => console.log('file name', name),
        onUploadError: () => setPreviewVisible(true),
        onStoreMetaData: storeMetadata,
      });
    } catch (err) {
      setPreviewVisible(true);
      setLoading(false);
      // Alert.alert('Error', 'Failed to edit/upload image.');
    }
  };

  const handleDeleteImage = () => {
    setMoreMenuVisible(false);
    Alert.alert('Delete Media', 'Are you sure you want to delete this media?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMedia(media.id);
        },
      },
    ]);
    // Add your logic here
  };

  const deleteMedia = useCallback(
    async mediaId => {
      try {
        const {access_token, contractor_id} = await getLoginDetails();
        const response = await axios.post(
          `${config.baseUrl}contractor/delete-photos-videos`,
          {
            contractor_id: contractor_id,
            project_id: selectedJob.id,
            media_id: mediaId,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        if (response.data.status === 200) {
          onDelete?.(mediaId);
        } else {
          Alert.alert('Failed', 'Failed to delete media');
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        Alert.alert('Error', 'Failed to delete media.');
      } finally {
      }
    },
    [selectedJob],
  );

  const handleSaveNote = async () => {
    try {
      const {access_token, contractor_id} = await getLoginDetails();
      const formData = new FormData();
      formData.append('contractor_id', contractor_id);
      formData.append('project_id', selectedJob.id);
      formData.append('media_id', media.id);
      formData.append('note', note);
      const response = await axios.post(
        `${config.baseUrl}contractor/add-notes-photos-videos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      if (response.data.status === 200) {
        Alert.alert('Success', 'Notes saved successfully!');
        setNoteModalVisible(false);
        return true;
      }
      setNoteModalVisible(false);
      setNote(notes);
    } catch (error) {
      setNoteModalVisible(false);
      setNote(notes);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={openEditor} activeOpacity={0.2}>
        {children ?? <Text style={styles.buttonText}>Edit {media_type}</Text>}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      {/* Main Image Preview Modal */}
      <Modal visible={previewVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={[styles.header]}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{authorName}</Text>
            {media_type === 'image' ? (
              <TouchableOpacity onPress={launchPhotoEditor}>
                <Icon name="pencil" size={28} color="#fff" />
              </TouchableOpacity>
            ) : (
              <Text />
            )}
          </View>
          {media_type === 'video' ? (
            <View style={styles.videoModal}>
              <TouchableOpacity
                style={styles.closeFullscreen}
                onPress={() => setVideoVisible(false)}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Video
                source={{uri: media_url}}
                style={styles.fullscreenVideo}
                controls
                resizeMode="contain"
              />
            </View>
          ) : (
            <>
              {/* Image */}
              <ImagePreviewer
                mediaUrls={mediaList
                  .filter(m => m.media_type === 'image')
                  .map(m => m.url)}
                mediaUrl={media_url}
                initialIndex={mediaList.findIndex(m => m.id === media.id)}
                setPreviewVisible={setPreviewVisible}
              />
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authorInitials}</Text>
              </View>
              <View style={{flex: 1, marginLeft: 8}}>
                <Text style={styles.author}>{authorName}</Text>
                <Text style={styles.timestamp}>{timestamp}</Text>
              </View>
              <TouchableOpacity onPress={() => setFullscreenVisible(true)}>
                <Icon name="fullscreen" size={20} color="#00ffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.descriptionRow}>
              <Icon name="note-text-outline" size={20} color="#aaa" />
              <Text style={styles.description}>{note || ''}</Text>
            </View>

            <View style={styles.iconRow}>
              {/* <TouchableOpacity style={styles.iconCircle}>
                <Icon name="message-outline" size={22} color="#fff" />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setNoteModalVisible(true)}>
                <Icon name="tag-outline" size={22} color="#fff" />
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.iconCircle}>
                <Icon name="signature-freehand" size={22} color="#fff" />
              </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.iconCircle}>
                <Icon name="check-circle-outline" size={22} color="#fff" />
              </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.iconCircle}>
                <Icon name="map-outline" size={22} color="#fff" />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setMoreMenuVisible(true)}>
                <Icon name="dots-horizontal" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* More Menu Modal */}
          <Modal
            visible={moreMenuVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setMoreMenuVisible(false)}>
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPressOut={() => setMoreMenuVisible(false)}>
              <View style={styles.moreMenu}>
                <TouchableOpacity
                  onPress={() => handleSetAsCoverPhoto(media.id)}
                  style={styles.menuItem}>
                  <Icon name="image" size={20} color="#000" />
                  <Text style={styles.menuItemText}>Set as Cover Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteImage}
                  style={styles.menuItem}>
                  <Icon name="delete-outline" size={20} color="red" />
                  <Text style={[styles.menuItemText, {color: 'red'}]}>
                    Delete Image
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Fullscreen Modal */}
          <Modal
            visible={fullscreenVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setFullscreenVisible(false)}>
            <View style={styles.fullscreenModal}>
              <TouchableOpacity
                style={styles.closeFullscreen}
                onPress={() => setFullscreenVisible(false)}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
              {media_type === 'video' ? (
                <View style={styles.videoModal}>
                  <TouchableOpacity
                    style={styles.closeFullscreen}
                    onPress={() => setVideoVisible(false)}>
                    <Icon name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Video
                    source={{uri: media_url}}
                    style={styles.fullscreenVideo}
                    controls
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <>
                  {/* Image */}
                  <Image
                    source={{uri: media_url}}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </>
              )}
            </View>
          </Modal>

          <Modal
            visible={noteModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setNoteModalVisible(false)}>
            <View style={styles.noteModalOverlay}>
              <View style={styles.noteModal}>
                <Text style={styles.noteModalTitle}>Add Note</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write your note here..."
                  placeholderTextColor="#aaa"
                  multiline
                  value={note}
                  onChangeText={setNote}
                />
                <View style={styles.noteModalActions}>
                  <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                    <Text style={styles.noteButton}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveNote}>
                    <Text style={[styles.noteButton, {color: '#00ffff'}]}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
};

export default ImageVideoEditor;

const styles = StyleSheet.create({
  container: {alignItems: 'center'},
  button: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {color: '#fff', fontSize: 16, textAlign: 'center'},

  modalContainer: {flex: 1, backgroundColor: '#000'},
  header: {
    height: 60,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageWrapper: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  image: {width: '100%', height: '100%'},

  footer: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  author: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  timestamp: {
    color: '#ccc',
    fontSize: 12,
  },

  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  description: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 8,
  },

  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  // More menu styles
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  moreMenu: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },

  // Fullscreen modal styles
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeFullscreen: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },

  noteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  noteModal: {
    width: '85%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
  },
  noteModalTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  noteInput: {
    height: 100,
    color: '#fff',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  noteButton: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 20,
  },

  videoModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
