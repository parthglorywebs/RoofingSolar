import React, {useCallback, useState} from 'react';
import {
  View,
  Modal,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');

const PhotoGalleryModal = ({
  photos,
  onRemovePhoto,
  showGalleryButton = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onClose = useCallback(() => {
    setVisible(false);
    setFullScreenIndex(null);
  }, []);

  const onGalleryButtonPress = useCallback(() => {
    setVisible(true);
  }, []);

  const openFullScreen = index => {
    setFullScreenIndex(index);
    setCurrentIndex(index);
  };

  const closeFullScreen = () => {
    setFullScreenIndex(null);
  };

  const renderGalleryButton = () => {
    if (!showGalleryButton) return null;

    return (
      <TouchableOpacity
        onPress={onGalleryButtonPress}
        style={styles.galleryButton}>
        {photos.length > 0 ? (
          <View>
            <Image
              source={{uri: photos[photos.length - 1]?.uri}}
              style={styles.thumbnail}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{photos.length}</Text>
            </View>
          </View>
        ) : (
          <MaterialIcons name="photo-library" size={28} color="white" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderGalleryButton()}

      {/* Gallery Grid Modal */}
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Captured Photos</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {photos.length === 0 ? (
            <Text style={styles.noPhotos}>No photos available</Text>
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  onPress={() => openFullScreen(index)}
                  style={styles.imageContainer}>
                  <Image source={{uri: item.uri}} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemovePhoto(index)}>
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Full-Screen Modal with Swipe */}
      {fullScreenIndex !== null && (
        <Modal visible={true} animationType="fade" transparent>
          <View style={styles.fullscreenContainer}>
            <View style={styles.fullscreenHeader}>
              <Text style={styles.fullscreenTitle}>
                {currentIndex + 1} / {photos.length}
              </Text>
              <TouchableOpacity
                onPress={closeFullScreen}
                style={styles.fullscreenClose}>
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={fullScreenIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={event => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / width,
                );
                setCurrentIndex(newIndex);
              }}
              renderItem={({item}) => (
                <View style={styles.fullscreenImageWrapper}>
                  <Image
                    source={{uri: item.uri}}
                    style={styles.fullscreenImage}
                  />
                </View>
              )}
            />
          </View>
        </Modal>
      )}
    </>
  );
};

export default PhotoGalleryModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  noPhotos: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 10,
  },
  galleryButton: {
    alignSelf: 'center',
    marginVertical: 10,
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullscreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullscreenClose: {
    position: 'absolute',
    right: 20,
  },
  fullscreenImageWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
});
