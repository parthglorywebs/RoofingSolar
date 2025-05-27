import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../assets/styling/colors';
import axios from 'axios';
import config from '../../config/config';
import {getLoginDetails} from '../../utils/AsyncStorage';
import moment from 'moment';

const MessagesScreen = ({selectedJob}) => {
  const [form, setForm] = useState({newComment: ''});
  const [error, setError] = useState({newComment: ''});
  const [comments, setComments] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [userName, setUserName] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Track keyboard visibility

  const textInputRef = useRef(null); // Create a ref

  useEffect(() => {
    const fetchInitialData = async () => {
      const {name} = await getLoginDetails();
      setUserName(name);
    };
    fetchInitialData();
    // textInputRef.current.focus();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // Set keyboard visible state
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // Set keyboard invisible state
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handlePostComment = async () => {
    const {newComment} = form;
    const errors = {newComment: ''};
    let isValid = true;

    if (!newComment.trim()) {
      errors.newComment = 'Comment is required.';
      isValid = false;
    }

    setError(errors);
    if (!isValid) return;

    setPostingComment(true);

    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const response = await axios.post(
        `${config.baseUrl}contractor/add-comment-board`,
        {
          contractor_id: contractor_id,
          project_id: selectedJob.id,
          text: newComment,
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;
      console.log(data, 'data');

      if (data && data.success && data.data.original.success) {
        const newCommentData = {
          id: String(data.data.original.data.id),
          text: data.data.original.data.text,
          date: moment(data.data.original.data.created_at).format('YYYY-MM-DD'),
          time: moment(data.data.original.data.created_at).format('hh:mm A'),
          author: data.data.original.data.name,
          created_at_human: data.data.original.data.created_at_human,
          contractor_name: data.data.original.data.contractor_name,
          created_at: data.data.original.data.created_at,
        };

        setComments(prevComments => [newCommentData, ...prevComments]);
        setForm({newComment: ''});
      } else {
        Alert.alert('Error', 'Failed to post comment.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const renderComment = ({item, index}) => {
    const isNewest = index === 0;
    return (
      <View style={styles.mergedContainer}>
        <View style={styles.topContainer}>
          <Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: Colors.themePlaceHolder,
              }}>
              {item.contractor_name}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.themePlaceHolder,
              }}>
              {' '}
              replied{' '}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: Colors.themePlaceHolder,
              }}>
              {item.created_at_human}
            </Text>
          </Text>
        </View>
        <View
          style={[
            styles.cardView,
            {backgroundColor: isNewest ? Colors.white : Colors.borderColor},
          ]}>
          <View style={styles.rowContainer}>
            <View style={styles.circle}>
              <Text style={styles.circleText}>
                {item.author
                  .split(' ')
                  .map(name => name[0])
                  .join('')}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <View style={styles.nameDateRow}>
                <Text
                  style={[
                    styles.nameText,
                    {color: isNewest ? Colors.themeBlack : Colors.themeBlack},
                  ]}>
                  {item.author}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    {color: isNewest ? Colors.themeBlack : Colors.themeBlack},
                  ]}>
                  {item.date}
                </Text>
              </View>
              <Text
                style={[
                  styles.messageContent,
                  {
                    color: isNewest
                      ? Colors.themePlaceHolder
                      : Colors.themeBlack,
                  },
                ]}>
                {item.text}
              </Text>
            </View>
          </View>
          <View style={styles.timestampContainer}>
            <Text
              style={[
                styles.timestampText,
                {color: isNewest ? '#AEAEB2' : '#AEAEB2'},
              ]}>
              {item.time}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Comments</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.searchInput}
              onChangeText={text => setForm({newComment: text})}
              value={form.newComment}
              placeholder="Messages"
              onSubmitEditing={handlePostComment}
              ref={textInputRef}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={postingComment}>
              <View style={{flexDirection: 'row'}}>
                <MaterialCommunityIcons
                  name={'image-multiple'}
                  size={16}
                  color={Colors.themePlaceHolder}
                  style={styles.icon}
                />

                <MaterialCommunityIcons
                  name={'account'}
                  size={16}
                  color={Colors.themePlaceHolder}
                  style={styles.icon}
                />

                <MaterialCommunityIcons
                  name={'camera'}
                  size={16}
                  color={Colors.themePlaceHolder}
                  style={styles.icon}
                />
              </View>
            </TouchableOpacity>
          </View>
          {error.newComment ? (
            <Text style={styles.errorText}>{error.newComment}</Text>
          ) : null}

          {postingComment ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : apiLoading ? (
            <ActivityIndicator
              size="large"
              color="#007bff"
              style={{marginTop: '50%'}}
            />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.commentsListContainer}
              ListEmptyComponent={renderEmptyComponent}
            />
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    // padding: 15,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'gray',
    paddingHorizontal: 15,
    marginHorizontal: 10,
    // marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  commentsListContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  cardView: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 50,
    height: 50,
    backgroundColor: '#5FA3B2',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  circleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    color: '#555',
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
  },
  timestampContainer: {
    alignSelf: 'flex-end',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  topContainer: {
    backgroundColor: '#E3E3E3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  mergedContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.themePlaceHolder,
  },
});

export default MessagesScreen;
