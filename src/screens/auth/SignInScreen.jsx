import React, {useState, useEffect} from 'react';
import {
  Alert,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  BackHandler
} from 'react-native';
import {saveLoginDetails, getLoginDetails} from '../../utils/AsyncStorage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput as PaperTextInput} from 'react-native-paper';
import {useLoginMutation} from '../../redux/api/apiClient';
import WebViewComponent from '../../components/Webview';
import Colors from '../../assets/styling/colors';
import CustomCheckbox from '../../components/CustomCheckbox';
import {useColorScheme} from 'react-native'; // Import useColorScheme

const {width} = Dimensions.get('window');
const SignIn = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [webviewUrl, setWebviewUrl] = useState('');
  const [showWebview, setShowWebview] = useState(false);
  const [currentRole, setCurrentRole] = useState('Contractor');
  const [isLoading, setIsLoading] = useState(false);
  const [login, {isLoading: isLoginLoading, error: apiError}] =
    useLoginMutation();
  const [error, setError] = useState({
    email: '',
    password: '',
  });
  const [isFocused, setIsFocused] = useState({email: false, password: false});

  const colorScheme = useColorScheme(); // Get the current color scheme
  const isDarkMode = colorScheme === 'dark'; // Determine if it's dark mode

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Return true to prevent default back navigation
        return true;
      }
    );

    return () => backHandler.remove(); // Clean up on unmount
  }, []);

  useEffect(() => {
    const loadSavedCredentials = async () => {
      const { email: rememberedEmail, password: rememberedPassword, rememberMe: savedRememberMe } = await getLoginDetails();
      if (savedRememberMe) {
        setEmail(rememberedEmail || '');
        setPassword(rememberedPassword || '');
        setRememberMe(savedRememberMe);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (isLoginLoading) return;
    setIsLoading(true);

    let isValid = true;
    const errors = {email: '', password: ''};

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setError(errors);

    if (!isValid) {
      setIsLoading(false);
      return;
    }

    const data = {
      userType: 'contractor',
      email,
      password,
    };

    try {
      const response = await login(data).unwrap();
      const {
        access_token,
        data: {id: contractor_id, name},
      } = response.data;

      setIsLoading(false);
      saveLoginDetails(email, access_token, contractor_id, name, rememberMe, rememberMe ? password : '');
      navigation.replace('BottomTabs');

      // console.log(access_token, contractor_id, name);
    } catch (error) {
      setIsLoading(false);
      console.log('Login error:', error);

      const apiErrors = {email: '', password: ''};

      if (apiError && apiError.data && apiError.data.message) {
        // Alert.alert('Login failed', apiError.data.message);

        apiErrors.email = apiError.data.message;
        apiErrors.password = apiError.data.message;
      } else {
        // Alert.alert('Error', 'An unknown error occurred.');

        apiErrors.email = 'Please verify email';
        apiErrors.password = 'Please verify password';
      }

      setError(apiErrors);
    }
  };

  const toggleSecureTextEntry = () => setSecureTextEntry(!secureTextEntry);


  const closeWebview = () => {
    setShowWebview(false);
    setWebviewUrl('');
  };

  if (showWebview) {
    return <WebViewComponent url={webviewUrl} onClose={closeWebview} />;
  }



  const handleEmailChange = text => {
    if (text.length > 0) {
      text = text.charAt(0).toLowerCase() + text.slice(1);
    }
    setEmail(text);
  };

  const handleFocus = field => {
    setError(prevError => ({
      ...prevError,
      [field]: '',
    }));
  };

  const handleFill = async () => {
    setEmail('anil.test341@gmail.com');
    setPassword('StjfpvFqS88LR8i');

    const loginDetails = await getLoginDetails();

    const access_token = loginDetails ? loginDetails.access_token : '';
  };


  const handleForgotPassword = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
   const emailToPass = rememberMe && email && emailRegex.test(email) ? email : ''; // Conditional email

    navigation.navigate('ForgotPassword', { rememberedEmail: emailToPass, rememberMe: rememberMe });
  };

  
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.scrollView}>

      <Image
        source={require('../../assets/images/logo_login.png')}
        style={styles.logoIcon}
      />
      <Text style={styles.header} 
      // onPress={handleFill}
      >
        Sign in to your Account
      </Text>

      <Text style={styles.credentialText}>
        Enter your Credentials to Sign in
      </Text>

      <PaperTextInput
        style={[
          styles.input,
          error.email && styles.errorInput,
          isFocused.email && styles.focusedInput,
        ]}
        label="Email"
        placeholder="Email address"
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
            text: (isDarkMode || email) ? Colors.black : Colors.primary,  // Apply always light color
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

      {error.email ? <Text style={styles.errorText}>{error.email}</Text> : null}

      <View style={{flexDirection: 'row', position: 'relative' }}>
        <PaperTextInput
          style={[
            styles.input,
            error.password && styles.errorInput,
            isFocused.password && styles.focusedInput,
          ]}
          label="Password"
          placeholder="••••••••"
          secureTextEntry={secureTextEntry}
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          error={!!error.password}
          theme={{
            roundness: isFocused.password ? 15 : 11,
            colors: {
              primary: isFocused.password
                ? Colors.noneFocusTextinput
                : Colors.primary,
              text: (isDarkMode || password) ? Colors.primary : Colors.primary,  // Always apply light color
              placeholder: Colors.themeDotted,
              error: Colors.red,
              fontSize: 18,
            },
          }}
          contentStyle={{
            textAlign: 'left',
            fontSize: 18,
            letterSpacing: 5,
          }}
          placeholderStyle={{
            fontSize: 28,
            letterSpacing: 5,
          }}
          outlineStyle={{borderWidth: 1}}
          outlineColor={Colors.borderTextinput}
          onFocus={() => handleFocus('password')}
          onBlur={() => setIsFocused({...isFocused, password: false})}
        />
        <TouchableOpacity onPress={toggleSecureTextEntry}>
          <Icon
            name={secureTextEntry ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.passwordToggle}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {error.password ? (
        <Text style={styles.errorText}>{error.password}</Text>
      ) : null}

      <View style={styles.checkboxContainer}>
        <CustomCheckbox
          checked={rememberMe}
          onChange={setRememberMe}
          label="Remember me"
        />
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={isLoading}>
        {/* <Text style={styles.loginButtonText}>Login</Text> */}
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" /> // Show loading spinner
        ) : (
          <Text style={styles.loginButtonText}>Sign in</Text>
        )}
      </TouchableOpacity>


      <View style={styles.footer}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
        </TouchableOpacity>

      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: '#fff',
  },
  scrollView: {
    backgroundColor: '#fff',
  },
  credentialText: {
    color: Colors.themePlaceHolder,
    fontWeight: '400',
    fontSize: 18,
  },
  header: {
    fontSize: 42,
    fontWeight: '700',
    fontStyle: 'normal',
    marginVertical: 10,
    textAlign: 'left',
    color: Colors.themeBlack,
  },
  logoIcon: {
    width: width * 0.2,
    height: 'auto',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  input: {
    marginTop: 30,
    height: 70,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: '60%',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkboxLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  forgotPasswordText: {
    color: '#0A84E3',
    marginHorizontal: 5,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  line: {
    backgroundColor: '#ECECEC',
    height: 1,
  },
  text: {
    fontSize: 16,
    color: '#AEAEB2',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authOptions: {
    alignItems: 'center',
    marginTop: 20,
  },
  authText: {
    fontSize: 16,
    color: '#000',
    marginVertical: 5,
  },
  link: {
    color: '#0A84FF',
  },
  footer: {
    marginTop: 25,
  },
  footerNew: {
    flexDirection: 'row',
    marginTop: 10,
    paddingStart: 5,
  },
  linkText: {
    color: '#0A84FF',
  },
});

export default SignIn;