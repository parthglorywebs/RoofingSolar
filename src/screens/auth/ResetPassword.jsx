import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput as PaperTextInput} from 'react-native-paper';
import Colors from '../../assets/styling/colors';

const ResetPassword = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const toggleSecureTextEntry = () => setSecureTextEntry(!secureTextEntry);
  const [isLoading, setIsLoading] = useState(false);

  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isFocused, setIsFocused] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const [webviewUrl, setWebviewUrl] = useState('');
  const [showWebview, setShowWebview] = useState(false);

  // const openWebview = url => {
  //   setWebviewUrl(url);
  //   setShowWebview(true);
  // };

  // const closeWebview = () => {
  //   setShowWebview(false);
  //   setWebviewUrl('');
  // };

  // if (showWebview) {
  //   return <WebViewComponent url={webviewUrl} onClose={closeWebview} />;
  // }

  const handlePasswordReset = () => {
    // navigation.navigate('Dashboard');

    if (isLoading) return;
    setIsLoading(true);

    let isValid = true;
    const errors = {newPassword: '', confirmPassword: ''};

    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'New Password must be at least 6 characters';
      isValid = false;
    }

    if (!confirmPassword || confirmPassword.length < 6) {
      errors.confirmPassword = 'Confirm Password must be at least 6 characters';
      isValid = false;
    }

    setError(errors);

    if (!isValid) {
      setIsLoading(false);
      return;
    }
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '', // Clear error when user focuses on the input
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}>
        {/* <View
          style={{
            backgroundColor: Colors.primaryBlur,
            width: '100%',
            height: 50,
            justifyContent: 'center',
            alignSelf: 'center',
          }}>
          <Text
            style={{
              justifyContent: 'center',
              alignSelf: 'center',
              color: Colors.primary,
            }}>
            Reset now
          </Text>
        </View> */}
        <Text style={styles.header}>Reset Password</Text>
        <Text style={styles.subtitle}>Must be at least 8 characters</Text>

        {/* <TextInput
            style={styles.input}
            placeholder="Enter New Password"
            secureTextEntry={!isPasswordVisible}
            value={newPassword}
            onChangeText={setNewPassword}
          /> */}
        <View style={{flexDirection: 'row', position: 'relative'}}>
          <PaperTextInput
            style={[
              styles.input,
              error.newPassword && styles.errorInput,
              isFocused.newPassword && styles.focusedInput,
            ]}
            label="Password"
            placeholder="••••••••"
            secureTextEntry={!isPasswordVisible}
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            error={!!error.newPassword}
            theme={{
              roundness: isFocused.newPassword ? 15 : 11,
              colors: {
                primary: isFocused.newPassword
                  ? Colors.noneFocusTextinput
                  : Colors.primary,
                text: Colors.primary,
                placeholder: Colors.themeDotted,
                error: Colors.red,
                fontSize: 18,
              },
            }}
            contentStyle={{
              textAlign: 'left',
              fontSize: 18,
              // letterSpacing: 5,
            }}
            placeholderStyle={{
              fontSize: 28,
              // letterSpacing: 5,
            }}
            outlineStyle={{borderWidth: 1}}
            outlineColor={Colors.borderTextinput}
            onFocus={() => handleFocus('newPassword')}
            onBlur={() => setIsFocused({...isFocused, newPassword: false})}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.passwordToggle}
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        {error.newPassword ? (
          <Text style={styles.errorText}>{error.newPassword}</Text>
        ) : null}

        {/* <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            secureTextEntry={!isConfirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          /> */}
           <View style={{flexDirection: 'row', position: 'relative'}}>

        <PaperTextInput
          style={[
            styles.input,
            error.confirmPassword && styles.errorInput,
            isFocused.confirmPassword && styles.focusedInput,
          ]}
          label="Confirm Password"
          placeholder="••••••••"
          secureTextEntry={!isPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          error={!!error.confirmPassword}
          theme={{
            roundness: isFocused.confirmPassword ? 15 : 11,
            colors: {
              primary: isFocused.confirmPassword
                ? Colors.noneFocusTextinput
                : Colors.primary,
              text: Colors.primary,
              placeholder: Colors.themeDotted,
              error: Colors.red,
              fontSize: 18,
            },
          }}
          contentStyle={{
            textAlign: 'left',
            fontSize: 18,
            // letterSpacing: 5,
          }}
          placeholderStyle={{
            fontSize: 28,
            // letterSpacing: 5,
          }}
          outlineStyle={{borderWidth: 1}}
          outlineColor={Colors.borderTextinput}
          onFocus={() => handleFocus('confirmPassword')}
          onBlur={() => setIsFocused({...isFocused, newPassword: false})}
        />
        <TouchableOpacity
          onPress={() =>
            setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
          }>
          <Icon
            name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.passwordToggle}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
        </View>

        {error.confirmPassword ? (
          <Text style={styles.errorText}>{error.confirmPassword}</Text>
        ) : null}


        <TouchableOpacity
          style={styles.submitButton}
          onPress={handlePasswordReset}>
          <Text style={styles.submitButtonText}>Reset Password</Text>
        </TouchableOpacity>

        {/* <View style={styles.footer}>
          <Text
            style={styles.linkText}
            onPress={() =>
              openWebview(`${config.webUrl}terms-and-conditions`)
            }>
            Terms
          </Text>
          <Text style={styles.separator}>|</Text>
          <Text
            style={styles.linkText}
            onPress={() => openWebview(`${config.webUrl}contact-us`)}>
            Contact Us
          </Text>
        </View> */}
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
  header: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'left',
    justifyContent: 'center',
    // alignSelf: 'center',
    color: '#2C2C2E',
    marginBottom: 10,
    // width: '50%',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    color: '#AEAEB2',
    marginBottom: 30,
  },
  // input: {
  //   height: 50,
  //   flex: 1,
  //   fontSize: 16,
  // },
  input: {
    marginTop: 20,
    height: 70,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    // transform: [{translateY: -12}],
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingLeft: 10,
  },
  icon: {
    right: 10,
  },
  submitButton: {
    marginVertical: 20,
    backgroundColor: Colors.primary,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backText: {
    fontSize: 16,
    color: '#0A84FF', // Blue color for back button
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#0A84FF',
  },
  separator: {
    fontSize: 14,
    color: '#777',
    marginHorizontal: 8,
  },
});

export default ResetPassword;
