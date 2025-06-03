import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import FastImage from 'react-native-fast-image';

const ImagePreviewer = ({mediaUrl, setPreviewVisible}) => {
  // Custom loader
  const loadingRender = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );

  // Use FastImage to load and cache the image
  const renderImage = props => (
    <FastImage
      style={props.style}
      source={{
        uri: props.source.uri,
        priority: FastImage.priority.high,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  );

  return (
    <View style={styles.container}>
      <ImageViewer
        imageUrls={[{url: mediaUrl}]}
        visible={true}
        enableSwipeDown
        onSwipeDown={() => setPreviewVisible(false)}
        backgroundColor="#000"
        saveToLocalByLongPress={false}
        loadingRender={loadingRender}
        renderImage={renderImage}
        enablePreload={true}
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
