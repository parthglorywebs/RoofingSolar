import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveLoginDetails = async (email, access_token, contractor_id, name, rememberMe = false, password = '') => {
  try {
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('access_token', access_token);
    await AsyncStorage.setItem('contractor_id', String(contractor_id));
    await AsyncStorage.setItem('name', name);
    await AsyncStorage.setItem('rememberMe', JSON.stringify(rememberMe)); // Store as string
    if (rememberMe) {
      await AsyncStorage.setItem('password', password); //Only save password if rememberMe is true
    }

  } catch (error) {
    console.error('Error saving login details: ', error);
  }
};

export const getLoginDetails = async () => {
  try {
    const email = await AsyncStorage.getItem('email') || "";
    const access_token = await AsyncStorage.getItem('access_token') || "";
    const contractor_id = await AsyncStorage.getItem('contractor_id') || "";
    const name = await AsyncStorage.getItem('name') || "";
    const rememberMe = await AsyncStorage.getItem('rememberMe');
    const password = await AsyncStorage.getItem('password') || "";

    return {
      email,
      access_token,
      contractor_id: contractor_id ? parseInt(contractor_id, 10) : null,
      name,
      rememberMe: rememberMe ? JSON.parse(rememberMe) : false, //Parse JSON
      password,
    };
  } catch (error) {
    console.error('Error retrieving login details: ', error);
    return null;
  }
};


export const clearLoginDetails = async (rememberMe) => {
    try {
        if (rememberMe) {
            // Clear everything except email and password
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('contractor_id');
            await AsyncStorage.removeItem('name');
        } else {
            // Clear everything
            await AsyncStorage.removeItem('email');
            await AsyncStorage.removeItem('password');
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('contractor_id');
            await AsyncStorage.removeItem('name');
            await AsyncStorage.removeItem('rememberMe');
        }
    } catch (error) {
        console.error('Error clearing login details: ', error);
    }
};