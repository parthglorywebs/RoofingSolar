import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import PushNotification from 'react-native-push-notification';
import {
  fetchComments,
  getPresignedUrls,
  postComment,
} from '../../services/commentService';
import CommentItem from './components/CommentItem';
import MessageInput from './components/MessageInput';
import CommentsHeader from './components/CommentsHeader';
import EmptyComments from './components/EmptyComments';
import {getLoginDetails} from '../../utils/AsyncStorage';
import Colors from '../../assets/styling/colors';

export default function MessagesScreen({selectedJob, onBack}) {
  const [messageText, setMessageText] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const textInputRef = useRef(null);

  const parentComments = comments.filter(comment => !comment.parent_id);
  const latestFiveComments = parentComments.slice(0, 5);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const {name} = await getLoginDetails();
        setUserName(name);
        await loadComments();
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [selectedJob.id]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await fetchComments(selectedJob.id);
      setComments(commentsData);
    } catch {
      setError('Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!messageText.trim()) return setError('Message cannot be empty');
    setIsSubmitting(true);
    try {
      const {contractor_id} = await getLoginDetails();
      const commentData = {
        contractor_id,
        project_id: selectedJob.id,
        text: messageText,
        ...(replyingTo ? {parent_id: replyingTo.id} : {}),
      };
      await postComment(commentData);
      await loadComments();
      setMessageText('');
      setReplyingTo(null);
    } catch {
      setError('Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    }
    return true;
  };

  const handleUploadAndPostMediaComment = async asset => {
    if (!asset?.uri || !asset?.type || !asset?.fileName) {
      setError('Invalid file selected.');
      return;
    }

    setIsSubmitting(true);
    const notificationId = `${Date.now()}`;

    try {
      await requestPermission();
      const {contractor_id} = await getLoginDetails();
      const presignedUrls = await getPresignedUrls(asset, selectedJob?.id);
      const uploadUrl = presignedUrls.find(a => a.key === 'original')?.url;
      if (!uploadUrl) throw new Error('Presigned URL not received.');

      PushNotification.localNotification({
        channelId: 'upload-channel',
        id: notificationId,
        title: 'Upload in progress',
        message: 'Preparing to upload files...',
        progress: 0,
        ongoing: true,
        playSound: false,
        vibrate: false,
      });

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', asset.type);

      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percentComplete = Math.floor(
            (event.loaded / event.total) * 100,
          );
          const currentFileName =
            asset?.name || asset?.fileName || 'Unnamed File';
          PushNotification.localNotification({
            id: notificationId,
            channelId: 'upload-channel',
            title: `Uploading: ${currentFileName}`,
            message: `Progress: ${percentComplete}%`,
            progress: percentComplete,
            ongoing: true,
            playSound: false,
            vibrate: false,
          });
        }
      };

      xhr.onload = async function () {
        if (xhr.status !== 200) throw new Error('Upload failed');

        const uploadedUrl = uploadUrl.split('?')[0];
        const commentData = {
          contractor_id,
          project_id: selectedJob.id,
          media_url: uploadedUrl,
          media_type: asset.type,
          text: asset?.fileName,
          ...(replyingTo ? {parent_id: replyingTo.id} : {}),
        };

        await postComment(commentData);
        await loadComments();
        setReplyingTo(null);
        PushNotification.localNotification({
          channelId: 'upload-channel',
          id: notificationId,
          title: 'Upload complete',
          message: 'Media uploaded and comment posted.',
          progress: 100,
          ongoing: false,
          playSound: false,
          vibrate: false,
        });
        setIsSubmitting(false);
      };

      xhr.onerror = function () {
        setError('Upload failed.');
        PushNotification.localNotification({
          id: notificationId,
          channelId: 'upload-channel',
          title: 'Upload Failed',
          message: 'There was an error uploading the media.',
          progress: 100,
          ongoing: false,
          playSound: false,
          vibrate: false,
        });
        setIsSubmitting(false);
      };

      xhr.send({uri: asset.uri, type: asset.type, name: asset.fileName});
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
      PushNotification.localNotification({
        id: notificationId,
        title: 'Upload Failed',
        message: 'Something went wrong during upload.',
      });
      setIsSubmitting(false);
    }
  };

  const handleReply = comment => {
    setReplyingTo(comment);
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };

  const handleLoadMore = async () => {
    setShowAllModal(true);
    await loadComments();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadComments();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <CommentsHeader count={comments.length} onBack={onBack} />

            {comments.length > 5 && (
              <TouchableOpacity
                onPress={handleLoadMore}
                style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Comments</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={latestFiveComments}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <CommentItem
                  item={item}
                  onReply={handleReply}
                  currentUserName={userName}
                />
              )}
              style={{flex: 1}}
              contentContainerStyle={{flexGrow: 1, paddingBottom: 10}}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<EmptyComments />}
              ListFooterComponent={
                isLoading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading comments...</Text>
                  </View>
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null
              }
            />

            <MessageInput
              value={messageText}
              onChangeText={setMessageText}
              onSubmit={handlePostComment}
              isSubmitting={isSubmitting}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              inputRef={textInputRef}
              onCamera={handleUploadAndPostMediaComment}
              onGallery={handleUploadAndPostMediaComment}
              onVideo={handleUploadAndPostMediaComment}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={showAllModal}
        animationType="slide"
        onRequestClose={() => setShowAllModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Comments</Text>
            <TouchableOpacity onPress={() => setShowAllModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={{flex: 1}}>
            <FlatList
              data={comments}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <CommentItem
                  item={item}
                  onReply={handleReply}
                  currentUserName={userName}
                />
              )}
              contentContainerStyle={{flexGrow: 1}}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
            />
          </View>

          <MessageInput
            value={messageText}
            onChangeText={setMessageText}
            onSubmit={handlePostComment}
            isSubmitting={isSubmitting}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            inputRef={textInputRef}
            onCamera={handleUploadAndPostMediaComment}
            onGallery={handleUploadAndPostMediaComment}
            onVideo={handleUploadAndPostMediaComment}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8F8F8'},
  loaderContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, fontSize: 14, color: Colors.themePlaceHolder},
  errorContainer: {padding: 20, alignItems: 'center', justifyContent: 'center'},
  errorText: {color: Colors.error || '#FF3B30', textAlign: 'center'},
  viewAllButton: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  viewAllText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.themeBlack,
  },
  closeText: {
    fontSize: 14,
    color: Colors.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
