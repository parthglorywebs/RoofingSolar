import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {useForgotPasswordMutation} from '../../redux/api/apiClient';
import {TextInput as PaperTextInput} from 'react-native-paper';
import Colors from '../../assets/styling/colors';

const ForgotPassword = ({navigation, route}) => {
  const [email, setEmail] = useState('');
  const [forgotPassword, {isLoading}] = useForgotPasswordMutation();
  const [isFocused, setIsFocused] = useState({email: false});

  const [error, setError] = useState({
    email: '',
  });

  useEffect(() => {
    if (route.params && route.params.rememberedEmail) {
      setEmail(route.params.rememberedEmail);
    }
    
  }, [route.params]);

  const handleEmailChange = text => {
    if (text.length > 0) {
      text = text.charAt(0).toLowerCase() + text.slice(1);
    }
    setEmail(text);
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '', // Clear error when user focuses on the input
    }));
  };

  const handlePasswordReset = async () => {
    let isValid = true;
    const errors = {email: '', password: ''};

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setError(errors);

    if (!email) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      const response = await forgotPassword(email).unwrap();

      if (response.success) {
        Alert.alert('Success', response.message, [
          {
            text: 'OK',
            onPress: () => {
              // Optionally navigate to another screen if needed
              // navigation.navigate('ResetPassword');
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Unable to send reset link.');
      }
    } catch (error) {
      // console.error('Error:', error);
      if (error?.data?.errors?.email) {
        const errorMessages = error.data.errors.email.join(', ');
        Alert.alert('Invalid Email', errorMessages);
      } else if (error?.data?.message) {
        Alert.alert('Error', error.data.message || 'Something went wrong.');
      } else {
        Alert.alert('Error', 'An unknown error occurred.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}>
        <View style={styles.headerContainer}>
          <Text
            style={styles.header}
            // onPress={() => {
            //   navigation.navigate('ResetPassword');
            // }}
            >
            Forgot Password
          </Text>
          <Text style={styles.subtitle}>
            No worries, we'll you reset instructions. Please enter the email
            address.
          </Text>
        </View>

        <PaperTextInput
          style={[
            styles.input,
            error.email && styles.errorInput,
            isFocused.email && styles.focusedInput,
          ]}
          label="Email"
          placeholder="Enter your Email address"
          keyboardType="email-address"
          value={email}
          onChangeText={handleEmailChange}
          mode="outlined"
          error={!!error.email}
          theme={{
            roundness: isFocused.email ? 15 : 11,
            colors: {
              primary: isFocused.email
                ? Colors.noneFocusTextinput
                : Colors.primary,
              text: Colors.primary,
              placeholder: Colors.themePlaceHolder,
              error: Colors.red,
              fontSize: 18,
            },
          }}
          outlineStyle={{borderWidth: 1}}
          outlineColor={Colors.borderTextinput}
          onFocus={() => handleFocus('email')}
          onBlur={() => setIsFocused({...isFocused, email: false})}
        />

        {error.email ? (
          <Text style={styles.errorText}>{error.email}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && {opacity: 0.6}]}
          onPress={handlePasswordReset}
          disabled={isLoading}>
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    // flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 20,
    // flex: 1
    // alignItems: 'center',
  },
  header: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    marginTop: 5,
  },
  input: {
    marginBottom: 20,
    fontSize: 16,
    height: 70,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    paddingVertical: 0,
  },
});

export default ForgotPassword;
