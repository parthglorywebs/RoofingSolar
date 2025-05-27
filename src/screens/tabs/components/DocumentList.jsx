import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Colors from '../../../assets/styling/colors';
import moment from 'moment';
import config from '../../../config/config';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'; // If using runtime permissions
import {Linking} from 'react-native'; // Import Linking

const DocumentList = ({
  documents,
  onDownload,
  onDelete,
  selectedJob,
  contractorId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [previewingDocumentId, setPreviewingDocumentId] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Helper function to get MIME type based on file extension
  const getMimeType = fileExtension => {
    switch (fileExtension?.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream'; // Default MIME type
    }
  };

  // Helper function to get the last segment after the final `/`
  const extractFilename = filePath => {
    const parts = filePath.split('/');
    return parts.pop();
  };

  const openModal = async document => {
    setPreviewingDocumentId(document.id); // Start loading for this document
    setSelectedDocument(document); // Set the selected document
    setImageModalVisible(false); // Ensure image modal is closed

    if (
      document.type &&
      (document.type.toLowerCase() === 'png' ||
        document.type.toLowerCase() === 'jpg' ||
        document.type.toLowerCase() === 'jpeg')
    ) {
      setImageModalVisible(true);
      setPreviewingDocumentId(null); // Stop loading
    } else {
      const fileUrl = `${config.profileImage}storage/${document.file}`;
      const fileName = extractFilename(document.file) || 'unknown_file'; // Use helper function
      const localFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      try {
        const fileExists = await RNFS.exists(localFilePath);

        if (fileExists) {
          try {
            const mimeType = getMimeType(document.type);
            if (Platform.OS === 'android') {
              await FileViewer.open(localFilePath, {
                showOpenWithDialog: true,
                mimeType: mimeType, // Specify MIME type
              });
            } else {
              await FileViewer.open(localFilePath, {showOpenWithDialog: true});
            }
          } catch (fileViewerError) {
            console.error('FileViewer error:', fileViewerError);
            Alert.alert(
              'Error',
              `Could not open file: ${fileViewerError.message}`,
            );
          }
        } else {
          // console.log('Downloading file from:', fileUrl, 'to', localFilePath);
          const res = await RNFS.downloadFile({
            fromUrl: fileUrl,
            toFile: localFilePath,
          }).promise;

          if (res.statusCode === 200) {
            try {
              const mimeType = getMimeType(document.type);
              if (Platform.OS === 'android') {
                await FileViewer.open(localFilePath, {
                  showOpenWithDialog: true,
                  mimeType: mimeType, // Specify MIME type
                });
              } else {
                await FileViewer.open(localFilePath, {
                  showOpenWithDialog: true,
                });
              }
            } catch (fileViewerError) {
              console.error('FileViewer error:', fileViewerError);
              Alert.alert(
                'Error',
                `Could not open file: ${fileViewerError.message}`,
              );
            }
          } else {
            Alert.alert('Error', 'Could not preview file.');
          }
        }
      } catch (error) {
        console.error('File download error:', error);
        Alert.alert('Error', 'Could not preview file.');
      } finally {
        setPreviewingDocumentId(null); // Stop loading
      }
    }
  };

  const closeModal = () => {
    setImageModalVisible(false);
    setSelectedDocument(null);
    setPreviewingDocumentId(null);
  };

  const handleDownload = async document => {
    const fileUrl = `${config.s3BucketStorage}${document.file}`;
    const fileName = document.name || 'downloaded_file';
    const fileExtension = document.type ? `.${document.type}` : '.jpg';
    const fullFileName = `${fileName}${fileExtension}`;

    let downloadPath;

    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to download files.',
        },
      );

      if (hasPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        // Alert.alert('Permission Denied', 'Storage permission is required to download files.');
        // return;
      }

      downloadPath = `${RNFS.DownloadDirectoryPath}/${fullFileName}`;
    } else {
      downloadPath = `${RNFS.DocumentDirectoryPath}/${fullFileName}`;
    }

    try {
      setIsDownloading(true); // Show modal
      setDownloadProgress(0); // Reset progress

      const downloadResult = RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: downloadPath,
        begin: () => {
          console.log('Download started...');
        },
        progress: res => {
          const percentage = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(percentage.toFixed(0));
        },
      });

      const res = await downloadResult.promise;

      setIsDownloading(false); // Hide modal after completion

      if (res.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to:\n${downloadPath}`);

        if (Platform.OS === 'ios') {
          Linking.openURL(`file://${downloadPath}`).catch(err =>
            Alert.alert('Error Opening File', err.message),
          );
        }
      } else {
        Alert.alert(
          'Download Failed',
          `Server returned status code ${res.statusCode}`,
        );
      }
    } catch (error) {
      setIsDownloading(false);
      console.warn('Download Error:', error);
      Alert.alert('Download Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : documents.length === 0 ? (
        <Text style={styles.text}>No documents to display.</Text>
      ) : (
        documents.map((document, index) => (
          <View key={index} style={styles.documentCard}>
            <View style={styles.documentDetails}>
              <Text style={styles.label}>Document Name:</Text>
              <Text style={styles.value}>{document.name}</Text>
            </View>

            <View style={styles.documentDetails}>
              <Text style={styles.label}>File Type:</Text>
              <TouchableOpacity
                onPress={() => openModal(document)}
                disabled={previewingDocumentId === document.id}>
                {previewingDocumentId === document.id ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.themeblue}
                    style={{marginLeft: 5}}
                  />
                ) : (
                  <Text style={[styles.value, {color: Colors.themeblue}]}>
                    {document.type}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.documentDetails}>
              <Text style={styles.label}>File Size:</Text>
              <Text style={styles.value}>{document.size}</Text>
            </View>

            <View style={styles.documentDetails}>
              <Text style={styles.label}>File Uploaded By:</Text>
              <Text style={styles.value}>{document.uploaded_by}</Text>
            </View>

            <View style={styles.documentDetails}>
              <Text style={styles.label}>Last Updated:</Text>
              <Text style={styles.value}>
                {moment(document.updatedAt).format('DD/MM/YYYY h:mm A')}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.downloadButton]}
                onPress={() => handleDownload(document)}>
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color="#fff"
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => onDelete(document)}
                disabled={document.created_by !== contractorId}>
                <MaterialCommunityIcons
                  name="delete"
                  size={20}
                  color="#fff"
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.buttonText,
                    document.created_by !== contractorId && {opacity: 0.6},
                  ]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {selectedDocument && imageModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalImageContainer}>
              {modalLoading && (
                <ActivityIndicator size="large" color={Colors.primary} />
              )}
              <Image
                source={{
                  uri: `${config.profileImage}storage/${selectedDocument.file}`,
                }}
                style={styles.modalImage}
                resizeMode="contain"
                onLoadStart={() => {
                  // console.log('on load start');
                  setModalLoading(true);
                }}
                onLoadEnd={() => {
                  // console.log('on load end');
                  setModalLoading(false);
                }}
                onError={() => {
                  // console.log('error');
                  setModalLoading(false);
                }}
              />
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={[styles.buttonText, {marginLeft: 0}]}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <Modal
        transparent={true}
        visible={isDownloading}
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Downloading...</Text>
            <Text style={styles.modalText}>{downloadProgress}%</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  documentCard: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  documentDetails: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: Colors.black,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalImageContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: 'red',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 200,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginVertical: 5,
  },
});

export default DocumentList;
