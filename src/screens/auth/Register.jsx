import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TouchableNativeFeedback,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import StepIndicator from 'react-native-step-indicator';
import {launchImageLibrary} from 'react-native-image-picker';
import Colors from '../../assets/styling/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput as PaperTextInput} from 'react-native-paper';

const customStyles = {
  stepIndicatorSize: 25,
  currentStepIndicatorSize: 30,
  separatorStrokeWidth: 2,
  currentStepStrokeWidth: 3,
  stepStrokeCurrentColor: Colors.primary,
  stepStrokeWidth: 3,
  stepStrokeFinishedColor: Colors.primary,
  stepStrokeUnFinishedColor: '#aaaaaa',
  separatorFinishedColor: Colors.primary,
  separatorUnFinishedColor: '#aaaaaa',
  stepIndicatorFinishedColor: Colors.primary,
  stepIndicatorUnFinishedColor: '#ffffff',
  stepIndicatorCurrentColor: '#ffffff',
  stepIndicatorLabelFontSize: 13,
  currentStepIndicatorLabelFontSize: 13,
  stepIndicatorLabelCurrentColor: Colors.primary,
  stepIndicatorLabelFinishedColor: '#ffffff',
  stepIndicatorLabelUnFinishedColor: '#aaaaaa',
  labelColor: '#999999',
  labelSize: 13,
  currentStepLabelColor: Colors.primary,
};

