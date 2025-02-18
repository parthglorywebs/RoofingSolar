import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {TextInput as PaperTextInput} from 'react-native-paper';
import {
  formatPhoneNumber,
  removePhoneNumberFormat,
} from '../../utils/phoneUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getLoginDetails} from '../../utils/AsyncStorage';
import Styling from '../../assets/styling/colors';
import axios from 'axios';
import config from '../../config/config';
import countryData from '../../assets/countries.json';
import Colors from '../../assets/styling/colors';
import {useNavigation} from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: '',
    address: '',
    contactNumber: '',
    zipCode: '',
    countryCode: countryData[0],
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState({
    name: '',
    address: '',
    contactNumber: '',
    zipCode: '',
  });

  const [searchText, setSearchText] = useState('');

  const filteredCountryData = useMemo(() => {
    if (searchText) {
      return countryData.filter(country =>
        country.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    return countryData;
  }, [searchText]);

  useEffect(() => {
    // console.log('value');

    setForm(prevForm => ({
      ...prevForm,
      contactNumber: formatPhoneNumber(''),
    }));
  }, ['']);

  useEffect(() => {
    fetchContractorProfile();
  }, []);

  const fetchContractorProfile = async () => {
    const {access_token, contractor_id} = await getLoginDetails();
    try {
      setLoading(true);
      const response = await axios.post(
        `${config.baseUrl}contractor/get-profile`,
        {
          contractor_id: contractor_id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;
      const profileImage = data.data.profile_image;

      setForm({
        name: data.data.name || '',
        address: data.data.address || '',
        contactNumber: data.data.contact_number
          ? formatPhoneNumber(data.data.contact_number)
          : '',
        zipCode: data.data.zip_code || '',
        countryCode:
          countryData.find(
            country => country.code === data.data.country_code,
          ) || countryData[0],
      });

      const imageUrl = profileImage
        ? `${config.profileImage}${profileImage}`
        : null;
      setSelectedImage(imageUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load contractor profile');
    }
  };

  const pickImage = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, response => {
      if (response.didCancel) return;
      if (response.errorMessage)
        return Alert.alert('Error', response.errorMessage);

      const uri = response.assets?.[0]?.uri;
      if (uri) setSelectedImage(uri);
    });
  };

  const handleCountrySelect = country => {
    setForm(prevForm => ({
      ...prevForm,
      countryCode: country,
    }));
    setIsModalVisible(false);
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleSearch = text => {
    setSearchText(text);
  };

  const handleSubmit = () => {
    const {name, address, contactNumber, zipCode} = form;
    const errors = {
      name: '',
      address: '',
      contactNumber: '',
      zipCode: '',
    };

    let isValid = true;

    if (!name) {
      errors.name = 'Name is required';
      isValid = false;
    }
    if (!address) {
      errors.address = 'Address is required';
      isValid = false;
    }
    if (!contactNumber) {
      errors.contactNumber = 'Contact Number is required';
      isValid = false;
    }
    if (!zipCode) {
      errors.zipCode = 'Zip Code is required';
      isValid = false;
    }

    setError(errors);

    if (!isValid) return;

    const plainContactNumber = removePhoneNumberFormat(contactNumber);

    Alert.alert(
      'Profile Submitted',
      `Your profile details have been saved with contact number: ${plainContactNumber}.`,
    );
  };

 

  const handleTextChange = (field, value) => {
    if (value.trim()) {
      setError(prevError => ({
        ...prevError,
        [field]: '',
      }));
    }

    handleInputChange(field, value);
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '',
    }));
  };

  const handleInputChange = (field, value) => {
    if (field === 'contactNumber') {
      const formattedValue = formatPhoneNumber(value);

      setForm(prevData => ({
        ...prevData,
        [field]: formattedValue,
      }));

      const isValid = validatePhoneNumber(formattedValue);
      setError(prevError => ({
        ...prevError,
        contactNumber: isValid
          ? ''
          : 'Invalid phone number. Format should be XXX-XXX-XXXX.',
      }));
    } else {
      setForm(prevData => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  const validatePhoneNumber = value => {
    const regex = /^\d{3}-\d{3}-\d{4}$/;
    return regex.test(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>View Profile</Text>
      <Text style={styles.subtitle}>Let’s know a little more about you...</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Styling.primary} />
      ) : (
        <>
          <PaperTextInput
            style={[styles.textInput, error.name && styles.errorInput]}
            label="Name*"
            value={form.name}
            onChangeText={value => handleTextChange('name', value)}
            mode="outlined"
            onFocus={() => handleFocus('name')}
            error={!!error.name}
          />
          {error.name ? <Text style={styles.errorText}>{error.name}</Text> : null}

          <PaperTextInput
            style={[styles.textInput, styles.disabledInput]}
            value="anil.test34@gmail.com"
            editable={false}
            mode="outlined"
          />

          <View style={styles.imageContainer}>
            {selectedImage ? (
              <View style={styles.imageBox}>
                <Image source={{ uri: selectedImage }} style={styles.image} />
                <TouchableOpacity
                  style={styles.closeIcon}
                  onPress={() => setSelectedImage(null)}>
                  <Text style={styles.closeText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.dottedBox} onPress={pickImage}>
                <Text style={styles.dottedText}>Select Image (JPG or PNG)</Text>
              </TouchableOpacity>
            )}
          </View>

          <PaperTextInput
            style={[styles.textInput, error.address && styles.errorInput]}
            label="Address*"
            value={form.address}
            onChangeText={value => handleTextChange('address', value)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            mode="outlined"
            error={!!error.address}
            onFocus={() => handleFocus('address')}
          />
          {error.address ? (
            <Text style={styles.errorText}>{error.address}</Text>
          ) : null}

          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={styles.countryCodeContainer}
              onPress={() => setIsModalVisible(true)}>
              <Text style={styles.countryCodeText}>
                {form.countryCode.flag} {form.countryCode.code}
              </Text>
            </TouchableOpacity>

            <PaperTextInput
              style={[
                styles.textInput,
                styles.flex1,
                error.contactNumber && styles.errorInput,
              ]}
              label="Contact Number*"
              placeholder="XXX-XXX-XXXX"
              keyboardType="phone-pad"
              value={form.contactNumber}
              onChangeText={value => handleTextChange('contactNumber', value)}
              mode="outlined"
              error={!!error.contactNumber}
              onFocus={() => handleFocus('contactNumber')}
            />
          </View>
          {error.contactNumber ? (
            <Text style={styles.errorText}>{error.contactNumber}</Text>
          ) : null}

          <PaperTextInput
            style={[styles.textInput, error.zipCode && styles.errorInput]}
            label="Zip Code*"
            keyboardType="numeric"
            maxLength={6}
            value={form.zipCode}
            onChangeText={value => handleTextChange('zipCode', value)}
            mode="outlined"
            onFocus={() => handleFocus('zipCode')}
            error={!!error.zipCode}
          />
          {error.zipCode ? (
            <Text style={styles.errorText}>{error.zipCode}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Get Started</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PaperTextInput
              style={styles.searchInput}
              label="Search Country"
              value={searchText}
              onChangeText={handleSearch}
              mode="outlined"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.closeSearchIcon}
                onPress={handleClearSearch}>
                <Text style={styles.closeText}>X</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={filteredCountryData}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleCountrySelect(item)}>
                  <Text style={styles.modalItemText}>
                    {item.flag} {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.code}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    marginBottom: 16,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    width: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dottedBox: {
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedText: {
    fontSize: 14,
    color: '#999',
  },
  imageBox: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  closeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Styling.primary,
    paddingVertical: 14,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 10,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flex1: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 10,
    fontSize: 16,
  },

  closeSearchIcon: {
    position: 'absolute',
    top: 38,
    right: 30,
    backgroundColor: Colors.primary,
    width: 25,
    height: 25,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 16,
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Profile;
