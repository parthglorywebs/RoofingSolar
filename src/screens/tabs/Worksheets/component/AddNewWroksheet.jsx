import React, {useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  addNewFinancialWorksheetCategory,
  fetchCategories,
} from '../../../../services/worksheetService';

const FloatingPlusButton = ({onPress}) => {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <MaterialCommunityIcons name="plus" size={28} color="white" />
    </TouchableOpacity>
  );
};

const AddNewWroksheet = ({selectedJob, worksheetData}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleOpenCategory = async () => {
    try {
      const categoriesList = await fetchCategories(selectedJob.id);
      setCategoryList(categoriesList);
      setModalVisible(true);
    } catch (error) {
      setCategoryList([]);
    }
  };

  const handleNewWorkSheet = async () => {
    try {
      const response = await addNewFinancialWorksheetCategory({
        projectId: selectedJob.id,
        category_id: selectedCategories.join(','),
      });
      console.log(response, 'response');
    } catch (error) {}
    console.log('Selected category IDs:', selectedCategories);
    setModalVisible(false);
  };

  const categoryCountMap = useMemo(() => {
    return worksheetData.map(a => Number(a.category.id));
  }, [worksheetData]);

  return (
    <>
      <FloatingPlusButton onPress={handleOpenCategory} />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Categories</Text>
            <ScrollView>
              {categoryList.map(category => {
                const isSelected = selectedCategories.includes(category.id);
                const isDisabled = !!categoryCountMap.includes(
                  Number(category.id),
                );

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.checkboxRow, isDisabled && {opacity: 0.5}]}
                    onPress={() => {
                      if (isDisabled) return;

                      setSelectedCategories(prev =>
                        isSelected
                          ? prev.filter(id => id !== category.id)
                          : [...prev, category.id],
                      );
                    }}
                    activeOpacity={isDisabled ? 1 : 0.8}>
                    <CheckBox
                      value={isSelected}
                      disabled={isDisabled}
                      onValueChange={() => {
                        if (isDisabled) return;
                        setSelectedCategories(prev =>
                          isSelected
                            ? prev.filter(id => id !== category.id)
                            : [...prev, category.id],
                        );
                      }}
                    />
                    <Text style={styles.checkboxLabel}>{category.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, {backgroundColor: '#ccc'}]}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNewWorkSheet}
                style={[styles.modalButton, {backgroundColor: '#007aff'}]}>
                <Text style={{color: '#fff'}}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
export default AddNewWroksheet;

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 40, // Adjust based on tab height
    right: 20,
    backgroundColor: '#2196F3', // or your theme's blue
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
});
