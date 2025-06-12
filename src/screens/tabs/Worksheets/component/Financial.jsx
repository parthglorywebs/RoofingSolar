import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {getFinancialWorksheet} from '../../../../services/worksheetService';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons'; // For collapse icon
import WorksheetItem from './WorksheetItem';
import AddNewWroksheet from './AddNewWroksheet';

export default function Financial({selectedJob}) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [worksheetData, setWorksheetData] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [stages, setStages] = useState([]);
  const [upcomingStages, setUpcomingStages] = useState(null);
  const [payment, setPayment] = useState({
    grandtotal: 0.0,
    approvedjobvalue: 0.0,
    collected: 0.0,
  });

  useEffect(() => {
    if (selectedJob) {
      onRefresh();
    }
  }, [selectedJob]);

  const onRefresh = useCallback(async () => {
    const response = await getFinancialWorksheet(selectedJob.id);
    setTracker(response.tracker);
    setStages(response.stages);
    setUpcomingStages(response.upcoming_stage);
    setWorksheetData(response.worksheet);
    setPayment({
      approvedjobvalue: response.approvedjobvalue,
      collected: response.collected,
      grandtotal: response.grandtotal,
    });
  }, [selectedJob]);

  const onItemChange = (sectionIndex, itemIndex, key, value) => {
    onRefresh();
  };

  const addItem = sectionIndex => {
    setWorksheetData(prev => {
      const newData = [...prev];
      const items = [...newData[sectionIndex].items];

      // Add a new blank item with unique id
      items.push({
        id: 'new',
        title: '',
        amount: '',
      });

      newData[sectionIndex] = {...newData[sectionIndex], items};
      return newData;
    });
  };

  const deleteItem = (sectionIndex, itemIndex) => {
    setWorksheetData(prev => {
      const newData = [...prev];
      const items = [...newData[sectionIndex].items];

      items.splice(itemIndex, 1);

      const subtotal = items.reduce((sum, item) => {
        const amt = parseFloat(item.amount);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      newData[sectionIndex] = {...newData[sectionIndex], items, subtotal};
      return newData;
    });
  };

  const worksheetSections = useMemo(() => {
    return worksheetData.map(section => {
      const title = section.category?.name || 'Unnamed Category';
      const isCollapsed = collapsedSections[title];
      return {
        ...section,
        title,
        data: isCollapsed
          ? []
          : section.items.map(item => ({
              id: item.id,
              name: item.title,
              amount: item.amount,
            })),
        subtotal: section.subtotal.toFixed(2),
        isCollapsed,
      };
    });
  }, [worksheetData, collapsedSections]);

  const toggleCollapse = title => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Render Add Item button after each section's items
  const renderSectionFooter = ({section}) => {
    console.log(section?.category, 'section');

    const redCategories = ['Discount', 'Work Not Doing'];
    const isRed = redCategories.includes(section?.category?.name);

    return (
      <View style={styles.subtotalContainer}>
        <Text style={[styles.subtotal, isRed && {color: 'red'}]}>
          Sub total: ${section.subtotal}
        </Text>
      </View>
    );
  };

  const renderGrandTotal = () => {
    return (
      <View style={styles.grandTotalContainer}>
        <Text style={styles.grandTotalText}>
          Grand Total: ₹{payment.grandtotal.toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderSectionHeader = ({section}) => {
    const sectionIndex = worksheetSections.findIndex(
      s => s.title === section.title,
    );
    const isCollapsed = collapsedSections[section.title];

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => addItem(sectionIndex)}>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleCollapse(section.title)}>
            <Ionicons
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const upcomingStatusIndex = tracker.findIndex(
    item => item.status === upcomingStages,
  );

  const balanceDue =
    Number(payment.approvedjobvalue) - Number(payment.collected);

  const isAllSectionsEmpty = worksheetSections.every(
    section => !section.data || section.data.length === 0,
  );

  return (
    <View style={[styles.container, {position: 'relative'}]}>
      <ScrollView>
        {/* Status Timeline */}
        <View style={styles.timeline}>
          {tracker.map((track, index) => {
            const isBeforeUpcoming = index < upcomingStatusIndex;
            const isUpcoming = index === upcomingStatusIndex;

            const checkmarkColor =
              isBeforeUpcoming || upcomingStages === null ? 'green' : '#ccc';
            const lineColor =
              index < upcomingStatusIndex || upcomingStages === null
                ? 'green'
                : '#ccc';

            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <View style={[styles.line, {backgroundColor: lineColor}]} />
                )}
                <View style={styles.timelineStep}>
                  <Text style={[styles.checkmark, {color: checkmarkColor}]}>
                    ✓
                  </Text>
                  <Text style={styles.statusLabel}>
                    {track.status.charAt(0).toUpperCase() +
                      track.status.slice(1)}
                  </Text>
                  <Text style={styles.date}>
                    {moment(track.created_at).format('MM/DD/YYYY')}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Summary Boxes in a Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, {marginRight: 8}]}>
            <Text style={styles.summaryTitle}>Approved Job Value</Text>
            <Text style={styles.summaryAmount}>
              {Number(payment.approvedjobvalue).toLocaleString('en-US', {
                currency: 'USD',
                style: 'currency',
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={[styles.summaryBox, {marginRight: 8}]}>
            <Text style={styles.summaryTitle}>Collected</Text>
            <Text style={styles.summaryAmount}>
              {Number(payment.collected).toLocaleString('en-US', {
                currency: 'USD',
                style: 'currency',
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={[styles.summaryBox, {backgroundColor: '#e9f7ed'}]}>
            <Text style={styles.summaryTitle}>Balance Due</Text>
            <Text style={[styles.summaryAmount, {color: 'green'}]}>
              {Number(balanceDue).toLocaleString('en-US', {
                currency: 'USD',
                style: 'currency',
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        <SectionList
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: 80}}
          sections={worksheetSections}
          keyExtractor={(item, index) => `${item.id}-${index}-${item.name}`}
          renderSectionHeader={renderSectionHeader}
          renderItem={({item, index, section}) => {
            if (collapsedSections[section.title]) return null;
            return (
              <WorksheetItem
                item={item}
                index={index}
                selectedJob={selectedJob}
                sectionTitle={section.title}
                worksheetSections={worksheetSections}
                onItemChange={onItemChange}
                deleteItem={deleteItem}
                focusOnMount={item?.id === 'new'}
              />
            );
          }}
          renderSectionFooter={renderSectionFooter}
          ListFooterComponent={renderGrandTotal}
          ListEmptyComponent={
            worksheetSections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No worksheet items found.</Text>
              </View>
            ) : null
          }
          keyboardShouldPersistTaps="always"
        />
      </ScrollView>
      <AddNewWroksheet
        selectedJob={selectedJob}
        worksheetData={worksheetData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 5},
  timeline: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  timelineStep: {alignItems: 'center'},
  checkmark: {fontSize: 20, color: 'green'},
  statusLabel: {fontSize: 14, fontWeight: '600'},
  date: {fontSize: 12, color: 'gray'},
  line: {flex: 1, height: 2, backgroundColor: 'green', marginHorizontal: 10},
  sectionHeader: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  collapseIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 12,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 0,
    paddingVertical: 0,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 0,
    paddingVertical: 0,
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  subtotalContainer: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  subtotal: {
    textAlign: 'right',
    color: 'green',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 6,
  },
  summaryTitle: {fontSize: 14, fontWeight: 'bold'},
  summaryAmount: {fontSize: 16, fontWeight: 'bold'},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  amendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007aff',
    marginHorizontal: 12,
    marginBottom: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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

  grandTotalContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
