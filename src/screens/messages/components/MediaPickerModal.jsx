// components/MediaPickerModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';

export default function MediaPickerModal({
  visible,
  onClose,
  onCamera,
  onGallery,
  onVideo,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <TouchableOpacity style={styles.option} onPress={onCamera}>
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={onGallery}>
                <MaterialCommunityIcons
                  name="image"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.optionText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={onVideo}>
                <MaterialCommunityIcons
                  name="video"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.optionText}>Video</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    color: Colors.themeBlack,
  },
});
