import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import SectionTitle from './SectionTitle';

const LogoBannerSection = () => (
  <View>
    <SectionTitle title="Company Logo" />
    <Image
      source={{uri: 'https://i.imgur.com/EqEZiuv.png'}}
      style={styles.logo}
    />
    <SectionTitle title="Banner Image" />
    <Image
      source={{uri: 'https://i.imgur.com/Vwy8cAY.jpg'}}
      style={styles.banner}
    />
  </View>
);

const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 60,
    marginTop: 10,
    resizeMode: 'contain',
  },
  banner: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
});

export default LogoBannerSection;
