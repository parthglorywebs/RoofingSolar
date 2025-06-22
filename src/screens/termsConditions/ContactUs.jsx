import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert , Linking, Platform } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper'; 
import Styling from '../../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 

const ContactUs = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comments, setComments] = useState('');
  
  const [error, setError] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    comments: '',
  });

  const handleSubmit = () => {
    let isValid = true;
    const errors = {
      name: '',
      email: '',
      phone: '',
      address: '',
      comments: '',
    };

    // Validate the fields
    if (!name) {
      errors.name = 'Name is required';
      isValid = false;
    }
    if (!email) {
      errors.email = 'Email Address is required';
      isValid = false;
    }
    if (!phone) {
      errors.phone = 'Phone Number is required';
      isValid = false;
    }
    if (!address) {
      errors.address = 'Address is required';
      isValid = false;
    }
    if (!comments) {
      errors.comments = 'Comments are required';
      isValid = false;
    }

    setError(errors);

    if (!isValid) return;

    Alert.alert('Form Submitted', 'Your form has been successfully submitted!');
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setComments('');
    setError({
      name: '',
      email: '',
      phone: '',
      address: '',
      comments: '',
    });
  };

  const handleTextChange = (field, value) => {
    if (value.trim()) {
      setError(prevError => ({
        ...prevError,
        [field]: '',
      }));
    }

    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'address':
        setAddress(value);
        break;
      case 'comments':
        setComments(value);
        break;
      default:
        break;
    }
  };

  const onCall = () => {
    let phoneNumber = "8525625112";
    console.log('phone external', phoneNumber);

    if (Platform.OS !== 'android') {
      phoneNumber = `telprompt:${phoneNumber}`;
    } else {
      phoneNumber = `tel:${phoneNumber}`;
    }

    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Phone number is not available');
        } else {
          return Linking.openURL(phoneNumber);
        }
      })
      .catch((err) => console.log(err));
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contact Us</Text>

      <PaperTextInput
        style={[styles.input, error.name && styles.errorInput]}
        label="Name*"
        value={name}
        onChangeText={(text) => handleTextChange('name', text)}
        mode="outlined"
        error={!!error.name}
      />
      {error.name ? <Text style={styles.errorText}>{error.name}</Text> : null}

      <PaperTextInput
        style={[styles.input, error.email && styles.errorInput]}
        label="Email Address*"
        value={email}
        onChangeText={(text) => handleTextChange('email', text)}
        keyboardType="email-address"
        mode="outlined"
        error={!!error.email}
      />
      {error.email ? <Text style={styles.errorText}>{error.email}</Text> : null}

      <PaperTextInput
        style={[styles.input, error.phone && styles.errorInput]}
        label="Phone Number*"
        value={phone}
        onChangeText={(text) => handleTextChange('phone', text)}
        keyboardType="phone-pad"
        mode="outlined"
        error={!!error.phone}
      />
      {error.phone ? <Text style={styles.errorText}>{error.phone}</Text> : null}

      <PaperTextInput
        style={[styles.input, styles.multiLineInput, error.address && styles.errorInput]}
        label="Address*"
        value={address}
        onChangeText={(text) => handleTextChange('address', text)}
        multiline
        mode="outlined"
        error={!!error.address}
      />
      {error.address ? <Text style={styles.errorText}>{error.address}</Text> : null}

      <PaperTextInput
        style={[styles.input, styles.multiLineInput, error.comments && styles.errorInput]}
        label="Comments*"
        value={comments}
        onChangeText={(text) => handleTextChange('comments', text)}
        multiline
        mode="outlined"
        error={!!error.comments}
      />
      {error.comments ? <Text style={styles.errorText}>{error.comments}</Text> : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Problems or Suggestions</Text>
          <Text style={styles.cardContent}>Run into any problems?</Text>
          <Text style={styles.cardContent}>Click here to contact us directly</Text>
          {/* <Text style={styles.cardContent}>852 - 562 - 5112</Text>
          <Text style={styles.cardContent}>jon.doe4@gmail.com</Text> */}
          <TouchableOpacity onPress={onCall}>
            <View style={styles.contactContainer}>
              <MaterialCommunityIcons name="phone" size={20} color={Styling.primary} />
              <Text style={[styles.cardContent, styles.boldText]}>852 - 562 - 5112</Text>
            </View>
          </TouchableOpacity>
         
          <View style={styles.contactContainer}>
            <MaterialCommunityIcons name="email" size={20} color={Styling.primary} />
            <Text style={[styles.cardContent, styles.boldText]}>jon.doe4@gmail.com</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Social Media</Text>
          <Text style={styles.cardContent}>Tell your friends how DYOR made getting a new roof easy!</Text>
          
          <View style={styles.socialMediaContainer}>
            <TouchableOpacity style={styles.socialMediaButton}>
              <MaterialCommunityIcons name="twitter" size={30} color={Styling.twitter} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaButton}>
              <MaterialCommunityIcons name="facebook" size={30} color={Styling.facebook} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaButton}>
              <MaterialCommunityIcons name="instagram" size={30} color={Styling.instagram} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaButton}>
              <MaterialCommunityIcons name="linkedin" size={30} color={Styling.linkedin} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Styling.background, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Styling.textPrimary, 
  },
  input: {
    height: 50,
    marginBottom: 15,
    backgroundColor: Styling.white,  
  },
  multiLineInput: {
    height: 100,  
    textAlignVertical: 'top', 
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
  submitButton: {
    backgroundColor: Styling.primary,  // Button background color
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Styling.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardContainer: {
    marginTop: 30,
  },
  card: {
    backgroundColor: Styling.white,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 5,
    color: '#AEAEB2'
  },
  boldText: {
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 5,
    color: 'black'
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  socialMediaButton: {
    padding: 10,
  },
});

export default ContactUs;
