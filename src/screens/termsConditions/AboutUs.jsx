import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import config from '../../config/config';

const AboutUs = ({ navigation }) => {
  const handleClose = () => {
    navigation.goBack();
  };

  // JavaScript to hide the navbar, header-space, and site-header
  const hideElements = `
    const navbar = document.querySelector('.navbar');
    const headerSpace = document.querySelector('.header-space');
    const siteHeader = document.querySelector('.site-header');
    
    if (navbar) {
      navbar.style.display = 'none';
    }
    if (headerSpace) {
      headerSpace.style.display = 'none';
    }
    if (siteHeader) {
      siteHeader.style.display = 'none';
    }
  `;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: `${config.webUrl}about-us` }}
        injectedJavaScript={hideElements} 
        onMessage={(event) => console.log(event.nativeEvent.data)} 
        onLoadEnd={() => console.log("Page loaded")}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 10,
    backgroundColor: '#f00',
    position: 'absolute',
    bottom: 20,
    left: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AboutUs;
