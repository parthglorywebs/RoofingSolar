import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import Colors from '../../assets/styling/colors';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password) => {
    const minLength = 6;
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;
    return password.length >= minLength && regex.test(password);
  };

  const handleChangePassword = () => {
    let isValid = true;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    // Validate the fields
    if (!currentPassword) {
      errors.currentPassword = 'Current Password is required';
      isValid = false;
    }
    if (!newPassword) {
      errors.newPassword = 'New Password is required';
      isValid = false;
    } else if (!validatePassword(newPassword)) {
      errors.newPassword = 'Password must be at least 6 characters long, contain an uppercase letter, a number, and a special character';
      isValid = false;
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm New Password is required';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'New Password and Confirm Password do not match';
      isValid = false;
    }

    setError(errors);

    if (!isValid) return;

    Alert.alert('Password Changed', 'Your password has been successfully changed!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Clear the error messages when user types in the fields
  const handleTextChange = (field, value) => {
    if (value.trim()) {
      setError(prevError => ({
        ...prevError,
        [field]: '', // Clear the error for the field
      }));
    }

    switch (field) {
      case 'currentPassword':
        setCurrentPassword(value);
        break;
      case 'newPassword':
        setNewPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const handleFocus = (field) => {
    setError(prevError => ({
      ...prevError,
      [field]: '', // Clear error when user focuses on the input
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>

      <PaperTextInput
        style={[
          styles.input,
          error.currentPassword && styles.errorInput,
        ]}
        label="Current Password*"
        value={currentPassword}
        onChangeText={(text) => handleTextChange('currentPassword', text)}
        secureTextEntry
        mode="outlined"
        error={!!error.currentPassword}
        onFocus={() => handleFocus('currentPassword')}
      />
      {error.currentPassword ? (
        <Text style={styles.errorText}>{error.currentPassword}</Text>
      ) : null}

      <PaperTextInput
        style={[
          styles.input,
          error.newPassword && styles.errorInput,
        ]}
        label="Enter New Password*"
        value={newPassword}
        onChangeText={(text) => handleTextChange('newPassword', text)}
        secureTextEntry
        mode="outlined"
        error={!!error.newPassword}
        onFocus={() => handleFocus('newPassword')}
      />
      {error.newPassword ? (
        <Text style={styles.errorText}>{error.newPassword}</Text>
      ) : null}

      <PaperTextInput
        style={[
          styles.input,
          error.confirmPassword && styles.errorInput,
        ]}
        label="Confirm New Password*"
        value={confirmPassword}
        onChangeText={(text) => handleTextChange('confirmPassword', text)}
        secureTextEntry
        mode="outlined"
        error={!!error.confirmPassword}
        onFocus={() => handleFocus('confirmPassword')}
      />
      {error.confirmPassword ? (
        <Text style={styles.errorText}>{error.confirmPassword}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.loginButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    marginBottom: 15,
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
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: 'center',
    height: 50,
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChangePassword;
