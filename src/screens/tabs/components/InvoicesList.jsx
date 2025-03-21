import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Colors from '../../../assets/styling/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Collapsible from 'react-native-collapsible';
import {Calendar} from 'react-native-calendars'; // Import Calendar
import {Menu, Provider, Divider} from 'react-native-paper';
import axios from 'axios';
import {getLoginDetails} from '../../../utils/AsyncStorage';
import config from '../../../config/config';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const InvoicesList = ({data, loading, error, selectedJob}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [invoiceCategories, setInvoiceCategories] = useState([]); // Now holds the categories
  const [invoicesLoading, setInvoicesLoading] = useState(true); // Add loading state
  const [invoicesError, setInvoicesError] = useState(null); // Add error state

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedInvoiceDetails, setExpandedInvoiceDetails] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [items, setItems] = useState([]);
  const [editingAddedItemId, setEditingAddedItemId] = useState(null);
  const [totalSubtotal, setTotalSubtotal] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isInvoiceDatePickerVisible, setIsInvoiceDatePickerVisible] =
    useState(false);
  const [isDueDatePickerVisible, setIsDueDatePickerVisible] = useState(false);
  const [itemSubtotals, setItemSubtotals] = useState({});
  const [selectedInvoiceIdForAction, setSelectedInvoiceIdForAction] =
    useState(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  // LayoutAnimation configuration
  const animationConfig = {
    duration: 300,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  };

    const fetchInvoiceWorksheet = useCallback(async () => {
      setInvoicesLoading(true);
      setInvoicesError(null);

      try {
        const {access_token, contractor_id} = await getLoginDetails();

        const payload = new FormData();
        payload.append('contractor_id', contractor_id);
        payload.append('project_id', selectedJob.id);

        const response = await axios.post(
          `${config.baseUrl}contractor/get-invoice-worksheet`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data.success) {
          setSelectedInvoices(response.data.data.invoice);
        } else {
          setInvoicesError(
            response.data.message || 'Failed to load invoice data.',
          );
          Alert.alert(
            'Error',
            response.data.message || 'Failed to load invoice data.',
          );
        }
      } catch (error) {
        console.error('Error fetching invoice worksheet data:', error);
        setInvoicesError('Failed to load invoice worksheet data.');
        Alert.alert('Error', 'Failed to load invoice worksheet data.');
      } finally {
        setInvoicesLoading(false);
      }
    }, [selectedJob]);

     const fetchInvoiceCategories = useCallback(async () => {
       setInvoicesLoading(true); // Set loading to true before fetching
       setInvoicesError(null); // Clear any previous errors

       try {
         const {access_token, contractor_id} = await getLoginDetails();

         const payload = new FormData();
         payload.append('contractor_id', contractor_id);
         payload.append('project_id', selectedJob.id);

         const response = await axios.post(
           `${config.baseUrl}contractor/get-invoice-worksheet-categories`,
           payload,
           {
             headers: {
               Authorization: `Bearer ${access_token}`,
               'Content-Type': 'multipart/form-data',
             },
           },
         );

         if (response.data.success) {
           const fetchedCategories = response.data.data.map(category => ({
             id: category.id,
             label: category.name,
             checked: false,
           }));
           setInvoiceCategories(fetchedCategories); //Store in invoiceCategories
         } else {
           setInvoicesError(
             response.data.message || 'Failed to load invoice categories.',
           );
           Alert.alert(
             'Error',
             response.data.message || 'Failed to load invoice categories.',
           );
         }
       } catch (error) {
         console.error('Error fetching invoice categories:', error);
         setInvoicesError('Failed to load invoice categories.');
         Alert.alert('Error', 'Failed to load invoice categories.');
       } finally {
         setInvoicesLoading(false); // Set loading to false after fetching
       }
     }, [selectedJob]);

  useEffect(() => {
    fetchInvoiceWorksheet();
     fetchInvoiceCategories();
  }, [fetchInvoiceWorksheet,fetchInvoiceCategories, selectedJob]);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleInvoiceOptionSelect = id => {
    setInvoiceCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === id ? {...category, checked: !category.checked} : category,
      ),
    );
  };

  const handleAddInvoices = async () => {
    const selectedCategoryIds = invoiceCategories
    .filter(category => category.checked)
    .map(category => category.id);

    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const payload = new FormData();
      payload.append('contractor_id', contractor_id);
      payload.append('project_id', selectedJob.id);
       selectedCategoryIds.forEach(categoryId => {
         payload.append('categorie_id', categoryId);
       });

      const response = await axios.post(
        `${config.baseUrl}contractor/add-invoice-worksheet-categories`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        // Re-fetch the invoice data to update the list:
         fetchInvoiceWorksheet();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add invoice.');
      }
    } catch (error) {
      console.error('Error adding invoice:', error);
      Alert.alert('Error', 'Failed to add invoice.');
    } finally {
      closeModal();
    }
  };

  const addInvoiceItemWorksheet = () => {

    //contractor/add-invoice-item-worksheet
  }

  const updateInvoiceItemWorksheet = () => {
  //contractor/update-invoice-item-worksheet

  }


  const getImportFinancialWorksheetData = () => {
    //contractor/get-import-financial-worksheet-data
  }
  
  const saveInvoiceWorksheet = () => {
    //contractor/save-invoice-worksheet
  }

  const addImportFinancialWorksheetData = () => {
    //contractor/add-import-financial-worksheet-data
  }

  const getImportQuotationWorksheet = () => {
    //contractor/get-import-quotation-worksheet-data
  }

  const addImportQuotationWorksheet = () => {
    //contractor/add-import-quotation-worksheet-data
  }

  const addInovoiceWorksheetSection = () => {
    //contractor/add-invoice-worksheet-by-section
  }

  const handleDeleteInvoice = useCallback(invoiceId => {
    Alert.alert(
      'Delete Invoice Item',
      'Are you sure you want to delete this Invoice item?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSelectedInvoices(prevInvoices =>
              prevInvoices.filter(invoice => invoice.id !== invoiceId),
            );
          },
        },
      ],
      {cancelable: false},
    );
  }, []);

  const handleOpenActionModal = invoiceId => {
    setSelectedInvoiceIdForAction(invoiceId);
    setIsActionModalVisible(true);
  };

  const handleCloseActionModal = () => {
    setIsActionModalVisible(false);
    setSelectedInvoiceIdForAction(null);
  };

  const handleActionSelect = action => {
    handleCloseActionModal();

    switch (action) {
      case 'addWorksheet':
        // Handle add worksheet action
        console.log('Add Worksheet action');
        break;
      case 'removeInvoice':
        // Show confirmation alert for removing the invoice
        Alert.alert(
          'Delete Invoice Item',
          'Are you sure you want to delete this Invoice item?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                setSelectedInvoices(prevInvoices =>
                  prevInvoices.filter(
                    invoice => invoice.id !== selectedInvoiceIdForAction,
                  ),
                );
              },
            },
          ],
          {cancelable: false},
        );
        break;
      case 'importFinancialData':
        // Handle import financial data action
        console.log('Import Financial Data action');
        break;
      case 'importQuotation':
        // Handle import quotation action
        console.log('Import Quotation action');
        break;
      default:
        break;
    }
  };

   const handleEmailInvoice = async invoiceId => {
    try {
      const { access_token, contractor_id } = await getLoginDetails();

      const payload = new FormData();
      payload.append('contractor_id', contractor_id);
      payload.append('project_id', selectedJob.id);
      payload.append('invoice_id', invoiceId);

      const response = await axios.post(
        `${config.baseUrl}contractor/email-invoice-worksheet`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = response.data;

      if (data.success) {
        Alert.alert('Success', data.message);
        // Optionally, update the UI to reflect that the email was sent (e.g., disable the email button)
      } else {
        Alert.alert('Error', data.message || 'Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email.');
    }
  };

  const toggleCollapse = itemId => {
    LayoutAnimation.configureNext(animationConfig);
    setExpandedItems(prevExpandedItems => ({
      ...prevExpandedItems,
      [itemId]: !prevExpandedItems[itemId],
    }));
  };

  const isCollapsed = itemId => {
    return !expandedItems[itemId];
  };

  const toggleInvoiceDetails = itemId => {
    LayoutAnimation.configureNext(animationConfig);
    setExpandedInvoiceDetails(prevExpanded => ({
      ...prevExpanded,
      [itemId]: !prevExpanded[itemId],
    }));
  };

  const isInvoiceDetailsCollapsed = itemId => {
    return !expandedInvoiceDetails[itemId];
  };

  // New functions for editing
  const handleEdit = item => {
    setEditMode(true);
    setEditedItem(item);
    setEditedValues({
      invoicename: item.invoice_name || '',
      itemname: item.itemname || '', // Default to empty string
      subtotal: item.invoice_amount ? item.invoice_amount.toString() : '', // Default to empty string
      invoice_date:item.invoice_date || '',
      invoice_due_date :item.invoice_due_date || ''
    });
  };

  const handleSave = () => {
    setSelectedInvoices(prevInvoices =>
      prevInvoices.map(invoice =>
        invoice.id === editedItem.id ? {...invoice, ...editedValues} : invoice,
      ),
    );
    setEditMode(false);
    setEditedItem(null);
  };

  const handleInputChange = (field, value) => {
    setEditedValues({...editedValues, [field]: value});
  };

  //New code for add Items and handle it

  const handleAddItem = itemId => {
    LayoutAnimation.configureNext(animationConfig);
    const newAddedItem = {
      id: Date.now(),
      itemname: '',
      subtotal: '',
      parentItemId: itemId,
      //date:
    };

    setItems(prevItems => [...prevItems, newAddedItem]);

    // Expand the parent item when a new item is added.
    setExpandedItems(prevExpandedItems => ({
      ...prevExpandedItems,
      [itemId]: true, // Ensure the parent is expanded
    }));
  };

  const handleEditAddedItem = itemId => {
    setEditingAddedItemId(itemId);
  };

  const handleSaveAddedItem = itemId => {
    setEditingAddedItemId(null);
  };

  const handleDeleteAddedItem = itemId => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setItems(prevItems => prevItems.filter(i => i.id !== itemId));
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleAddedItemInputChange = (itemId, field, value) => {
    setItems(prevItems =>
      prevItems.map(i => (i.id === itemId ? {...i, [field]: value} : i)),
    );
  };

  const handleInvoiceDateChange = text => {
    setInvoiceDate(text);
  };

  const handleDueDateChange = text => {
    setDueDate(text);
  };

  const onInvoiceDateSelect = date => {
    setInvoiceDate(date.dateString);
    hideInvoiceDatePicker();
  };

  const onDueDateSelect = date => {
    setDueDate(date.dateString);
    hideDueDatePicker();
  };

  const showInvoiceDatePicker = () => {
    setIsInvoiceDatePickerVisible(true);
  };

  const hideInvoiceDatePicker = () => {
    setIsInvoiceDatePickerVisible(false);
  };

  const showDueDatePicker = () => {
    setIsDueDatePickerVisible(true);
  };

  const hideDueDatePicker = () => {
    setIsDueDatePickerVisible(false);
  };

  // useEffect hook to calculate total subtotal whenever selectedInvoices or items change
  useEffect(() => {
    let total = 0;

    selectedInvoices.forEach(invoice => {
      const invoiceSubtotal = parseFloat(invoice.invoice_amount || 0);
      total += invoiceSubtotal;

      items
        .filter(addedItem => addedItem.parentItemId === invoice.id)
        .forEach(addedItem => {
          total += parseFloat(addedItem.subtotal || 0);
        });
    });

    setTotalSubtotal(total);
  }, [selectedInvoices, items]);

  const calculatedSummary = useMemo(() => {
    let approvalValue = 0;
    let collectedAmount = 0;
    let balanceDue = 0;

    if (selectedInvoices && selectedInvoices.length > 0) {
      // Assuming the first invoice object contains the approval_value, collected, and balance_due
      const firstInvoice = selectedInvoices[0];
      approvalValue = parseFloat(firstInvoice.approval_value || 0);
      collectedAmount = parseFloat(firstInvoice.collected || 0);
      balanceDue = parseFloat(firstInvoice.balance_due || 0);
    }

    // Calculate total invoice amount (grand total) from all selected invoices
    const invoiceGrandTotal = selectedInvoices.reduce((sum, invoice) => {
      const invoiceAmount = parseFloat(invoice.invoice_amount || 0);
      return sum + invoiceAmount;
    }, 0);

    // You might fetch these from an API)
    let accountreceived = 118386.0;

    return {
      accountreceived: parseFloat(accountreceived.toFixed(2)),
      invoicegrandtotal: parseFloat(invoiceGrandTotal.toFixed(2)),
      approvedJobValue: parseFloat(approvalValue.toFixed(2)),
      collectedAmount: parseFloat(collectedAmount.toFixed(2)),
      balanceDue: parseFloat(balanceDue.toFixed(2)),
      grandTotal: parseFloat(invoiceGrandTotal.toFixed(2)),
    };
  }, [selectedInvoices]);

  // End new code for add Items and handle it

  if (invoicesLoading) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  if (invoicesError) {
    return <Text style={styles.errorText}>{invoicesError}</Text>;
  }

  return (
    <View>
      <TouchableOpacity style={styles.saveToApprovedButton} onPress={openModal}>
        <Text style={styles.saveToApprovedText}>+ Add Invoice</Text>
      </TouchableOpacity>

      {selectedInvoices.length === 0 ? (
        <Text style={styles.noDataText}>No Invoices Available</Text>
      ) : (
        <View>
          {selectedInvoices.map((item, index) => {
            const invoiceSubtotal = parseFloat(item.invoice_amount || 0);
            const addedItemsSubtotal = items
              .filter(addedItem => addedItem.parentItemId === item.id)
              .reduce(
                (sum, addedItem) => sum + parseFloat(addedItem.subtotal || 0),
                0,
              );
            const itemTotalSubtotal = invoiceSubtotal + addedItemsSubtotal;
            const invoiceNumber = 1001 + index;

            return (
              <View key={item.id} style={styles.financialItem}>
                {/* Top List Item */}
                <TouchableOpacity
                  style={styles.listItemTop}
                  onPress={() => toggleInvoiceDetails(item.id)}>
                  <View style={styles.listTopHeader}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemHeaderText}>
                        Invoice #{item.invoice_number}
                      </Text>
                      <Icon
                        name={
                          isInvoiceDetailsCollapsed(item.id)
                            ? 'chevron-down'
                            : 'chevron-up'
                        }
                        size={24}
                        color={Colors.passwordToggle}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleOpenActionModal(item.id)}>
                      <Icon
                        name="dots-vertical"
                        size={30}
                        color={Colors.primaryLabel}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                <Collapsible collapsed={isInvoiceDetailsCollapsed(item.id)}>
                  <View style={[styles.invoiceContainer]}>
                    <View style={styles.invoiceBackground} />
                    <View style={styles.itemNameInvoice}>
                      <View style={styles.invoiceBg}>
                        <TextInput
                          style={styles.inputInvoice}
                          value={editedValues.invoicename || item.invoice_name || ''}
                          onChangeText={text =>
                            handleInputChange('invoicename', text)
                          }
                          placeholder="Enter Invoice Name"
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.invoiceBg}
                        onPress={showInvoiceDatePicker}>
                        <View
                          style={{
                            backgroundColor: Colors.invoice,
                            flexDirection: 'row',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}>
                          <Text
                            style={{
                              justifyContent: 'center',
                              alignSelf: 'center',
                              textAlign: 'left',
                              paddingHorizontal: 10,
                              color: Colors.black,
                              flex: 1,
                            }}>
                            Invoice Date
                          </Text>
                          <TextInput
                            style={[styles.inputInvoiceDate, {flex: 1}]}
                            value={editedValues.invoice_date || item.invoice_date || ''}
                            editable={false} // Make it read-only
                            placeholder="Select Invoice Date"
                          />

                          <View style={styles.iconContainer}>
                            <Icon
                              name={'calendar'}
                              size={24}
                              color={Colors.themePlaceHolder}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.invoiceBg}
                        onPress={showDueDatePicker}>
                        <View
                          style={{
                            backgroundColor: Colors.invoice,
                            flexDirection: 'row',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}>
                          <Text
                            style={{
                              justifyContent: 'center',
                              alignSelf: 'center',
                              textAlign: 'left',
                              paddingHorizontal: 10,
                              color: Colors.black,
                              flex: 1,
                            }}>
                            Due Date
                          </Text>
                          <TextInput
                            style={[styles.inputInvoiceDate, {flex: 1}]}
                            value={editedValues.invoice_due_date || item.invoice_due_date || ''}
                            editable={false}
                            placeholder="Select Due Date"
                          />
                          <View style={styles.iconContainer}>
                            <Icon
                              name={'calendar'}
                              size={24}
                              color={Colors.themePlaceHolder}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => toggleCollapse(item.id)}>
                    <View style={styles.listItemHeader}>
                      <View style={styles.listItemLeft}>
                        <Text style={styles.listItemHeaderText}>
                          {item.invoice_name}
                        </Text>
                        <Icon
                          name={
                            isCollapsed(item.id) ? 'chevron-down' : 'chevron-up'
                          }
                          size={24}
                          color={Colors.passwordToggle}
                        />
                      </View>
                      <View style={styles.listItemRight}>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleAddItem(item.id)}>
                          <Icon
                            name="plus-box"
                            size={30}
                            color={Colors.themePlaceHolder}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteInvoice(item.id)}>
                          <Icon
                            name="dots-vertical"
                            size={30}
                            color={Colors.primaryLabel}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <Collapsible collapsed={isCollapsed(item.id)}>
                    <View
                      style={[
                        styles.editView,
                        !isCollapsed(item.id) && styles.editViewBorder,
                      ]}>
                      {editMode && editedItem?.id === item.id ? (
                        // Edit mode
                        <View style={styles.modeContainer}>
                          <View style={styles.labelValueContainer}>
                            <TextInput
                              style={styles.input}
                              value={editedValues.itemname || ''}
                              onChangeText={text =>
                                handleInputChange('itemname', text)
                              }
                              placeholder="Item Name"
                            />
                          </View>

                          <View style={styles.labelValueContainer}>
                            <TextInput
                              style={styles.input}
                              value={editedValues.subtotal || ''}
                              onChangeText={text =>
                                handleInputChange('subtotal', text)
                              }
                              keyboardType="numeric"
                              placeholder="Sub Total"
                            />
                          </View>

                          <View style={styles.buttonContainer}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={handleSave}>
                              <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        // Display mode
                        <View>
                          <View style={styles.displayModeContainer}>
                            <TouchableOpacity
                              onPress={() => handleEdit(item)}
                              style={styles.displayModeContent}>
                              <View style={styles.labelValueContainer}>
                                <Text style={styles.financialItemValue}>
                                  {item.itemname || 'Item Name'}
                                </Text>
                              </View>

                              <View style={styles.labelValueContainer}>
                                <Text style={styles.financialItemValue}>
                                  {item.invoice_amount || '$0'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleEdit(item)}
                              style={styles.dotsButton}>
                              <Icon
                                name="dots-vertical"
                                size={20}
                                color={Colors.themePlaceHolder}
                                style={{paddingHorizontal: 10}}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      <View style={styles.separator} />

                      {/* Render added items */}
                      {items
                        .filter(addedItem => addedItem.parentItemId === item.id)
                        .map((addedItem, addedIndex) => (
                          <View key={addedItem.id}>
                            <View
                              style={[styles.editView, styles.modeContainer]}>
                              {editingAddedItemId === addedItem.id ? (
                                <View>
                                  <View style={styles.labelValueContainer}>
                                    <TextInput
                                      style={styles.input}
                                      value={addedItem.itemname || ''}
                                      onChangeText={text =>
                                        handleAddedItemInputChange(
                                          addedItem.id,
                                          'itemname',
                                          text,
                                        )
                                      }
                                      placeholder="Item Name"
                                    />
                                  </View>
                                  <View style={styles.labelValueContainer}>
                                    <TextInput
                                      style={styles.input}
                                      value={addedItem.subtotal || ''}
                                      onChangeText={text =>
                                        handleAddedItemInputChange(
                                          addedItem.id,
                                          'subtotal',
                                          text,
                                        )
                                      }
                                      keyboardType="numeric"
                                      placeholder="Sub Total"
                                    />
                                  </View>
                                  <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                      style={styles.editButton}
                                      onPress={() => {
                                        handleSaveAddedItem(addedItem.id);
                                      }}>
                                      <Text style={styles.buttonText}>
                                        Save
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <View>
                                  <View style={styles.addedItemContainer}>
                                    <TouchableOpacity
                                      onPress={() =>
                                        handleEditAddedItem(addedItem.id)
                                      } // Added this line!
                                      style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}>
                                      <View>
                                        <Text style={styles.financialItemValue}>
                                          {addedItem.itemname || 'Item Name'}
                                        </Text>
                                        <Text style={styles.financialItemValue}>
                                          {addedItem.subtotal || `$0`}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.deleteButton}
                                      onPress={() =>
                                        handleDeleteAddedItem(addedItem.id)
                                      }>
                                      <Icon
                                        name="dots-vertical"
                                        size={20}
                                        color={Colors.themePlaceHolder}
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                            <View style={styles.separator} />
                          </View>
                        ))}

                      <View style={styles.subtotalContainer}>
                        <Text style={styles.subtotalText}>
                          Subtotal:{' '}
                          <Text style={styles.boldSubtotal}>
                            ${itemTotalSubtotal.toFixed(2)}
                          </Text>
                        </Text>
                      </View>

                      {/* bottomSubcontainer starts here */}
                      <View style={bottomSubcontainerStyles.bottomSubcontainer}>
                        <TouchableOpacity
                          style={[
                            bottomSubcontainerStyles.bottomButton,
                            bottomSubcontainerStyles.previewButton,
                          ]}>
                          <Text
                            style={bottomSubcontainerStyles.bottomButtonText}>
                            Preview
                          </Text>
                        </TouchableOpacity>
                         <TouchableOpacity
                         style={[
                           bottomSubcontainerStyles.bottomButton,
                           bottomSubcontainerStyles.mailButton,
                         ]}
                         onPress={() => handleEmailInvoice(item.id)}>
                         <Icon name="email" size={24} color={Colors.primary} />
                       </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            bottomSubcontainerStyles.bottomButton,
                            bottomSubcontainerStyles.saveButton,
                          ]}>
                          <Text
                            style={bottomSubcontainerStyles.bottomButtonText}>
                            Save
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {/* bottomSubcontainer ends here */}
                    </View>
                  </Collapsible>
                </Collapsible>
              </View>
            );
          })}

          {/* Total Subtotal Display */}
          <View style={styles.grandTotalContainer}>
            <Text style={styles.grandTotalText}>Grand Total:</Text>
            <Text style={styles.grandTotalAmount}>
              ${calculatedSummary.grandTotal.toFixed(2).toString()}
            </Text>
          </View>

          <View style={styles.financialSummary}>
            <View style={styles.summaryItemContainer}>
              <Text style={styles.summaryItemLabel}>Accounts Receivable</Text>
              <Text style={styles.summaryItemValue}>
                ${calculatedSummary.accountreceived.toFixed(2).toString()}
              </Text>
            </View>

            <View style={styles.summaryItemContainer}>
              <Text style={styles.summaryItemLabel}>Invoice Grand Total</Text>
              <Text style={styles.summaryItemValue}>
                ${calculatedSummary.invoicegrandtotal.toFixed(2).toString()}
              </Text>
            </View>

            <View style={styles.summaryItemContainer}>
              <Text style={styles.summaryItemLabel}>Approval Value</Text>
              <Text style={styles.summaryItemValue}>
                ${calculatedSummary.approvedJobValue.toFixed(2).toString()}
              </Text>
            </View>

            <View style={styles.summaryItemContainer}>
              <Text style={styles.summaryItemLabel}>Collected</Text>
              <Text style={styles.summaryItemValue}>
                ${calculatedSummary.collectedAmount.toFixed(2).toString()}
              </Text>
            </View>

            <View style={styles.summaryItemContainer}>
              <Text style={styles.summaryItemLabel}>Balance Due</Text>
              <Text
                style={[
                  styles.summaryItemValue,
                  {color: Colors.success, fontWeight: 'bold'},
                ]}>
                ${calculatedSummary.balanceDue.toFixed(2).toString()}
              </Text>
            </View>
          </View>

          {/* Invoice Date Picker Modal */}
          <Modal
            visible={isInvoiceDatePickerVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={hideInvoiceDatePicker}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={hideInvoiceDatePicker}>
              <View style={styles.modalContentContainer}>
                <Calendar
                  onDayPress={onInvoiceDateSelect}
                  markedDates={{
                    [invoiceDate]: {
                      selected: true,
                      disableTouchEvent: true,
                      selectedColor: Colors.primary,
                      selectedTextColor: '#fff',
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: '#fff',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Due Date Picker Modal */}
          <Modal
            visible={isDueDatePickerVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={hideDueDatePicker}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={hideDueDatePicker}>
              <View style={styles.modalContentContainer}>
                <Calendar
                  onDayPress={onDueDateSelect}
                  markedDates={{
                    [dueDate]: {
                      selected: true,
                      disableTouchEvent: true,
                      selectedColor: Colors.primary,
                      selectedTextColor: '#fff',
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: '#fff',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Add Invoice</Text>
            <ScrollView>
              {invoiceCategories.map(invoice => (
                <TouchableOpacity
                  key={invoice.id}
                  style={modalStyles.categoryItem}
                  onPress={() => handleInvoiceOptionSelect(invoice.id)}>
                  <View style={modalStyles.checkboxContainer}>
                    <View
                      style={[
                        modalStyles.checkbox,
                        invoice.checked && modalStyles.checkboxSelected,
                      ]}
                    />
                  </View>
                  <Text style={modalStyles.categoryLabel}>{invoice.label}</Text>
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
                onPress={handleAddInvoices}>
                <Text style={modalStyles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContentContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '90%', // Adjust as needed
    maxWidth: 400, // Maximum width
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
  saveToApprovedButton: {
    backgroundColor: '#fff',
    borderColor: Colors.invoiceList,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 10,
    alignItems: 'center',
  },
  saveToApprovedText: {
    color: Colors.invoiceList,
    fontSize: 14,
    fontWeight: 'bold',
  },

  financialItem: {
    padding: 10,
  },
  listItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    // marginTop: 5,
    marginRight: 5,
    marginLeft: 5,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRight: {
    flexDirection: 'row',
  },
  listItemHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#865CE2',
  },
  deleteButton: {
    padding: 1,
    justifyContent: 'center',
  },
  editView: {
    paddingHorizontal: 5,
  },
  editViewBorder: {
    borderColor: '#f0f0f0',
    borderWidth: 1,
    marginHorizontal: 5,
  },
  itemNameInvoice: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeContainer: {
    paddingHorizontal: 10,
  },
  invoiceBg: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.primaryLabel,
  },
  labelValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    flex: 1,
  },
  inputInvoice: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: Colors.white,
    padding: 8,
    flex: 1,
  },
  inputInvoiceDate: {
    backgroundColor: Colors.white,
    padding: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  editButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
  displayModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  displayModeContent: {
    flex: 1,
  },
  dotsButton: {
    padding: 1,
    justifyContent: 'center',
  },
  separator: {
    borderBottomColor: Colors.invoice,
    borderBottomWidth: 1,
    marginVertical: 5,
    marginLeft: -5,
    marginRight: -5,
  },
  separatorInvoice: {
    borderBottomColor: Colors.invoice,
    borderBottomWidth: 1,
    marginVertical: 5,
    marginHorizontal: 5,
    marginLeft: -5,
    marginRight: -5,
    // paddingVertical: 5,
  },

  financialItemValue: {
    marginBottom: 5,
    fontSize: 16,
  },
  addedItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalContainer: {
    backgroundColor: '#E3E3E3',
    padding: 10,
    // borderBottomLeftRadius: 5,
    // borderBottomRightRadius: 5,
    marginTop: -5,
    marginLeft: -5,
    marginRight: -5,
  },
  listTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTop: {
    // backgroundColor: Colors.invoiceList,
    backgroundColor: '#EDE7FB',
    padding: 10,
    // marginTop: 5,
    marginRight: 5,
    marginLeft: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    // opacity: 0.5,
  },
  subtotalText: {
    fontSize: 16,
    paddingHorizontal: 5,
  },
  boldSubtotal: {
    fontWeight: 'bold',
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
  },
  grandTotalText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalAmount: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  invoiceContainer: {
    marginHorizontal: 5,
  },
  invoiceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: Colors.invoiceList,
    backgroundColor: '#EDE7FB',
    // opacity: 0.5,
    // borderRadius: 5,
  },
  calendarIconContainer: {
    padding: 5,
  },
  iconContainer: {
    position: 'absolute',
    right: 10, // Adjust as needed for spacing
    top: '50%',
    transform: [{translateY: -12}], // Adjust to vertically center the icon
  },
  financialSummary: {
    marginTop: 10,
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
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
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
    borderBottomColor: Colors.invoice,
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
    alignItems: 'center',
  },
});

const bottomSubcontainerStyles = StyleSheet.create({
  bottomSubcontainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E3E3E3',
    padding: 10,
    marginLeft: -5,
    marginRight: -5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  bottomButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  bottomButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  mailButton: {
    backgroundColor: Colors.white,
  },
});

export default InvoicesList;
