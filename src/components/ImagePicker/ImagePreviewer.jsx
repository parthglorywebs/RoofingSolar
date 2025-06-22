import React, {useEffect, useMemo, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import FastImage from 'react-native-fast-image';

const ImagePreviewer = ({
  mediaUrls,
  initialIndex,
  setPreviewVisible,
  onNext,
  onPrev,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initialIndex > -1) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]);
  // Custom loader
  const loadingRender = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );

  // Use FastImage to load and cache the image
  const renderImage = props => {
    return (
      <FastImage
        style={props.style}
        source={{
          uri: props.source.uri,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    );
  };

  const imageUrls = useMemo(() => {
    return mediaUrls.map(url => ({url}));
  }, [mediaUrls]);

  const handleImageChange = index => {
    if (index > currentIndex && onNext) {
      onNext(index);
    } else if (index < currentIndex && onPrev) {
      onPrev(index);
    }
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ImageViewer
        imageUrls={imageUrls}
        visible={true}
        index={currentIndex}
        enableSwipeDown
        onSwipeDown={() => setPreviewVisible(false)}
        backgroundColor="#000"
        saveToLocalByLongPress={false}
        loadingRender={loadingRender}
        renderImage={renderImage}
        enablePreload={true}
        enableImageZoom={true}
        onChange={handleImageChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImagePreviewer;
