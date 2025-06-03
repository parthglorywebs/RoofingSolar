import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {Avatar} from 'react-native-paper';
import FastImage from 'react-native-fast-image';
import ImageVideoEditor from '../../components/ImagePicker/ImageVideoEditor';

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

export default function MediaGallery({
  mediaList,
  onLoadMore,
  isLoadingMore,
  totalPages,
  currentPage,
  selectedJob,
  handleSetAsCoverPhoto,
  onDelete,
  onRefresh,
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sections = useMemo(() => groupMediaByDate(mediaList, 4), [mediaList]);

  const handleLongPress = media => {
    console.log(media, 'media');

    setIsSelectionMode(true);
    setSelectedItems([media.id]);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh?.(); // If onRefresh is passed as prop
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
              <ImageVideoEditor
                media_url={media.url}
                selectedJob={selectedJob}
                media_type={media.type}
                handleSetAsCoverPhoto={handleSetAsCoverPhoto}
                onDelete={onDelete}
                onRefresh={onRefresh}
                media={media}
                mediaList={mediaList}
                disabled={isSelectionMode}>
                {media.type === 'video' ? (
                  <>
                    <FastImage
                      source={{
                        uri: media.thumbnail,
                        priority: FastImage.priority.normal,
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
                      priority: FastImage.priority.normal,
                    }}
                    style={styles.media}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                )}
              </ImageVideoEditor>
              <Avatar.Text
                label={avatarLabel}
                size={24}
                style={styles.avatar}
                labelStyle={{fontWeight: 'bold', fontSize: 14}}
              />
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
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#888" />
        </View>
      );
    }

    if (currentPage < totalPages) {
      return (
        <View style={styles.footer}>
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

  return (
    <View style={{flex: 1}}>
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
    </View>
  );
}

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
  footer: {
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
});
