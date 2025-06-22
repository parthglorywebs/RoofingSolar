import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import Sidebar from './components/Sidebar';
import EstimateDetailsSection from './components/EstimateDetailsSection';
import CompanyInfoSection from './components/CompanyInfoSection';
import LogoBannerSection from './components/LogoBannerSection';

const EstimateViewScreen = () => {
  const [sections, setSections] = useState({
    Title: true,
    Introduction: true,
    Inspection: false,
    EstimateDetails: true,
    TermsConditions: true,
    Warranty: true,
    ContractTerms: true,
    ThankYou: true,
  });

  const toggleSection = key => {
    setSections(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <View style={styles.container}>
      <Sidebar sections={sections} toggleSection={toggleSection} />
      <ScrollView style={styles.content}>
        {sections.Title && <EstimateDetailsSection />}
        {sections.Introduction && <CompanyInfoSection />}
        {sections.TermsConditions && <LogoBannerSection />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flexDirection: 'row', flex: 1, backgroundColor: '#f5f5f5'},
  content: {flex: 1, padding: 16},
});

export default EstimateViewScreen;
