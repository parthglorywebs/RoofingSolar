import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../assets/styling/colors';
import config from '../../../config/config';

const MAX_DEPTH_INDENT = 20 * 3;
const screenWidth = Dimensions.get('window').width;

// Helpers to detect media type
const isVideoUrl = url => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const isImageUrl = url => {
  if (!url) return false;
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

const CommentItem = ({item, depth = 0, onReply, currentUserName}) => {
  const indent = Math.min(depth * 20, MAX_DEPTH_INDENT);
  const hasReplies = Array.isArray(item.children) && item.children.length > 0;

  const initials = item.contractor_name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();

  const mediaUrl = item.filePath || null;

  const MediaInsideBubble = ({url}) => {
    if (!url) return null;

    const fullUrl = `${config.s3BucketStorage}${url}`;

    if (isImageUrl(fullUrl)) {
      return (
        <View style={styles.mediaContainer}>
          <Image
            source={{uri: fullUrl}}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    if (isVideoUrl(fullUrl)) {
      return (
        <View style={styles.mediaContainer}>
          <Image
            source={{uri: fullUrl}}
            style={styles.mediaImage}
            resizeMode="cover"
            blurRadius={2}
          />
          <View style={styles.playIconOverlay}>
            <View style={styles.playIcon}>
              <Icon name="play-arrow" size={30} color="white" />
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const Bubble = () => (
    <View style={styles.bubble}>
      <Text style={styles.name}>{item.contractor_name || 'Unknown'}</Text>
      {mediaUrl ? (
        <MediaInsideBubble url={mediaUrl} />
      ) : (
        <Text style={styles.text}>{item.text}</Text>
      )}
    </View>
  );

  const Avatar = () => (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || '?'}</Text>
    </View>
  );

  const Footer = () => (
    <View style={[styles.row, {marginLeft: 50}]}>
      <Text style={styles.time}>{item.created_at_human}</Text>
      <TouchableOpacity onPress={() => onReply(item)} style={styles.replyBtn}>
        <Text style={styles.replyText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{marginLeft: indent, marginBottom: 12}}>
      <View style={styles.row}>
        <Avatar />
        <Bubble />
      </View>
      <Footer />
      {hasReplies &&
        item.children.map(child => (
          <CommentItem
            key={child.id}
            item={child}
            onReply={onReply}
            currentUserName={currentUserName}
            depth={depth + 1}
          />
        ))}
    </View>
  );
};

export default CommentItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bubble: {
    backgroundColor: '#F0F2F5',
    padding: 10,
    borderRadius: 12,
    maxWidth: screenWidth * 0.7,
    width: '100%',
  },
  name: {
    fontWeight: '600',
    color: Colors.themeBlack,
    marginBottom: 4,
  },
  text: {
    color: Colors.themeBlack,
  },
  mediaContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    // width: 200,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playIcon: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 30,
  },
  time: {
    fontSize: 12,
    color: Colors.themePlaceHolder,
    marginRight: 12,
  },
  replyBtn: {
    paddingHorizontal: 4,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
});