const Register = ({navigation}) => {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [nextClicked, setNextClicked] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    companyName: '',
    contactNumber: '',
    zipCode: '',
    profilePicture: null,
  });
  const [error, setError] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    companyName: '',
    contactNumber: '',
    zipCode: '',
  });

  const handleNext = () => {
    // if (validateForm()) {

    // }
    if (currentPosition < 1) {
      setNextClicked(true);
      setCurrentPosition(currentPosition + 1);
    } else {
      const {name, email, password, confirmPassword, address, companyName, contactNumber, zipCode} = form;
      const errors = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        companyName: '',
        contactNumber: '',
        zipCode: ''
      };

      let isValid = true;

      if (!name) {
        errors.name = 'Name is required';
        isValid = false;
      }

      if (!email) {
        errors.email = 'Email is required';
        isValid = false;
      }

      if (!password) {
        errors.password = 'New Password is required';
        isValid = false;
      }

      if (!confirmPassword) {
        errors.confirmPassword = 'Confirm Password is required';
        isValid = false;
      }

      if (!address) {
        errors.address = 'Address is required';
        isValid = false;
      }

      if (!companyName) {
        errors.companyName = 'Company Name is required';
        isValid = false;
      }

      if (!contactNumber) {
        errors.contactNumber = 'Contact Number is required';
        isValid = false;
      }

      if (!zipCode) {
        errors.zipCode = 'ZipCode is required';
        isValid = false;
      }

      setError(errors);

      if (!isValid) return;

      // console.log(form);
      // navigation.navigate('NextStepScreen');
    }
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '',
    }));
  };

  const handleBack = () => {
    if (currentPosition > 0) {
      setCurrentPosition(currentPosition - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleImageUpload = () => {
    launchImageLibrary({}, response => {
      if (response.assets) {
        setForm(prevData => ({
          ...prevData,
          profilePicture: response.assets[0].uri,
        }));
      }
    });
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
        contactNumber: isValid ? '' : 'Invalid phone number. Format should be XXX-XXX-XXXX.',
      }));
    } else {
      setForm(prevData => ({
        ...prevData,
        [field]: value,
      }));
    }
  };
  
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
  
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const formatted = `${match[1]}${match[2] ? '-' + match[2] : ''}${match[3] ? '-' + match[3] : ''}`;
      return formatted;
    }
  
    return cleaned;
  };

  
  const validatePhoneNumber = (value) => {
    const regex = /^\d{3}-\d{3}-\d{4}$/;
    return regex.test(value);
  };

  const handleRemoveImage = () => {
    setForm(prevData => ({
      ...prevData,
      profilePicture: null,
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {nextClicked && currentPosition === 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
      )}

      <StepIndicator
        customStyles={customStyles}
        currentPosition={currentPosition}
        labels={['Step 1', 'Step 2']}
        stepCount={2}
      />

      {currentPosition === 0 ? (
        <View style={styles.content}>
          <Text style={styles.title}>Let us know</Text>
          <Text style={styles.subtitle}>
            Step {currentPosition + 1} out of 2
          </Text>
          <Text style={styles.description}>
            Let’s know a little more about you...
          </Text>

          <View style={styles.checkboxContainer}>
            <TouchableNativeFeedback
              onPress={() => setSelectedRole('Customer')}>
              <View style={styles.checkboxWrapper}>
                <CheckBox
                  value={selectedRole === 'Customer'}
                  onValueChange={() => setSelectedRole('Customer')}
                />

                <Text style={styles.checkboxLabel}>Customer</Text>
              </View>
            </TouchableNativeFeedback>

            <TouchableNativeFeedback
              onPress={() => setSelectedRole('Contractor')}>
              <View style={styles.checkboxWrapper}>
                <CheckBox
                  value={selectedRole === 'Contractor'}
                  onValueChange={() => setSelectedRole('Contractor')}
                />
                <Text style={styles.checkboxLabel}>Contractor</Text>
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Let us know</Text>
          <Text style={styles.subtitle}>
            Step {currentPosition + 1} out of 2
          </Text>
          <Text style={styles.description}>
            Please provide the following details:
          </Text>

          <PaperTextInput
            style={[styles.textInput, error.name && styles.errorInput]}
            label="Name*"
            value={form.name}
            onChangeText={value => handleTextChange('name', value)}
            mode="outlined"
            onFocus={() => handleFocus('name')}
            error={!!error.name}
          />
          {error.name ? (
            <Text style={styles.errorText}>{error.name}</Text>
          ) : null}

          <PaperTextInput
            style={styles.input}
            label="Email*"
            mode="outlined"
            value={form.email}
            onChangeText={text => handleInputChange('email', text)}
            onFocus={() => handleFocus('email')}
            error={!!error.email}
          />
          {error.email ? (
            <Text style={styles.errorText}>{error.email}</Text>
          ) : null}

          <PaperTextInput
            style={styles.input}
            label="Enter new password*"
            mode="outlined"
            secureTextEntry
            value={form.password}
            onChangeText={text => handleInputChange('password', text)}
            onFocus={() => handleFocus('password')}
            error={!!error.password}
          />
          {error.password ? (
            <Text style={styles.errorText}>{error.password}</Text>
          ) : null}

          <PaperTextInput
            style={styles.input}
            label="Confirm new password*"
            mode="outlined"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={text => handleInputChange('confirmPassword', text)}
            onFocus={() => handleFocus('confirmPassword')}
            error={!!error.confirmPassword}
          />
          {error.confirmPassword ? (
            <Text style={styles.errorText}>{error.confirmPassword}</Text>
          ) : null}

          {form.profilePicture && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{uri: form.profilePicture}}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={handleRemoveImage}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImageUpload}>
            <Text style={styles.uploadButtonText}>
              {form.profilePicture ? 'Image Selected' : 'Upload your picture'}
            </Text>
          </TouchableOpacity>

          <PaperTextInput
            style={[styles.input, styles.textArea]}
            label="Address"
            multiline
            numberOfLines={3}
            mode="outlined"
            value={form.address}
            onChangeText={text => handleInputChange('address', text)}
            onFocus={() => handleFocus('address')}
            error={!!error.address}
          />
          {error.address ? (
            <Text style={styles.errorText}>{error.address}</Text>
          ) : null}

          {selectedRole === 'Contractor' && (
            <>
              <PaperTextInput
                style={styles.input}
                label="Company Name*"
                mode="outlined"
                value={form.companyName}
                onChangeText={text => handleInputChange('companyName', text)}
                onFocus={() => handleFocus('companyName')}
                error={!!error.companyName}
              />
              {error.companyName ? (
                <Text style={styles.errorText}>{error.companyName}</Text>
              ) : null}

            <PaperTextInput
              style={styles.input}
              label="Contact number"
              mode="outlined"
              value={form.contactNumber}
              onChangeText={text => handleInputChange('contactNumber', text)}
              onFocus={() => handleFocus('contactNumber')}
              error={!!error.contactNumber}
            />
            {error.contactNumber ? (
              <Text style={styles.errorText}>{error.contactNumber}</Text>
            ) : null}

              <PaperTextInput
                style={styles.input}
                label="Zip code"
                mode="outlined"
                value={form.zipCode}
                onChangeText={text => handleInputChange('zipCode', text)}
                onFocus={() => handleFocus('zipCode')}
                error={!!error.zipCode}
              />
              {error.zipCode ? (
                <Text style={styles.errorText}>{error.zipCode}</Text>
              ) : null}
            </>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentPosition === 0 ? 'Next' : 'Get started'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.white,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.black,
  },
  content: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.shipgray,
    textAlign: 'center',
    marginVertical: 5,
  },
  description: {
    fontSize: 16,
    color: Colors.shipgray,
    textAlign: 'center',
    marginVertical: 10,
  },
  checkboxContainer: {
    marginTop: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  input: {
    marginBottom: 15,
    fontSize: 16,
  },
  textInput: {
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 20,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 15,
    alignSelf: 'center',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: Colors.red,
    borderRadius: 50,
    padding: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    width: '100%',
  },
});

export default Register;
