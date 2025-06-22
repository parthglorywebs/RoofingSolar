import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  SectionList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import ImagePreviewer from '../../components/ImagePicker/ImagePreviewer';
import {Avatar} from 'react-native-paper';
import axios from 'axios';
import PhotoEditor from '@baronha/react-native-photo-editor';
import {getLoginDetails} from '../../utils/AsyncStorage';
import config from '../../config/config';
import {uploadMultipleFiles} from '../../utils/common';
import RNFS from 'react-native-fs';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

const {width} = Dimensions.get('window');
const ITEM_SIZE = width / 3 - 20;

function groupMediaByDate(mediaList, chunkSize = 4) {
  const formatDate = date =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const groups = new Map();

  for (const item of mediaList) {
    const dateObj = new Date(item.createdAt);
    const dateKey = formatDate(dateObj);

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey).push(item);
  }

  const sortedGroups = [...groups.entries()].sort(
    ([dateA], [dateB]) => new Date(dateB) - new Date(dateA),
  );

  return sortedGroups.map(([title, items]) => ({
    title,
    data: chunkArray(items, chunkSize),
  }));
}

const MediaGallery = ({
  mediaList,
  onLoadMore,
  isLoadingMore,
  isLoading,
  totalPages,
  currentPage,
  selectedJob,
  handleSetAsCoverPhoto,
  onDelete,
  onRefresh,
  onUpdate,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatMediaList, setFlatMediaList] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [media, setMedia] = useState(null);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [note, setNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const sections = useMemo(() => groupMediaByDate(mediaList, 4), [mediaList]);

  const handleLongPress = media => {
    setIsSelectionMode(true);
    setSelectedItems([media.id]);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh?.(1); // If onRefresh is passed as prop
    } finally {
      setRefreshing(false);
    }
  };

  const handlePress = media => {
    if (isSelectionMode) {
      if (selectedItems.includes(media.id)) {
        const newSelected = selectedItems.filter(id => id !== media.id);
        setSelectedItems(newSelected);
        if (newSelected.length === 0) setIsSelectionMode(false);
      } else {
        setSelectedItems([...selectedItems, media.id]);
      }
    } else {
      const imageList = mediaList.map(item => ({url: item.url}));
      const index = mediaList.findIndex(m => m.id === media.id);

      setFlatMediaList(imageList);
      setSelectedIndex(index);
      setMedia(media);
      setNote(media?.notes);
      setPreviewVisible(true);
    }
  };

  const handleDeleteSelected = () => {
    const selectedMedia = mediaList.filter(item =>
      selectedItems.includes(item.id),
    );
    selectedMedia.forEach(item => onDelete(item));
    setSelectedItems([]);
    setIsSelectionMode(false);
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
          setPreviewVisible(false);
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

      if (response?.data?.status === 200) {
        // Create updated media object
        const updatedMediaList = mediaList.map(item =>
          item.id === media.id ? {...item, notes: note} : item,
        );

        // Find the updated media and its index
        const updatedMedia = updatedMediaList.find(m => m.id === media.id);
        const updatedIndex = mediaList.findIndex(m => m.id === media.id);

        // ✅ Call onUpdate with index and payload
        if (updatedIndex !== -1 && updatedMedia) {
          onUpdate(updatedIndex, {notes: note});
        }

        // Update modal and local state
        setMedia(updatedMedia);
        setNote(updatedMedia?.notes);
        setNoteModalVisible(false);
        Alert.alert('Success', 'Notes saved successfully!');
        return true;
      }

      setNoteModalVisible(false);
      setNote(media?.notes);
    } catch (error) {
      setNoteModalVisible(false);
      setNote(media?.notes);
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.row}>
      {item.map(media => {
        const avatarLabel = media?.created_by_name
          ? media.created_by_name.charAt(0).toUpperCase()
          : 'N';
        const isSelected = selectedItems.includes(media.id);

        return (
          <TouchableOpacity
            key={media.id}
            onLongPress={() => handleLongPress(media)}
            onPress={() => handlePress(media)}
            activeOpacity={0.8}
            delayLongPress={300}>
            <View
              style={[
                styles.mediaContainer,
                isSelected && styles.selectedMedia,
              ]}>
              {media.type === 'video' ? (
                <>
                  <FastImage
                    source={{
                      uri: media.thumbnail,
                      priority: FastImage.priority.high,
                    }}
                    style={styles.media}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={styles.videoIconOverlay}>
                    <Text style={styles.videoIconText}>▶</Text>
                  </View>
                </>
              ) : (
                <FastImage
                  source={{
                    uri: media.thumbnail,
                    priority: FastImage.priority.high,
                  }}
                  style={styles.media}
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}
              <Avatar.Text
                label={avatarLabel}
                size={24}
                style={[styles.avatar, {pointerEvents: 'none'}]}
                labelStyle={{fontWeight: 'bold', fontSize: 14}}
              />
              {/* Upload Progress */}
              {uploadProgress[media.id] != null &&
                uploadProgress[media.id] < 100 && (
                  <View style={styles.progressOverlay}>
                    <AnimatedCircularProgress
                      size={40}
                      width={3}
                      fill={uploadProgress[media.id]}
                      tintColor="#00e0ff"
                      backgroundColor="#3d5875"
                      rotation={0}>
                      {fill => (
                        <Text style={styles.progressText}>
                          {Math.round(fill)}%
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSectionHeader = ({section: {title}}) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#888" />
        </View>
      );
    }

    if (currentPage < totalPages) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.loadMoreText} onPress={handleLoadMore}>
            Load More
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        <Text style={styles.allLoadedText}>All media loaded</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && currentPage < totalPages && onLoadMore) {
      onLoadMore();
    }
  };
  const requestMultiPermission = async () => {
    if (Platform.OS !== 'android') return true;

    // Check Android version
    const androidVersion = Platform.Version;

    // Filter permissions based on version
    const permissions = [
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    ];

    // Only add storage permissions if Android version < 30 (Android 11)
    if (androidVersion < 30) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
    }

    const getReadableName = key => {
      switch (key) {
        case PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS:
          return 'Post Notifications';
        case PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION:
          return 'Background Location';
        case PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE:
          return 'Write External Storage';
        case PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE:
          return 'Read External Storage';
        default:
          return key;
      }
    };

    const deniedList = [];

    for (const permission of permissions) {
      const status = await PermissionsAndroid.request(permission);
      console.log(`Permission for ${permission}:`, status);

      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        deniedList.push(getReadableName(permission));
      }
    }

    if (deniedList.length > 0) {
      Alert.alert(
        'Permission Required',
        `The following permissions are not allowed: ${deniedList.join(
          ', ',
        )}. Please allow them from Settings.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
      return false;
    }

    return true;
  };

  const storeMetadata = async ({media_variants}) => {
    try {
      console.log(media_variants, 'Update the media_variants');

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
      console.log(sources, 'FIle Uploaded Successfully!');

      if (sources?.message) {
        Alert.alert(
          'Uploaded Sccess!',
          'Your File has been updated successfully!',
        );
      }
      onRefresh?.();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const getFileExtension = filename => {
    return filename?.split('.')?.pop()?.toLowerCase();
  };

  const launchPhotoEditor = async () => {
    try {
      const checkPermission = await requestMultiPermission();
      if (!checkPermission) {
        Alert.alert(
          'Permission Denied',
          'Uploading File Permission has denied!',
        );
        return false;
      }
      setPreviewVisible(false);

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
        onProgressUpdate: progress => {
          setUploadProgress(prev => ({
            ...prev,
            [media.id]: progress,
          }));
        },
        onFileChange: name => console.log('file name', name),
        onUploadError: () => setPreviewVisible(true),
        onStoreMetaData: storeMetadata,
      });
    } catch (err) {
      setPreviewVisible(true);
      Alert.alert('Error', 'Failed to edit/upload image.');
    }
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonBox} />
      <ActivityIndicator size="large" color="#999" style={styles.loader} />
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.map(i => i.id).join('-') + index}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007bff"
            colors={['#007bff']}
          />
        }
      />

      {isSelectionMode && selectedItems.length > 0 && (
        <View style={styles.deleteBar}>
          <Text style={styles.deleteText} onPress={handleDeleteSelected}>
            Delete Selected ({selectedItems.length})
          </Text>
        </View>
      )}

      {/* Preview Modal */}
      <Modal visible={previewVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {media?.created_by_name || 'Unknown Author'}
            </Text>
            {media?.media_type === 'image' && (
              <TouchableOpacity onPress={launchPhotoEditor}>
                <Icon name="pencil" size={28} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {media?.media_type === 'video' ? (
            <Video
              source={{uri: media.url}}
              style={styles.fullscreenVideo}
              controls
              resizeMode="contain"
            />
          ) : (
            <ImagePreviewer
              mediaUrls={flatMediaList.map(m => m.url)}
              mediaUrl={media?.url}
              initialIndex={selectedIndex}
              setPreviewVisible={setPreviewVisible}
              onNext={index => {
                const selectMedia = mediaList[index];
                setMedia(selectMedia);
                setSelectedIndex(index);
                setNote(selectMedia?.notes); // Sync the note
              }}
              onPrev={index => {
                const selectMedia = mediaList[index];
                setMedia(selectMedia);
                setSelectedIndex(index);
                setNote(selectMedia?.notes); // Sync the note
              }}
            />
          )}

          <View style={styles.footer}>
            <View style={styles.footerTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {media?.authorName?.[0] || '?'}
                </Text>
              </View>
              <View style={{flex: 1, marginLeft: 8}}>
                <Text style={styles.author}>{media?.authorName}</Text>
                <Text style={styles.timestamp}>{media?.timestamp}</Text>
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
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setNoteModalVisible(true)}>
                <Icon name="tag-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setMoreMenuVisible(true)}>
                <Icon name="dots-horizontal" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            visible={moreMenuVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setMoreMenuVisible(false)}>
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPressOut={() => setMoreMenuVisible(false)}>
              <View style={styles.moreMenu}>
                <TouchableOpacity
                  onPress={() => handleSetAsCoverPhoto(media?.id)}
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

          <Modal
            visible={fullscreenVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setFullscreenVisible(false)}>
            <View style={styles.fullscreenModal}>
              <TouchableOpacity
                style={styles.closeFullscreen}
                onPress={() => setFullscreenVisible(false)}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
              {media?.media_type === 'video' ? (
                <Video
                  source={{uri: media.url}}
                  style={styles.fullscreenVideo}
                  controls
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={{uri: media?.url}}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Modal>

          <Modal
            visible={noteModalVisible}
            animationType="slide"
            transparent
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

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginVertical: 12,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  mediaContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  selectedMedia: {
    borderWidth: 2,
    borderColor: '#007bff',
    opacity: 0.6,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoIconOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#007bff',
    paddingVertical: 8,
    textDecorationLine: 'underline',
  },
  allLoadedText: {
    fontSize: 14,
    color: '#888',
    paddingVertical: 8,
  },
  deleteBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },

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
  progressOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -20}, {translateY: -20}],
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MediaGallery;
