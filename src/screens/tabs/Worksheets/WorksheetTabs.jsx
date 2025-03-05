import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';
import {getLoginDetails} from '../../../utils/AsyncStorage';
import axios from 'axios';
import config from '../../../config/config';
import HorizontalStepIndicator from '../../../components/HorizontalStepIndicator';
import FinancialList from '../components/FinancialList';
import InvoicesList from '../components/InvoicesList';

function WorksheetTabs({selectedJob}) {
  const [activeTab, setActiveTab] = useState('Financial');
  const [financialData, setFinancialData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [financialError, setFinancialError] = useState(null);
  const [invoicesError, setInvoicesError] = useState(null);
  const [contractorId, setContractorId] = useState(null);
  const [itemSubtotals, setItemSubtotals] = useState({});  // State to store individual item subtotals

  const [labels, setLabels] = useState([]);
  const [dates, setDates] = useState([]);  // You might need to derive dates based on tracker data
  const [currentPosition, setCurrentPosition] = useState(0);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [categories, setCategories] = useState([
    {id: 'changeOrder', label: 'Change Order', checked: false},
    {id: 'discount', label: 'Discount', checked: false},
    {id: 'financialWorksheet', label: 'Financial Worksheet', checked: false},
    {id: 'insuranceClaim', label: 'Insurance Claim', checked: false},
    {id: 'supplement', label: 'Supplement', checked: false},
    {id: 'upgrade', label: 'Upgrade', checked: false},
    {id: 'workNotDoing', label: 'Work Not Doing', checked: false},
  ]);

  useEffect(() => {
     const fetchInitialData = async () => {
       const { contractor_id } = await getLoginDetails();
       setContractorId(contractor_id);
       await fetchFinancialData();
       await fetchInvoicesData();
     };
     fetchInitialData();
  }, [selectedJob, fetchFinancialData, fetchInvoicesData]);

  const fetchFinancialData = useCallback(async () => {
    setFinancialLoading(true);
    setFinancialError(null);

    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const response = await axios.post(
        `${config.baseUrl}contractor/get-financial-worksheet`,  // Updated Endpoint
        {
          contractor_id: contractor_id,
          project_id: selectedJob.id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      console.log(contractor_id, selectedJob.id);
      
      const data = response.data;

      if (data && data.success && data.data) {
        const { stages, tracker, worksheet, grandtotal, approvedjobvalue, collected } = data.data;

        setLabels(stages);

        const trackerDates = tracker.map(item => {
          return new Date(item.created_at).toLocaleDateString();
        });
        setDates(trackerDates);

        setCurrentPosition(tracker.length -1 )

        setFinancialData(worksheet);

        // Initialize itemSubtotals based on the fetched data
        const initialSubtotals = {};
        worksheet.forEach(item => {
            initialSubtotals[item.id] = parseFloat(item.subtotal || 0);
        });
        setItemSubtotals(initialSubtotals);

      } else {
        //  setFinancialError(data.message || 'Failed to load financial data.');
        //  Alert.alert('Error', data.message || 'Failed to load financial data.');
      }
    } catch (error) {
      // console.error('Error fetching financial data:', error);
      //    setFinancialError('Failed to load financial data.');
      //    Alert.alert('Error', 'Failed to load financial data.');
    } finally {
      setFinancialLoading(false);
    }
  }, [selectedJob]);

  const fetchInvoicesData = useCallback(async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);

    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const response = await axios.post(
        `${config.baseUrl}contractor/get-invoices-data`,
        {
          contractor_id: contractor_id,
          project_id: selectedJob.id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;

      if (data && data.success && data.data) {
        setInvoicesData(data.data);
      } else {
        //  setInvoicesError(data.message || 'Failed to load invoices data.');
        //  Alert.alert('Error', 'Failed to load invoices data.');
      }
    } catch (error) {
      // console.error('Error fetching invoices data:', error);
      //    setInvoicesError('Failed to load invoices data.');
      //    Alert.alert('Error', 'Failed to load invoices data.');
    } finally {
      setInvoicesLoading(false);
    }
  }, [selectedJob]);

  const handleTabPress = tabName => {
    setActiveTab(tabName);
  };

  const calculatedSummary = useMemo(() => {
    // Calculate grandTotal from itemSubtotals
    const grandTotal = Object.values(itemSubtotals).reduce((sum, subtotal) => sum + subtotal, 0);

    // Initialize other summary values (you might fetch these from an API)
    let approvedJobValue = 70500.0; // Or fetch from API
    let collectedAmount = 70500.0; // Or fetch from API
    const balanceDue = approvedJobValue - collectedAmount;


    return {
      approvedJobValue: parseFloat(approvedJobValue.toFixed(2)),
      collectedAmount: parseFloat(collectedAmount.toFixed(2)),
      balanceDue: parseFloat(balanceDue.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
  }, [itemSubtotals]);

  // Modal functions
  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleCategoryChange = (id) => {
    const updatedCategories = categories.map((category) =>
      category.id === id ? {...category, checked: !category.checked} : category
    );
    setCategories(updatedCategories);
  };

  const handleAddCategories = () => {
    const selectedCategories = categories
      .filter(cat => cat.checked)
      .map(cat => cat.label); // Extract labels, not the whole object.

    // Check for duplicate categories BEFORE adding
    const duplicateCategories = selectedCategories.filter(category =>
      financialData.some(item => item.name === category),
    );

    if (duplicateCategories.length > 0) {
      Alert.alert(
        'Error',
        `The Category "${duplicateCategories.join(', ')}" Already Exists!`
      );
      return; // Don't add if duplicates exist.
    }

     // Create new financial data items
     const newFinancialItems = selectedCategories.map(category => ({
      id: Date.now() + Math.random(), // Generate a unique ID
      name: category,
      itemname: '',
      subtotal: 0,
    }));

    // Update financialData state
    setFinancialData(prevData => [...prevData, ...newFinancialItems]);

       // Also initialize subtotals for the new items:
       const newSubtotals = {};
       newFinancialItems.forEach(item => {
           newSubtotals[item.id] = 0;
       });
       setItemSubtotals(prevSubtotals => ({...prevSubtotals, ...newSubtotals}));

    closeModal();
  };

  const handleSave = (updatedItem) => {
    setFinancialData(prevData =>
      prevData.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleDelete = (itemId) => { // <-- Add 'handleDelete' function
      setFinancialData(prevData => prevData.filter(item => item.id !== itemId));
      setItemSubtotals(prevSubtotals => {
          const {[itemId]: deleted, ...rest} = prevSubtotals;  // Remove the item from subtotals
          return rest;
      });
  };

  // Placeholder function - REPLACE WITH YOUR ACTUAL SAVE LOGIC
  const saveSelectedCategories = (selectedCategories) => {
    //  Make API call or update local state to save
    // console.log('Saving categories:', selectedCategories);
    //  Example:
    //  updateFinancialDataWithCategories(selectedCategories);
  };

  const handleSaveFinancialData = async updatedData => {
    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const response = await axios.post(
        `${config.baseUrl}contractor/update-financial-data`,
        {
          contractor_id: contractor_id,
          project_id: selectedJob.id,
          financial_data: updatedData,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;

      if (data && data.success) {
        // Update the local state with the updated data from the server (optional).
        setFinancialData(updatedData); //This line has changed.  Setting the financialData State.
        Alert.alert('Success', 'Financial data updated successfully.');
      } else {
        Alert.alert('Error', data.message || 'Failed to update financial data.');
      }
    } catch (error) {
      console.error('Error updating financial data:', error);
      Alert.alert('Error', 'Failed to update financial data.');
    }
  };

  // Function to update individual item subtotals
    const handleSubtotalChange = (itemId, newSubtotal) => {
        setItemSubtotals(prevSubtotals => ({
            ...prevSubtotals,
            [itemId]: newSubtotal,
        }));
    };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Financial' && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress('Financial')}>
          <Icon
            name={'currency-usd'}
            size={18}
            color={
              activeTab === 'Financial' ? Colors.primary : Colors.noneFocus
            }
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'Financial' && styles.activeTabText,
            ]}>
            Financial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Invoices' && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress('Invoices')}>
          <Icon
            name={'file-document-outline'}
            size={18}
            color={activeTab === 'Invoices' ? Colors.primary : Colors.noneFocus}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'Invoices' && styles.activeTabText,
            ]}>
            Invoices
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Financial' && (
    <ScrollView style={{flex: 1}}>
      <View style={{flexDirection: 'column'}}>
        <View style={styles.financialHeader}>
          <HorizontalStepIndicator
            labels={labels}
            currentPosition={currentPosition}
            dates={dates}
          />
        </View>

        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity style={styles.saveToApprovedButton}>
            <Text style={styles.saveToApprovedText}>Save to Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addbutton} onPress={openModal}>
            <Text style={styles.addtext}>+</Text>
          </TouchableOpacity>
        </View>

        <FinancialList
          data={financialData}
          loading={financialLoading}
          error={financialError}
          selectedJob={selectedJob}
          contractorId={contractorId}
          openModal={openModal}
          handleSaveFinancialData={handleSaveFinancialData}
          onSave={handleSave} // Pass the handleSave function as the onSave prop
          onDelete={handleDelete} // Pass the handleDelete function as the onDelete prop
          onSubtotalChange={handleSubtotalChange} // Pass the function to FinancialList
        />

        <View style={styles.grandTotalContainer}>
          <Text style={styles.grandTotalText}>Grand Total:</Text>
          <Text style={styles.grandTotalAmount}>
             ${calculatedSummary.grandTotal.toFixed(2).toString()}
          </Text>
        </View>

        <View style={styles.financialSummary}>
          <View style={styles.summaryItemContainer}>
            <Text style={styles.summaryItemLabel}>Approved Job Value:</Text>
            <Text style={styles.summaryItemValue}>
             ${calculatedSummary.approvedJobValue.toFixed(2).toString()}
            </Text>
          </View>

          <View style={styles.summaryItemContainer}>
            <Text style={styles.summaryItemLabel}>Collected:</Text>
            <Text style={styles.summaryItemValue}>
             ${calculatedSummary.collectedAmount.toFixed(2).toString()}
            </Text>
          </View>

          <View style={styles.summaryItemContainer}>
            <Text style={styles.summaryItemLabel}>Balance Due:</Text>
            <Text
              style={[
                styles.summaryItemValue,
                {color: Colors.success, fontWeight: 'bold'},
              ]}>
              ${calculatedSummary.balanceDue.toFixed(2).toString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )}

{activeTab === 'Invoices' && (
          <ScrollView style={{flex: 1}}>
        <InvoicesList
          data={invoicesData}
          // loading={invoicesLoading}
          error={invoicesError}
          selectedJob={selectedJob}
          contractorId={contractorId}
        />
     </ScrollView>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true} // Make the background transparent
        onRequestClose={closeModal}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Select Categories</Text>
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={modalStyles.categoryItem}
                  onPress={() => handleCategoryChange(category.id)}>
                  <View style={modalStyles.checkboxContainer}>
                    <View
                      style={[
                        modalStyles.checkbox,
                        category.checked && modalStyles.checkboxSelected,
                      ]}
                    />
                  </View>
                  <Text style={modalStyles.categoryLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={closeModal}>
                <Text style={modalStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.addButton]}
                onPress={handleAddCategories}>
                <Text style={modalStyles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  financialHeader: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 10
  },
  saveToApprovedButton: {
    backgroundColor: '#fff',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginEnd: 10,
    alignItems: 'center',
    flex: 1,
  },
  saveToApprovedText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addbutton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 35,
    height: 35,
  },
  addtext: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    position: 'relative', // Add position relative
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: Colors.noneFocus,
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  tabIcon: {
    marginRight: 0,
  },
  financialSummary: {
    // padding: 10,
    // marginVertical: 10,
    // paddingHorizontal: 10,
  },
  summaryItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
    paddingHorizontal: 10,
  },
  summaryItemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#333333',
    padding: 12,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    // marginRight: 5,
    fontWeight: 'bold',

  },
  summaryItemValue: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    padding: 10,
    textAlign: 'right',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: Colors.invoice,
    borderLeftWidth: 0,
  },

  grandTotalContainer: {
    backgroundColor: '#696969',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginVertical: 20,
  },
  grandTotalText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'left',
    fontWeight: 'bold'
  },
  grandTotalAmount: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'right',
    fontWeight: 'bold'
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%', // Limit height to avoid overflowing the screen
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorksheetTabs;