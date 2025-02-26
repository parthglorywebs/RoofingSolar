import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentList from '../components/DocumentList';
import FolderList from '../components/FolderList';
import FileViewer from 'react-native-file-viewer';
import DocumentPicker, {types} from 'react-native-document-picker';
import {Dropdown} from 'react-native-element-dropdown';
import Colors from '../../../assets/styling/colors';
import {getLoginDetails} from '../../../utils/AsyncStorage';
import axios from 'axios';
import config from '../../../config/config';

function DocumentsTabs({selectedJob}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Unified loading state
  const [apiError, setApiError] = useState(null);
  const [newDocumentAdded, setNewDocumentAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('Document List');
  const [contractorId, setContractorId] = useState(null);

  const [folders, setFolders] = useState([
    {
      label: '360 Contract & Checklist (0)',
      value: '360 Contract & Checklist',
      count: 0,
      id: 1,
    },
    {label: '360 Estimates (0)', value: '360 Estimates', count: 0, id: 2},
    {label: 'AppConnections (0)', value: 'AppConnections', count: 0, id: 3},
    {
      label: 'Certificate of Completion (0)',
      value: 'Certificate of Completion',
      count: 0,
      id: 4,
    },
    {label: 'Contingency Form (0)', value: 'Contingency Form', count: 0, id: 5},
    {label: 'Email Documents (0)', value: 'Email Documents', count: 0, id: 6},
    {label: 'Insurance Scope (0)', value: 'Insurance Scope', count: 0, id: 7},
    {label: 'Invoice (0)', value: 'Invoice', count: 0, id: 8},
    {label: 'Labor Worksheets (0)', value: 'Labor Worksheets', count: 0, id: 9},
    {
      label: 'Material Receipts (0)',
      value: 'Material Receipts',
      count: 0,
      id: 10,
    },
    {label: 'Mortgage Docs (0)', value: 'Mortgage Docs', count: 0, id: 11},
    {label: 'Other (0)', value: 'Other', count: 0, id: 12},
    {label: 'Permit (0)', value: 'Permit', count: 0, id: 13},
    {
      label: 'Return Material Receipts (0)',
      value: 'Return Material Receipts',
      count: 0,
      id: 14,
    },
    {label: 'Roof Report (0)', value: 'Roof Report', count: 0, id: 15},
    {
      label: 'Sub Contractor Bids/Estimates (0)',
      value: 'Sub Contractor Bids/Estimates',
      count: 0,
      id: 16,
    },
    {
      label: 'Sub Contractor Invoices (0)',
      value: 'Sub Contractor Invoices',
      count: 0,
      id: 17,
    },
    {
      label: 'Warranty & Certificate (0)',
      value: 'Warranty & Certificate',
      count: 0,
      id: 18,
    },
  ]);
  useEffect(() => {
    const fetchInitialData = async () => {
      const {contractor_id} = await getLoginDetails();
      setContractorId(contractor_id);
      await fetchDocumentList();
    };
    fetchInitialData();
  }, [fetchDocumentList, selectedJob]);

  const fetchDocumentList = useCallback(async () => {
    setIsLoading(true); // Set loading to true
    setApiError(null);
    const {access_token, contractor_id} = await getLoginDetails();
    try {
      const response = await axios.post(
        `${config.baseUrl}contractor/get-document-listing`,
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
      // console.log('Raw API document:', contractor_id, selectedJob.id);

      if (data && data.data && data.data.success !== false) {
        const formattedDocuments = data.data.file_listing.map(file => ({
          name: file.file_name,
          folder:
            folders.find(
              f =>
                f.value.toLowerCase() ===
                data.data.folder_wise_listing
                  .find(f =>
                    f.files.find(item => item.file_id === file.file_id),
                  )
                  .category_name.toLowerCase(),
            )?.value || 'Other',
          file: file.file_path,
          uploaded_by: file.uploaded_by_name,
          updatedAt: file.last_updated,
          size: file.file_size,
          type: file.file_type,
          fileId: file.file_id,
          created_by: file.created_by,
          uploaded_by: file.uploaded_by,
          last_updated: file.last_updated,
          folder_id: folders.find(
            f =>
              f.value.toLowerCase() ===
              data.data.folder_wise_listing
                .find(f => f.files.find(item => item.file_id === file.file_id))
                .category_name.toLowerCase(),
          )?.id,
        }));

        setDocuments(formattedDocuments);

        setFolders(prevFolders =>
          prevFolders.map(folder => ({
            ...folder,
            count:
              data.data.folder_wise_listing.find(
                f => f.category_name === folder.value,
              )?.files?.length || 0,
            label: `${folder.value} (${
              data.data.folder_wise_listing.find(
                f => f.category_name === folder.value,
              )?.files?.length || 0
            })`,
          })),
        );
      } else if (data && data.data && data.data.success === false) {
        // Handle the case where "Project not found" or similar API error
        setApiError(data.data.message || 'Failed to load project data.');
        setDocuments([]); // Clear documents if any were previously set
        setFolders(prevFolders =>
          prevFolders.map(folder => ({
            ...folder,
            count: 0,
            label: `${folder.value} (0)`,
          })),
        );
      } else {
        console.error('Invalid data format received from API:', data);
        setApiError('Failed to load project data due to invalid data.');
        Alert.alert('Error', 'Failed to load project data.');
      }
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      setApiError('Failed to load documents.');
      Alert.alert('Error', 'Failed to load documents.');
    } finally {
      setIsLoading(false); // Set loading to false
    }
  }, [selectedJob, folders]);

  const selectedFolders = folders.filter(folder =>
    documents.some(doc => doc.folder === folder.value),
  );

  const handleSaveDocument = async () => {
    if (!selectedFolder) {
      setError('Please select a folder.');
      return;
    }

    if (!filePreview) {
      setError('Please select a file.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const {access_token, contractor_id} = await getLoginDetails();
      const formData = new FormData();
      formData.append('contractor_id', contractor_id);
      formData.append('project_id', selectedJob.id);
      formData.append(
        'folder_id',
        folders.find(f => f.value === selectedFolder).id,
      );

      // Extract name from file path.
      const fileName = filePreview.split('/').pop();
      formData.append('document_file', {
        uri: filePreview,
        type: 'multipart/form-data',
        name: fileName,
      });

      const response = await axios.post(
        `${config.baseUrl}contractor/add-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const data = response.data;

      if (data && data.success) {
        Alert.alert('Success!', 'Document uploaded successfully!');
        setModalVisible(false);
        setFilePreview('');
        setError(null);
        fetchDocumentList(); // Refresh the document list
      } else if (data && data.errors && data.errors.document_file) {
        setError(data.errors.document_file[0]);
        Alert.alert('Error', data.errors.document_file[0]);
      } else {
        setError(data.message || 'Failed to upload document.');
        Alert.alert('Error', data.message || 'Failed to upload document.');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Error uploading document.');
      Alert.alert('Error', 'Error uploading document.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const [res] = await DocumentPicker.pick({
        type: [types.pdf, types.docx, types.images],
      });
      setFilePreview(res.uri);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('DocumentPicker Error:', err);
        Alert.alert('Error', 'Failed to pick document.');
      }
    }
  };

  const previewFile = async uri => {
    try {
      await FileViewer.open(uri);
    } catch (error) {
      Alert.alert('Error', 'Unable to open the file.');
    }
  };

  const handleDownloadDocument = docdownload => {
    // console.log(config.baseUrl + docdownload.file);
  };

  const handleDeleteDocument = async documentToDelete => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${documentToDelete.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const {access_token, contractor_id} = await getLoginDetails();

              const fileToDelete = documents.find(
                doc => doc.name === documentToDelete.name,
              );

              if (!fileToDelete) {
                Alert.alert(
                  'Error',
                  'Could not find file locally. Please try again.',
                );
                return;
              }

              const requestBody = {
                contractor_id: contractor_id,
                project_id: selectedJob.id,
                folder_id: fileToDelete.folder_id,
                file_id: fileToDelete.fileId,
              };

              const response = await axios.post(
                `${config.baseUrl}contractor/delete-document`,
                requestBody,
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                },
              );
              const data = response.data;

              if (data && data.success && data.data.success) {
                setDocuments(prevDocuments =>
                  prevDocuments.filter(
                    doc => doc.fileId !== fileToDelete.fileId,
                  ),
                );

                setFolders(prevFolders =>
                  prevFolders.map(folder => {
                    if (folder.id === fileToDelete.folder_id) {
                      return {
                        ...folder,
                        count: folder.count - 1,
                        label: `${folder.value} (${folder.count - 1})`,
                      };
                    }
                    return folder;
                  }),
                );

                Alert.alert(
                  'Deleted',
                  'The document was successfully deleted.',
                );
                // fetchDocumentList(); // Sync with backend
              } else {
                Alert.alert(
                  'Error',
                  data.message || 'Failed to delete the document.',
                );
              }
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete the document.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleTabPress = tabName => {
    setActiveTab(tabName);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{''}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{marginTop: '50%'}}
        />
      ) : apiError ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 16, color: 'red', textAlign: 'center'}}>
            {apiError}
          </Text>
        </View>
      ) : documents.length === 0 ? ( // Check for empty documents
        <View style={styles.noDocumentsContainer}>
          {/* <Text style={styles.noDocumentsText}>No documents</Text> */}
        </View>
      ) : (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Document List' && styles.activeTabButton,
            ]}
            onPress={() => handleTabPress('Document List')}>
            <Icon
              name={'file-document'}
              size={18}
              color={
                activeTab === 'Document List'
                  ? Colors.primary
                  : Colors.noneFocus
              }
              style={{marginRight: 5}}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'Document List' && styles.activeTabText,
              ]}>
              Document List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Folder List' && styles.activeTabButton,
            ]}
            onPress={() => handleTabPress('Folder List')}>
            <Icon
              name={'folder'}
              size={18}
              color={
                activeTab === 'Folder List' ? Colors.primary : Colors.noneFocus
              }
              style={{marginRight: 5}}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'Folder List' && styles.activeTabText,
              ]}>
              Folder List
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Document List' && (
        <DocumentList
          documents={documents}
          onDelete={handleDeleteDocument}
          onDownload={handleDownloadDocument}
          loading={isLoading} // Use isLoading state
          baseUrl={config.profileImage}
          selectedJob={selectedJob}
          contractorId={contractorId}
        />
      )}

      {activeTab === 'Folder List' && (
        <FolderList selectedFolders={selectedFolders} documents={documents} />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Documents</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Document</Text>

            <Dropdown
              style={[
                styles.selectButtonStyle,
                error && !selectedFolder && styles.errorInput,
              ]}
              placeholderStyle={styles.selectText}
              selectedTextStyle={styles.selectText}
              data={folders}
              labelField="label"
              valueField="value"
              placeholder={selectedFolder ? selectedFolder : 'Select Folder'}
              value={selectedFolder}
              onChange={item => setSelectedFolder(item.value)}
            />

            <TouchableOpacity
              style={styles.chooseFileButton}
              onPress={pickDocument}>
              <Text style={styles.chooseFileButtonText}>Choose File</Text>
            </TouchableOpacity>

            {filePreview ? (
              <View style={styles.filePreviewContainer}>
                {filePreview.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <Image
                    source={{uri: filePreview}}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                ) : (
                  <TouchableOpacity onPress={() => previewFile(filePreview)}>
                    <Text style={styles.fileTypeText}>
                      Preview File: {filePreview.split('.').pop().toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveDocument}>
              {isLoading ? ( // Use isLoading for modal button
                <ActivityIndicator color={'white'} />
              ) : (
                <Text style={styles.saveButtonText}>Save Document</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  description: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    padding: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 5,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },

  selectButtonStyle: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingStart: 10,
  },
  selectText: {
    color: '#333',
    fontSize: 14,
  },
  chooseFileButton: {
    backgroundColor: Colors.noneFocus,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  chooseFileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filePreview: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  filePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fileTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  noDocumentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDocumentsText: {
    fontSize: 18,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: Colors.noneFocus,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default DocumentsTabs;
