import React, {useState, useEffect} from 'react'; //Import useEffect
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Colors from '../../../assets/styling/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Collapsible from 'react-native-collapsible';

const FinancialList = ({
  data,
  loading,
  error,
  selectedJob,
  contractorId,
  openModal,
  handleSaveFinancialData,
  onSave,
  onDelete,
  onSubtotalChange, // Add this prop to pass subtotal changes to parent
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [itemnameError, setItemnameError] = useState('');
  const [items, setItems] = useState([]); // State to hold added items
  const [editingAddedItemId, setEditingAddedItemId] = useState(null);

  // useEffect hook to update subtotal when items or data changes
  useEffect(() => {
    if (data) {
      data.forEach(item => {
        const total =
          parseFloat(item.subtotal || 0) +
          items
            .filter(addedItem => addedItem.parentItemId === item.id)
            .reduce(
              (sum, addedItem) => sum + parseFloat(addedItem.subtotal || 0),
              0,
            );
        onSubtotalChange(item.id, total); //  Pass the total to the parent component
      });
    }
  }, [data, items]); // Dependency array ensures this runs when data or items change

  const handleEdit = item => {
    setEditMode(true);
    setEditedItem(item);
    setEditedValues({
      name: item.name,
      itemname: item.itemname,
      subtotal: item.subtotal.toString(),
      id: item.id,
    });
    setItemnameError('');
  };

  const handleSave = () => {
    if (!editedValues.itemname || editedValues.itemname.trim() === '') {
      setItemnameError('Item name is required.');
      return;
    }
    setItemnameError('');
    onSave(editedValues);

    //Pass the new subtotal to the parent component:
    const total =
      parseFloat(editedValues.subtotal || 0) +
      items
        .filter(addedItem => addedItem.parentItemId === editedValues.id)
        .reduce(
          (sum, addedItem) => sum + parseFloat(addedItem.subtotal || 0),
          0,
        );
    onSubtotalChange(editedValues.id, total);

    setEditMode(false);
    setEditedItem(null);
  };

  const handleInputChange = (field, value) => {
    setEditedValues({...editedValues, [field]: value});
    setItemnameError('');
  };

  const handleDelete = itemId => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(itemId);
            // After deleting, update subtotal in parent component
            onSubtotalChange(itemId, 0);
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleAddItem = itemId => {
    const newAddedItem = {
      id: Date.now(),
      itemname: '',
      subtotal: '',
      parentItemId: itemId,
    };

    setItems(prevItems => [...prevItems, newAddedItem]);

    // Expand the parent item when a new item is added.
    setExpandedItems(prevExpandedItems => ({
      ...prevExpandedItems,
      [itemId]: true, // Ensure the parent is expanded
    }));
  };

  const toggleCollapse = itemId => {
    setExpandedItems(prevExpandedItems => ({
      ...prevExpandedItems,
      [itemId]: !prevExpandedItems[itemId],
    }));
  };

  const isCollapsed = itemId => {
    return !expandedItems[itemId];
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
            const deletedItem = items.find(i => i.id === itemId);
            setItems(prevItems => prevItems.filter(i => i.id !== itemId));

            //update subtotal in parent after delete
            if (deletedItem) {
              const parentItemId = deletedItem.parentItemId;
              // Recalculate subtotal for the parent item
              const parentItem = data.find(item => item.id === parentItemId);
              const newTotal =
                parseFloat(parentItem.subtotal || 0) +
                items
                  .filter(
                    addedItem =>
                      addedItem.parentItemId === parentItemId &&
                      addedItem.id !== itemId,
                  )
                  .reduce(
                    (sum, addedItem) =>
                      sum + parseFloat(addedItem.subtotal || 0),
                    0,
                  );
              onSubtotalChange(parentItemId, newTotal);
            }
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

    // Update subtotal in parent component when an added item changes
    const updatedItem = items.find(item => item.id === itemId);
    if (updatedItem) {
      const parentItemId = updatedItem.parentItemId;
      const parentItem = data.find(item => item.id === parentItemId);

      if (parentItem) {
        const newTotal =
          parseFloat(parentItem.subtotal || 0) +
          items
            .filter(addedItem => addedItem.parentItemId === parentItemId)
            .reduce(
              (sum, addedItem) => sum + parseFloat(addedItem.subtotal || 0),
              0,
            );

        onSubtotalChange(parentItemId, newTotal);
      }
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.primary} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || data.length === 0) {
    return <Text style={styles.noDataText}>No Financial Data Available</Text>;
  }

  return (
    <View>
      {data.map((item, index) => (
        <View key={item.id} style={styles.financialItem}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => toggleCollapse(item.id)}>
            <View style={styles.listItemHeader}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemHeaderText}>
                  {editMode && editedItem?.id === item.id
                    ? editedValues.name
                    : item.name}
                </Text>
                <Icon
                  name={isCollapsed(item.id) ? 'chevron-down' : 'chevron-up'}
                  size={24}
                  color={Colors.themePlaceHolder}
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
                  onPress={() => handleDelete(item.id)}>
                  <Icon
                    name="dots-vertical"
                    size={30}
                    color={Colors.themePlaceHolder}
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
                      value={editedValues.itemname}
                      onChangeText={text => handleInputChange('itemname', text)}
                      placeholder="Item Name"
                    />
                  </View>
                  {itemnameError ? (
                    <Text style={styles.errorText}>{itemnameError}</Text>
                  ) : null}

                  <View style={styles.labelValueContainer}>
                    <TextInput
                      style={styles.input}
                      value={editedValues.subtotal}
                      onChangeText={text => handleInputChange('subtotal', text)}
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
                          ${item.subtotal}
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
                    <View style={[styles.editView, styles.modeContainer]}>
                      {editingAddedItemId === addedItem.id ? (
                        <View>
                          <View style={styles.labelValueContainer}>
                            <TextInput
                              style={styles.input}
                              value={addedItem.itemname}
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
                              value={addedItem.subtotal}
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

                                const parentItemId = addedItem.parentItemId;
                                const parentItem = data.find(
                                  item => item.id === parentItemId,
                                );

                                if (parentItem) {
                                  const newTotal =
                                    parseFloat(parentItem.subtotal || 0) +
                                    items
                                      .filter(
                                        addedItem =>
                                          addedItem.parentItemId ===
                                          parentItemId,
                                      )
                                      .reduce(
                                        (sum, addedItem) =>
                                          sum +
                                          parseFloat(addedItem.subtotal || 0),
                                        0,
                                      );

                                  onSubtotalChange(parentItemId, newTotal);
                                }
                              }}>
                              <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <View style={styles.addedItemContainer}>
                            <TouchableOpacity
                              onPress={() => handleEditAddedItem(addedItem.id)} // Added this line!
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
              {/* Subtotal Display */}
              <View style={[styles.subtotalContainer]}>
                <Text style={styles.subtotalText}>
                  Sub Total:{' '}
                  <Text style={styles.boldSubtotal}>
                    {item.name} $
                    {parseFloat(item.subtotal || 0) +
                      items
                        .filter(addedItem => addedItem.parentItemId === item.id)
                        .reduce(
                          (sum, addedItem) =>
                            sum + parseFloat(addedItem.subtotal || 0),
                          0,
                        )}
                  </Text>
                </Text>
              </View>
            </View>
          </Collapsible>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    textAlign: 'left',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  editView: {
    paddingHorizontal: 5,
  },
  editViewBorder: {
    borderColor: '#f0f0f0',
    borderWidth: 1,
    padding: 5,
    marginHorizontal: 5,
  },
  listItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    // marginBottom: 5,
    marginTop: 5,
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
    textAlign: 'left',
  },
  financialItem: {
    padding: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
  },

  financialItemValue: {
    marginBottom: 5,
    fontSize: 16,
  },
  editButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    // marginTop: 10,
  },
  buttonText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    // marginBottom: 10,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // marginBottom: 5,
    // marginTop: 5
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
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
  deleteButton: {
    padding: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    // marginBottom: 5,
  },
  addedItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 5,
  },
  displayModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Added to push items to the edges
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
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    marginVertical: 5, // Adjust spacing as needed
  },
  modeContainer: {
    paddingHorizontal: 10,
  },
  subtotalContainer: {
    backgroundColor: '#E3E3E3',
    padding: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    marginTop: -5,
    marginBottom: -5,
    marginLeft: -5, // Remove left margin
    marginRight: -5, // Remove right margin
  },
  subtotalText: {
    fontSize: 16,
    textAlign: 'left',
  },
  boldSubtotal: {
    fontWeight: 'bold',
  },
});

export default FinancialList;
