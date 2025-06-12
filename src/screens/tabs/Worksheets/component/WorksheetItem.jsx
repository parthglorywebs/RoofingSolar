import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ToastAndroid,
  Modal,
  Pressable,
} from 'react-native';
import {
  storeFinancialWorksheetData,
  updateFinancialWorksheetData,
  deleteFinancialWorksheetData, // Make sure this is implemented & imported from your service
} from '../../../../services/worksheetService';

export default function WorksheetItem({
  item,
  selectedJob,
  sectionTitle,
  index,
  worksheetSections,
  onItemChange,
  deleteItem,
  focusOnMount,
}) {
  const sectionIndex = worksheetSections.findIndex(
    s => s.title === sectionTitle,
  );

  const [localName, setLocalName] = useState(item.name);
  const [localAmount, setLocalAmount] = useState(item.amount);
  const [hasChanged, setHasChanged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const amountInputRef = useRef(null);

  useEffect(() => {
    if (focusOnMount && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 300); // small delay to ensure it's rendered
    }
  }, [focusOnMount]);

  useEffect(() => {
    if (localName !== item.name || localAmount !== item.amount) {
      setHasChanged(true);
    } else {
      setHasChanged(false);
    }
  }, [localName, localAmount, item.name, item.amount]);

  const handleSave = async () => {
    const params = {
      projectId: selectedJob.id,
      title: localName,
      amount: localAmount,
    };

    try {
      let response;

      if (item?.id === 'new') {
        const wsData = worksheetSections[sectionIndex];
        params.worksheet_id = wsData.id;

        response = await storeFinancialWorksheetData(params);

        if (response?.item) {
          onItemChange(sectionIndex, index, 'name', localName);
          setHasChanged(false);
          ToastAndroid.show(
            'Worksheet item added successfully!',
            ToastAndroid.SHORT,
          );
        } else {
          throw new Error(response?.message || 'Failed to add worksheet item.');
        }
      } else {
        params.item_id = item.id;
        response = await updateFinancialWorksheetData(params);

        if (response?.item) {
          onItemChange(sectionIndex, index, 'name', localName);
          setHasChanged(false);
          ToastAndroid.show(
            'Worksheet item updated successfully!',
            ToastAndroid.SHORT,
          );
        } else {
          throw new Error(
            response?.message || 'Failed to update worksheet item.',
          );
        }
      }
    } catch (error) {
      ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
    }
  };

  const confirmDelete = () => {
    if (item.id === 'new') {
      // Just delete locally, no API call
      deleteItem(sectionIndex, index);
      ToastAndroid.show('Unsaved worksheet item removed.', ToastAndroid.SHORT);
      return;
    }
    setModalVisible(true);
  };

  const handleDelete = async () => {
    setModalVisible(false);

    try {
      if (item.id === 'new') {
        // Just delete locally, no API call
        deleteItem(sectionIndex, index);
        ToastAndroid.show(
          'Unsaved worksheet item removed.',
          ToastAndroid.SHORT,
        );
        return;
      }
      const wsData = worksheetSections[sectionIndex];

      const response = await deleteFinancialWorksheetData({
        projectId: selectedJob.id,
        item_id: item.id,
        categorie_id: wsData?.category?.id,
      });

      if (response?.data) {
        ToastAndroid.show(
          'Worksheet item deleted successfully!',
          ToastAndroid.SHORT,
        );
        deleteItem(sectionIndex, index);
      } else {
        throw new Error(
          response?.message || 'Failed to delete worksheet item.',
        );
      }
    } catch (error) {
      ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
    }
  };

  return (
    <View style={styles.itemRow}>
      <TextInput
        style={styles.itemLabel}
        value={localName}
        onChangeText={setLocalName}
        placeholder="Enter item name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => amountInputRef.current?.focus()}
      />
      <TextInput
        ref={amountInputRef}
        style={styles.itemAmount}
        value={localAmount}
        onChangeText={setLocalAmount}
        keyboardType="numeric"
        placeholder="0.00"
        returnKeyType="done"
        onSubmitEditing={() => {
          if (hasChanged) {
            handleSave();
          }
        }}
      />
      <View style={styles.actionButtons}>
        {hasChanged && (
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, {opacity: hasChanged ? 1 : 0.4}]}
            disabled={!hasChanged}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>X</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this worksheet item?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.modalButtonText}>No</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                style={[styles.modalButton, styles.confirmButton]}>
                <Text style={[styles.modalButtonText, {color: 'white'}]}>
                  Yes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  itemAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    padding: 6,
  },
  deleteText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#d9534f',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
