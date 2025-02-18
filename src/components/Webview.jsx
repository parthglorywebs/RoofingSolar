import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Colors from '../assets/styling/colors';

const WebViewComponent = ({ url, onClose }) => {
  const [loading, setLoading] = useState(true);

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const hideElements = `
  const navbar = document.querySelector('.navbar');
  const headerSpace = document.querySelector('.header-space');
  const siteHeader = document.querySelector('.site-header');
  const row = document.querySelector('.row');
  const col12 = document.querySelector('.col-12');
  
  // Hide navbar, header space, and site header
  if (navbar) {
    navbar.style.display = 'none';
  }
  if (headerSpace) {
    headerSpace.style.display = 'none';
  }
  if (siteHeader) {
    siteHeader.style.display = 'none';
  }
  
  // Hide row and col-12 if they exist
  if (row) {
    row.style.display = 'none';
  }
  if (col12) {
    col12.style.display = 'none';
  }
`;

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      <WebView
        // source={{ uri: url }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        // injectedJavaScript={`
        //   (function() {
        //     const element = document.querySelector('.xl\\:hidden');
        //     if (element) {
        //       element.style.display = 'none';
        //     }
        //   })();
        // `}
        javaScriptEnabled={true}

        source={{ uri: url }}
        injectedJavaScript={hideElements} 
        onMessage={(event) => console.log(event.nativeEvent.data)} 
        style={{ flex: 1 }}
      />
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 1,
  },
  closeButton: {
    backgroundColor: '#f00',
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default WebViewComponent;
