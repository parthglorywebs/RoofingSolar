import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Collapsible from 'react-native-collapsible';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../../assets/styling/colors';
import moment from 'moment';

const FolderList = ({selectedFolders = [], documents = []}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = folderName => {
    setIsCollapsed(prevState => (prevState === folderName ? null : folderName));
  };

  const filteredDocuments = folder =>
    documents.filter(doc => doc.folder === folder);

  useEffect(() => {
    // Log folders and documents to check their values (optional for debugging)
    // console.log('Selected Folders:', selectedFolders);
    // console.log('Documents:', documents);
  }, [selectedFolders, documents]);

  return (
    <View style={styles.container}>
      {selectedFolders.length === 0 ? (
        <Text style={styles.noFoldersText}>No folders to display.</Text>
      ) : (
        selectedFolders.map(folder => (
          <View key={folder.value}>
            <TouchableOpacity
              onPress={() => toggleCollapse(folder.value)}
              style={styles.header}>
              <Text style={styles.text}>
                {`${folder.value} (${filteredDocuments(folder.value).length})`}
              </Text>
              <MaterialCommunityIcons
                name={
                  isCollapsed === folder.value ? 'chevron-up' : 'chevron-right'
                }
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>

            <Collapsible collapsed={isCollapsed !== folder.value}>
              <FlatList
                data={filteredDocuments(folder.value)}
                keyExtractor={item => item.name}
                renderItem={({item}) => (
                  <View style={styles.folderCard}>
                    <View style={styles.documentDetails}>
                      <Text style={styles.label}>Document Name:</Text>
                      <Text style={styles.value}>{item.name}</Text>
                    </View>

                    <View style={styles.documentDetails}>
                      <Text style={styles.label}>File Type:</Text>
                      <Text style={styles.value}>
                        {item.file.split('/').pop()}
                      </Text>
                    </View>

                    <View style={styles.documentDetails}>
                      <Text style={styles.label}>Uploaded By:</Text>
                      {/* <Text style={styles.value}>{item.folder}</Text> */}
                      <Text style={styles.value}>{item.uploaded_by}</Text>
                    </View>

                    <View style={styles.documentDetails}>
                      <Text style={styles.label}>Last Updated:</Text>
                      {/* <Text style={styles.value}>{item.updatedAt}</Text> */}
                      <Text style={styles.value}>
                        {moment(item.updatedAt).format('DD/MM/YYYY h:mm A')}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </Collapsible>
          </View>
        ))
      )}
    </View>
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
    // marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    flexDirection: 'column',
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
