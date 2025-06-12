import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import Financial from './component/Financial';
import ComingSoon from '../../../components/ComingSoon';

const WorksheetScreen = ({selectedJob}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardOpen(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardOpen(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1, position: 'relative'}}>
          <View style={styles.container}>
            {/* Header Tabs */}
            {!isKeyboardOpen && (
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 0 && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(0)}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 0 && styles.activeTabText,
                    ]}>
                    Financial
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 1 && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(1)}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 1 && styles.activeTabText,
                    ]}>
                    Invoices
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tab content */}
            {activeTab === 0 && <Financial selectedJob={selectedJob} />}
            {activeTab === 1 && <ComingSoon />}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 5},
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#007aff',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WorksheetScreen;
