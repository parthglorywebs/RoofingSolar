import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';
import moment from 'moment';

const FolderList = ({ selectedFolders = [], documents = [] }) => {
  const [expandedFolder, setExpandedFolder] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const toggleCollapse = folderName => {
    setExpandedFolder(prevState => (prevState === folderName ? null : folderName));
  };

  const filteredDocuments = useMemo(() => {
    const memoizedFilter = (folder) => documents.filter(doc => doc.folder === folder);
    return memoizedFilter;
  }, [documents]);

  useEffect(() => {
    // Optional logging for debugging
    // console.log('Selected Folders:', selectedFolders);
    // console.log('Documents:', documents);
  }, [selectedFolders, documents]);

  const renderDocumentItem = (item) => (
    <View key={item.name} style={styles.folderCard}>
      <View style={styles.documentDetails}>
        <Text style={styles.label}>Document Name:</Text>
        <Text style={styles.value}>{item.name}</Text>
      </View>

      <View style={styles.documentDetails}>
        <Text style={styles.label}>File Type:</Text>
        <Text style={styles.value}>
          {item.file ? item.file.split('/').pop() : ''}
        </Text>
      </View>

      <View style={styles.documentDetails}>
        <Text style={styles.label}>Uploaded By:</Text>
        <Text style={styles.value}>{item.uploaded_by}</Text>
      </View>

      <View style={styles.documentDetails}>
        <Text style={styles.label}>Last Updated:</Text>
        <Text style={styles.value}>
          {moment(item.updatedAt).format('DD/MM/YYYY h:mm A')}
        </Text>
      </View>
    </View>
  );

  const renderFolderItem = ({ item: folder }) => {
    const isCollapsed = expandedFolder !== folder.value;
    const documentsInFolder = filteredDocuments(folder.value);

    return (
      <View key={folder.value}>
        <TouchableOpacity
          onPress={() => toggleCollapse(folder.value)}
          style={styles.header}>
          <Text style={styles.text}>
            {`${folder.value} (${documentsInFolder.length})`}
          </Text>
          <MaterialCommunityIcons
            name={
              !isCollapsed ? 'chevron-up' : 'chevron-right'
            }
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>

        <Collapsible collapsed={isCollapsed}>
          <View>
            {documentsInFolder.map(item => renderDocumentItem(item))}
          </View>
        </Collapsible>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {selectedFolders.length === 0 ? (
        <Text style={styles.noFoldersText}>No folders to display.</Text>
      ) : (
        selectedFolders.map(folder => (
          renderFolderItem({ item: folder })
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    marginVertical: 5,
  },
  noFoldersText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white
  },
  folderCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    flexDirection: 'column',
    marginBottom: 5,
  },
  documentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingVertical: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
  },
});

export default FolderList;