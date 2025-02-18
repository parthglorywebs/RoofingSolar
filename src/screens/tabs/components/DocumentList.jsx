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
} from 'react-native';
import Colors from '../../../assets/styling/colors';
import moment from 'moment';
import config from '../../../config/config';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'; // If using runtime permissions
import { Linking } from 'react-native'; // Import Linking


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
  const extractFilename = (filePath) => {
    const parts = filePath.split('/');
    return parts.pop();
  };

  const openModal = async document => {
    setModalLoading(true);
    setSelectedDocument(document);
    setPreviewingDocumentId(document.id);

    if (
      document.type &&
      (document.type.toLowerCase() === 'png' ||
        document.type.toLowerCase() === 'jpg' ||
        document.type.toLowerCase() === 'jpeg')
    ) {
      setImageModalVisible(true);
      setModalLoading(false);
      setPreviewingDocumentId(null);
    } else {
      const fileUrl = `${config.profileImage}${document.file}`;
      const fileName = extractFilename(document.file) || 'unknown_file'; // Use helper function
      const localFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // console.log('File URL:', fileUrl);
      // console.log('Local File Path:', localFilePath);

      try {
        const fileExists = await RNFS.exists(localFilePath);
        // console.log('File Exists:', fileExists);

        if (fileExists) {
          // console.log('Opening existing file:', localFilePath);
          try {
              const mimeType = getMimeType(document.type);
              if (Platform.OS === 'android') {

                await FileViewer.open(localFilePath, {
                  showOpenWithDialog: true,
                  mimeType: mimeType, // Specify MIME type
                });
              } else {
                await FileViewer.open(localFilePath, { showOpenWithDialog: true });
              }
            setModalLoading(false);
          } catch (fileViewerError) {
            console.error('FileViewer error:', fileViewerError);
            Alert.alert(
              'Error',
              `Could not open file: ${fileViewerError.message}`,
            );
            setModalLoading(false);
          }
        } else {
          // console.log('Downloading file from:', fileUrl, 'to', localFilePath);
          const res = await RNFS.downloadFile({
            fromUrl: fileUrl,
            toFile: localFilePath,
          }).promise;

          // console.log('Download Status Code:', res.statusCode);

          if (res.statusCode === 200) {
            // console.log('Opening downloaded file:', localFilePath);
            try {
              const mimeType = getMimeType(document.type);
              if (Platform.OS === 'android') {

                await FileViewer.open(localFilePath, {
                  showOpenWithDialog: true,
                  mimeType: mimeType, // Specify MIME type
                });
              } else {
                await FileViewer.open(localFilePath, { showOpenWithDialog: true });
              }
              setModalLoading(false);
            } catch (fileViewerError) {
              console.error('FileViewer error:', fileViewerError);
              Alert.alert(
                'Error',
                `Could not open file: ${fileViewerError.message}`,
              );
              setModalLoading(false);
            }
          } else {
            Alert.alert('Error', 'Could not preview file.');
            setModalLoading(false);
          }
        }
      } catch (error) {
        console.error('File download error:', error);
        Alert.alert('Error', 'Could not preview file.');
        setModalLoading(false);
      } finally {
        setPreviewingDocumentId(null);
      }
    }
  };

  const closeModal = () => {
    setImageModalVisible(false);
    setSelectedDocument(null);
    setPreviewingDocumentId(null);
  };

  const handleDownload = async document => {

    const fileUrl = `${config.profileImage}${document.file}`;
    const fileName = extractFilename(document.file) || 'unknown_file'; // Extract filename

    if (!fileName) {
        Alert.alert("Error", "Could not determine filename for download.");
        return;
    }

    const localFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    // console.log("Downloading from:", fileUrl);
    // console.log("Saving to:", localFilePath);
    try {
      const res = await RNFS.downloadFile({ fromUrl: fileUrl, toFile: localFilePath }).promise();

      if (res.statusCode === 200) {
        Alert.alert("Download Complete", `File saved to ${localFilePath}`);

        // Optionally open the directory (platform-specific)
        if (Platform.OS === 'android') {
          // On Android, you can't directly open the directory, but you can inform the user
          Alert.alert("Download Complete", `File saved to ${localFilePath}.  You may need to use a file explorer to view the file.`);
        } else if (Platform.OS === 'ios') {
          // iOS - You can attempt to open the file, though might be better to just show path
          Linking.openURL(`file://${localFilePath}`)
            .catch(err => Alert.alert("Error Opening File", err.message));
        }

      } else {
        Alert.alert("Download Failed", `Server returned status code ${res.statusCode}`);
      }
    } catch (error) {
      console.warn("Download Error:", error);
      Alert.alert("Download Error", error.message);
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
                onPress={() => handleDownload(document)}
                >
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
                  uri: `${config.profileImage}${selectedDocument.file}`,
                }}
                style={styles.modalImage}
                resizeMode="contain"
                onLoadStart={() => {
                  console.log('on load start');
                  setModalLoading(true);
                }}
                onLoadEnd={() => {
                  console.log('on load end');
                  setModalLoading(false);
                }}
                onError={() => {
                  console.log('error');
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
});

export default DocumentList;