import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  FlatList,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useColorScheme} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput as PaperTextInput, Menu, Divider} from 'react-native-paper';
import {Calendar} from 'react-native-calendars';
import Colors from '../../assets/styling/colors';
import config from '../../config/config';
import moment from 'moment';
import axios from 'axios';
import {getLoginDetails} from '../../utils/AsyncStorage';

const Dashboard = ({navigation}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('us');
  const [error, setError] = useState({
    projectNames: '',
    emails: '',
    contactnumbers: '',
    names: '',
  });

  const [searchText, setSearchText] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [filterIcon, setFilterIcon] = useState('filter');
  const [filterText, setFilterText] = useState('Filter');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [propertyData, setPropertyData] = useState([
    // { id: '1', name: 'Project 1', customerName: 'John Doe', email: 'john@example.com', phone: '123-456-7890', imageUrl: 'https://via.placeholder.com/150' },
    {id: 'add', name: 'New Project', imageUrl: null},
  ]);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#333' : '#fff',
  };

  const handleAddProject = async () => {
    // let hasError = false;
    // setIsLoading(true);

    // setError({
    //   projectNames: '',
    //   emails: '',
    //   contactnumbers: '',
    //   names: '',
    // });

    // const errors = {};
    // if (!projectName?.trim()) {
    //   errors.projectNames = 'Project name is required';
    // }

    // if (!email?.trim()) {
    //   errors.emails = 'Email is required';
    // } else if (!/\S+@\S+\.\S+/.test(email)) {
    //   errors.emails = 'Please enter a valid email address';
    // }

    // if (!contactNumber?.trim()) {
    //   errors.contactnumbers = 'Contact number is required';
    // } else if (!/^\d+$/.test(contactNumber)) {
    //   errors.contactnumbers = 'Contact number should only contain digits';
    // } else if (contactNumber.length < 10) {
    //   errors.contactnumbers = 'Contact number should be at least 10 digits';
    // }

    // if (!name?.trim()) {
    //   errors.names = 'Name is required';
    // }

    // if (Object.keys(errors).length > 0) {
    //   setError(errors);
    //   setIsLoading(false);
    //   return;
    // }

    // try {
    //   const {access_token, contractor_id} = await getLoginDetails();

    //   const response = await axios.post(
    //     `${config.baseUrl}contractor/create-project`,
    //     {
    //       contractor_id: contractor_id,
    //       projectname: projectName,
    //       email,
    //       contact_number: contactNumber,
    //       country_code: countryCode,
    //       name,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${access_token}`,
    //       },
    //     },
    //   );

    //   const data = response.data;

    //   if (data.success) {
    //     console.log('Project created successfully:', data);

    //     const newProject = {
    //       id: (propertyData.length + 1).toString(),
    //       name: projectName,
    //       email,
    //       phone: contactNumber,
    //       imageUrl: 'https://via.placeholder.com/150',
    //     };

    //     setPropertyData(prevData => [
    //       ...prevData.filter(item => item.id !== 'add'),
    //       newProject,
    //       {id: 'add', name: projectName, imageUrl: null},
    //     ]);

    //     // Reset form states
    //     setProjectName('');
    //     setEmail('');
    //     setContactNumber('');
    //     setName('');
    //     setModalVisible(false);

    //     Alert.alert('Success', data.message);
    //   } else {
    //     console.error('Unexpected success=false:', data.message);
    //     Alert.alert('Error', data.message || 'An unexpected error occurred.');
    //   }
    // } catch (error) {
    //   if (error.response?.status === 422) {
    //     const errorMessage = error.response.data.errors?.error;
    //     Alert.alert(
    //       'Validation Error',
    //       errorMessage || 'Project name already exists.',
    //     );
    //   } else {
    //     Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    //   }
    // } finally {
    //   setIsLoading(false);
    // }

    const newProject = {
      id: (propertyData.length + 1).toString(),
      name: projectName,
      email,
      phone: contactNumber,
      imageUrl: 'https://via.placeholder.com/150',
    };

    setPropertyData(prevData => [
      ...prevData.filter(item => item.id !== 'add'),
      newProject,
      {id: 'add', name: projectName, imageUrl: null},
    ]);

    

    // Reset form states
    setProjectName('');
    setEmail('');
    setContactNumber('');
    setName('');
    setModalVisible(false);
  };

  const handleSearchChange = text => {
    setSearchText(text);
  };

  const filteredData = propertyData.filter(item => {
    const lowercasedSearchText = searchText.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(lowercasedSearchText);
    const customerMatch = item.customerName
      ? item.customerName.toLowerCase().includes(lowercasedSearchText)
      : false;
    const emailMatch = item.email
      ? item.email.toLowerCase().includes(lowercasedSearchText)
      : false;
    const phoneMatch = item.phone
      ? item.phone.includes(lowercasedSearchText)
      : false;

    return nameMatch || customerMatch || emailMatch || phoneMatch;
  });

  const renderItem = ({item}) => {
    if (item.id === 'add') {
      return (
        <TouchableOpacity style={styles.propertyCard}>
          <Text style={styles.addNewText}>+</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.propertyCard}
          onPress={() => navigation.navigate('PropertyInfo', {property: item})}>
          <Image source={{uri: item.imageUrl}} style={styles.propertyImage} />
          <Text style={styles.propertyName}>{item.name}</Text>
        </TouchableOpacity>
      );
    }
  };

  // const handleFilterToggle = () => {
  //   setMenuVisible(!menuVisible);
  // };

  const handleFilterToggle = () => {
    if (filterText === 'Filter') {
      setMenuVisible(!menuVisible);
      setFilterText('Reset');
      setFilterIcon('vector-arrange-below');
    } else {
      setMenuVisible(false);
      setFilterText('Filter');
      setFilterIcon('filter');
    }
  };

  const handleRangeSelect = range => {
    let startDate, endDate;

    switch (range) {
      case 'Today':
        startDate = moment();
        endDate = moment();
        break;
      case 'Yesterday':
        startDate = moment().subtract(1, 'days');
        endDate = moment().subtract(1, 'days');
        break;
      case 'Last 7 Days':
        startDate = moment().subtract(6, 'days');
        endDate = moment();
        break;
      case 'Last 30 Days':
        startDate = moment().subtract(29, 'days');
        endDate = moment();
        break;
      case 'This Month':
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        break;
      case 'Last Month':
        startDate = moment().subtract(1, 'month').startOf('month');
        endDate = moment().subtract(1, 'month').endOf('month');
        break;
      case 'Custom Range':
        setShowCalendar(true);
        return;
      default:
        break;
    }

    if (startDate && endDate) {
      setSelectedRange({
        start: startDate.format('MMMM D, YYYY'),
        end: endDate.format('MMMM D, YYYY'),
      });
    }

    setMenuVisible(false);
  };

  const handleCustomRange = () => {
    setShowDateRange(true);
  };

  const handleDateSelect = date => {
    setSelectedDates(prevDates => {
      const newDates = {...prevDates};
      if (newDates[date]) {
        delete newDates[date];
      } else if (Object.keys(newDates).length < 2) {
        newDates[date] = {
          selected: true,
          selectedColor: 'blue',
          selectedTextColor: 'white',
        };
      }
      return newDates;
    });
    setShowCalendar(false);
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '',
    }));
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.headerContainer}>
        <View style={styles.searchInputContainer}>
          <PaperTextInput
            // style={styles.searchInput}
            style={[styles.searchInput, error && styles.errorInput]}
            placeholder="Search Project #, Customer Name, Email, Phone number"
            value={searchText}
            onChangeText={handleSearchChange}
            mode="outlined"
            // onFocus={() => handleFocus('notes')}
            // error={!!error.notes}
          />
          {searchText.trim() !== '' && (
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setSearchText('')}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addProjectButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.addProjectButtonText}>Add New Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subHeaderContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleFilterToggle}>
          <MaterialCommunityIcons name={filterIcon} size={24} color="black" />
          <Text style={styles.iconText}>{filterText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsGridView(!isGridView)}>
          <MaterialCommunityIcons
            name={isGridView ? 'view-grid' : 'view-list'}
            size={24}
            color="black"
          />
          <Text style={styles.iconText}>View</Text>
        </TouchableOpacity>
      </View>

      <Menu
        style={styles.menuStyle}
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={handleFilterToggle}>
            <Text>
              {selectedRange
                ? '   ' + `${selectedRange.start} - ${selectedRange.end}`
                : '   ' +
                  `${moment().format('MMMM D, YYYY')} - ${moment().format(
                    'MMMM D, YYYY',
                  )}`}
            </Text>
          </TouchableOpacity>
        }>
        <Menu.Item onPress={() => handleRangeSelect('Today')} title="Today" />
        <Menu.Item
          onPress={() => handleRangeSelect('Yesterday')}
          title="Yesterday"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last 7 Days')}
          title="Last 7 Days"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last 30 Days')}
          title="Last 30 Days"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('This Month')}
          title="This Month"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last Month')}
          title="Last Month"
        />
        <Menu.Item onPress={handleCustomRange} title="Custom Range" />
        <Divider />
        <Menu.Item onPress={() => setMenuVisible(false)} title="Cancel" />
      </Menu>

      {/* {showDateRange && (
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-range" size={24} color="black" />
            <Text style={styles.dateRangeText}>Selected Dates: </Text>
            {Object.keys(selectedDates).slice(0, 2).map((date, index) => (
              <Text key={index} style={styles.dateRangeText}>
                {date}
                {index < 1 && ', '}
              </Text>
            ))}
          </TouchableOpacity>
        </View>
      )} */}

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        numColumns={isGridView ? 2 : 1}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContainer}
        key={isGridView ? 'grid' : 'list'}
      />

      {showCalendar && (
        <Calendar
          markedDates={selectedDates}
          onDayPress={day => handleDateSelect(day.dateString)}
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalSubTitle}>Project Name*</Text>
            <PaperTextInput
              style={[styles.input, error.emails && styles.errorInput]}
              label="Enter your Project Name"
              placeholder="Enter your Project Name"
              keyboardType="default"
              value={projectName}
              mode="outlined"
              onFocus={() => handleFocus('projectNames')}
              onChangeText={text => {
                setProjectName(text);
                if (error.projectNames)
                  setError(prev => ({...prev, projectNames: ''}));
              }}
              error={!!error.projectNames}
            />
            {error.projectNames ? (
              <Text style={styles.errorText}>{error.projectNames}</Text>
            ) : null}

            <Text style={styles.modalSubTitle}>Email*</Text>
            <PaperTextInput
              style={[styles.input, error.emails && styles.errorInput]}
              label="Enter your Email Address"
              placeholder="Enter your Email Address"
              keyboardType="email-address"
              value={email}
              mode="outlined"
              autoCapitalize="none"
              onFocus={() => handleFocus('emails')}
              onChangeText={text => {
                setEmail(text);
                if (error.emails) setError(prev => ({...prev, emails: ''}));
              }}
              error={!!error.emails}
            />
            {error.emails ? (
              <Text style={styles.errorText}>{error.emails}</Text>
            ) : null}

            <Text style={styles.modalSubTitle}>Contact Number*</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity
                style={styles.countryCodeContainer}
                onPress={() => {}}>
                <Text style={styles.countryCodeText}>
                  {`🇺🇸`} {`US`}
                </Text>
              </TouchableOpacity>
              <PaperTextInput
                style={[
                  styles.inputContact,
                  error.contactnumbers && styles.errorInput,
                ]}
                label="Enter your Contact Number"
                placeholder="Enter your Contact Number"
                keyboardType="phone-pad"
                value={contactNumber}
                mode="outlined"
                autoCapitalize="none"
                onChangeText={text => {
                  const formattedText = text.replace(/[^0-9+]/g, '');
                  setContactNumber(formattedText);
                  if (error.contactnumbers) {
                    setError(prev => ({...prev, contactnumbers: ''}));
                  }
                }}
                error={!!error.contactnumbers}
                onFocus={() => handleFocus('contactnumbers')}
              />
            </View>
            {error.contactnumbers ? (
              <Text style={styles.errorText}>{error.contactnumbers}</Text>
            ) : null}

            <Text style={styles.modalSubTitle}>Name*</Text>
            <PaperTextInput
              style={[styles.input, error.names && styles.errorInput]}
              label="Enter your Name"
              placeholder="Enter your Name"
              keyboardType="default"
              value={name}
              mode="outlined"
              onFocus={() => handleFocus('names')}
              onChangeText={text => {
                setName(text);
                if (error.names) setError(prev => ({...prev, names: ''}));
              }}
              error={!!error.names}
            />
            {error.names ? (
              <Text style={styles.errorText}>{error.names}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddProject}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" /> // Show loading spinner
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuStyle: {
    top: '23%',
    marginVertical: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  subHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    marginEnd: 5,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    fontSize: 14,
    // paddingLeft: 10,
    // paddingRight: 10,
    // marginBottom: 10,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  iconText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addNewText: {
    fontSize: 24,
    textAlign: 'center',
    color: Colors.primary,
  },
  propertyCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  propertyImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  flatListContainer: {
    paddingBottom: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
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
    marginBottom: 20,
    color: '#333',
  },
  modalSubTitle: {
    marginVertical: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  closeText: {
    fontSize: 18,
    color: '#888',
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    marginEnd: 5,
  },
  addProjectButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProjectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContact: {
    marginBottom: 5,
    fontSize: 16,
    width: '75.5%',
  },
  input: {
    // marginBottom: 5,
    fontSize: 16,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 5,
    // marginBottom: 10,
  },
  countryCodeText: {
    fontSize: 16,
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
});

export default Dashboard;
