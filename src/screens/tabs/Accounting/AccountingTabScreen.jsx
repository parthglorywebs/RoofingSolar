import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const AccountingTabScreen = () => {
  const [activeTab, setActiveTab] = useState('Receivable');
  const [modalVisible, setModalVisible] = useState(false);

  // Modal Form Fields
  const [jobMethod, setJobMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [accountType, setAccountType] = useState('');

  const receivableData = [
    {
      id: '1',
      title: 'Invoice 1',
      amount: 250,
      status: 'Completed',
      date: '03/17/2025 7:56 AM',
    },
    {
      id: '2',
      title: 'N/A',
      amount: 25,
      status: 'Completed',
      date: '03/17/2025 6:45 AM',
    },
    {
      id: '3',
      title: 'N/A',
      amount: 75,
      status: 'Completed',
      date: '03/17/2025 6:23 AM',
    },
  ];

  const payableData = [
    {
      id: '1',
      method: 'Overhead',
      amount: 100,
      memo: '33',
      accountType: 'Additional Job Expenses',
      updatedAt: '06/06/2025 3:31 AM',
    },
    {
      id: '2',
      method: 'Cold Call',
      amount: 100,
      memo: '3ee',
      accountType: 'Labor',
      updatedAt: '06/06/2025 3:29 AM',
    },
  ];

  const data = activeTab === 'Receivable' ? receivableData : payableData;
  const subtotal = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.screen}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Receivable', 'Payable'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TextInput placeholder="Search" style={styles.searchInput} />
        {activeTab === 'Payable' && (
          <TouchableOpacity
            style={styles.addRowButton}
            onPress={() => setModalVisible(true)}>
            <Text style={styles.addRowText}>+ Add New Row</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        {activeTab === 'Receivable' ? (
          <>
            <Text style={[styles.cell, styles.header]}>Title</Text>
            <Text style={[styles.cell, styles.header]}>Amount</Text>
            <Text style={[styles.cell, styles.header]}>Payment status</Text>
            <Text style={[styles.cell, styles.header]}>Created Date</Text>
          </>
        ) : (
          <>
            <Text style={[styles.cell, styles.header]}>TO/Method</Text>
            <Text style={[styles.cell, styles.header]}>Amount</Text>
            <Text style={[styles.cell, styles.header]}>Memo/Notes</Text>
            <Text style={[styles.cell, styles.header]}>Account Type</Text>
            <Text style={[styles.cell, styles.header]}>Last Updated</Text>
          </>
        )}
      </View>

      {/* Table Rows */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.tableRow}>
            {activeTab === 'Receivable' ? (
              <>
                <Text style={styles.cell}>{item.title}</Text>
                <Text style={styles.cell}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.cell}>{item.status}</Text>
                <Text style={styles.cell}>{item.date}</Text>
              </>
            ) : (
              <>
                <Text style={styles.cell}>{item.method}</Text>
                <Text style={styles.cell}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.cell}>{item.memo}</Text>
                <Text style={styles.cell}>{item.accountType}</Text>
                <Text style={styles.cell}>{item.updatedAt}</Text>
              </>
            )}
          </View>
        )}
      />

      {/* Subtotal */}
      <Text style={styles.subtotalText}>
        Subtotal for Paid:{' '}
        <Text style={styles.subtotalAmount}>${subtotal.toFixed(2)}</Text>
      </Text>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Payable Job Expenses</Text>

            <TextInput
              placeholder="Select or add job method"
              value={jobMethod}
              onChangeText={setJobMethod}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Amount *"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Memo/notes *"
              value={memo}
              onChangeText={setMemo}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Select or add account type"
              value={accountType}
              onChangeText={setAccountType}
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  console.log({jobMethod, amount, memo, accountType});
                  setModalVisible(false);
                  // You can add the logic to update the list here
                }}>
                <Text style={styles.saveText}>Save Job Expenses</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeTab: {
    backgroundColor: '#007aff',
  },
  activeText: {
    color: '#fff',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  addRowButton: {
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addRowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  cell: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 4,
  },
  header: {
    fontWeight: 'bold',
  },
  subtotalText: {
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtotalAmount: {
    color: 'green',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelText: {
    color: '#007aff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AccountingTabScreen;
