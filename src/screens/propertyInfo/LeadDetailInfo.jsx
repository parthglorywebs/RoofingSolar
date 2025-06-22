import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import JobCardHeader from './component/JobCardHeader';
import {useRoute} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TabBar, TabView} from 'react-native-tab-view';
import OverviewComponent from '../../components/Overview/OverviewComponent';
import ComingSoon from '../../components/ComingSoon';
import MessagesScreen from '../messages/MessageScreen';
import {fetchProjectOverview} from '../../services/leadInfoService';
import DocumentsTabs from '../tabs/Documents/DocumentsTabs';
import PhotosVideoScreen from '../photosvideos/PhotosVideoScreen';
import WorksheetTabs from '../tabs/Worksheets/WorksheetScreen';

const routes = [
  {key: 'overview', title: 'Overview', icon: 'information-outline'},
  {key: 'message', title: 'Messages', icon: 'message-text-outline'},
  {key: 'documents', title: 'Documents', icon: 'file-document-outline'},
  {key: 'photos', title: 'Photos & Videos', icon: 'image-multiple-outline'},
  {key: 'worksheet', title: 'Worksheet', icon: 'clipboard-text-outline'},
  {key: 'account', title: 'Account', icon: 'account-cash-outline'},
  {key: 'estimate', title: 'Estimate', icon: 'file-cabinet'},
  {key: 'report', title: 'Report', icon: 'chart-box-outline'},
];

const LeadDetailInfo = () => {
  const route = useRoute();
  const layout = useWindowDimensions();
  const {itemData, selectedJob: initialSelectedJob} = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  const [selectedJob, setSelectedJob] = useState(initialSelectedJob);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [milestoneData, setMilestoneData] = useState([]);
  const [projectOverviewData, setProjectOverviewData] = useState({
    instatus: '',
    currentstage: '',
    lasttouched: '',
  });
  const [jobActivity, setJobActivity] = useState({
    communication_count: 0,
    worksheets_count: 0,
    invoice_count: 0,
    images_count: 0,
    documents_count: 0,
  });
  const [generalInformation, setGeneralInformation] = useState({
    name: '',
    company_name: '---',
    address: '',
    contact_number: '',
    email: '',
    lead_source: '',
  });

  useEffect(() => {
    getProjectOverview();
  }, [initialSelectedJob.id]);

  const getProjectOverview = async () => {
    try {
      setLoading(true);
      const response = await fetchProjectOverview(selectedJob.id);
      console.log(response, 'response');

      setProjectOverviewData(response.projectOverviewData);
      setJobActivity(response.jobActivity);
      setGeneralInformation(response.general_information);
      setMilestoneData(response.milestone);
      setLoading(false);
    } catch (error) {
      // handle error if needed
    } finally {
      setLoading(false);
    }
  };

  const onChangeTab = key => {
    const tabIndex = routes.findIndex(route => route.key === key);
    if (tabIndex !== -1) {
      setActiveTab(tabIndex);
    }
  };

  const renderScene = ({route}) => {
    switch (route.key) {
      case 'overview':
        return (
          <OverviewComponent
            projectOverviewData={projectOverviewData}
            milestoneData={milestoneData}
            currentPosition={currentPosition}
            generalInformation={generalInformation}
            jobActivity={jobActivity}
            selectedJob={selectedJob}
            itemData={itemData}
            onChangeTab={onChangeTab}
          />
        );
      case 'message':
        return <MessagesScreen selectedJob={selectedJob} />;
      case 'documents':
        return <DocumentsTabs selectedJob={selectedJob} />;
      case 'photos':
        return <PhotosVideoScreen selectedJob={selectedJob} />;
      case 'worksheet':
        return <WorksheetTabs selectedJob={selectedJob} />;
      // case 'overview':
      //   return <OverviewComponent ... />;
      default:
        return <ComingSoon />;
    }
  };

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{backgroundColor: '#007aff', height: 2}}
      style={{
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
      }}
      renderTabBarItem={({route}) => {
        const index = routes.findIndex(a => a.key === route.key);
        const focused = activeTab === index;

        return (
          <TouchableOpacity
            onPress={() => {
              const selectIndex = routes.findIndex(a => a.key === route.key);
              setActiveTab(selectIndex);
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: layout.width / 4,
                paddingVertical: 8,
              }}>
              <MaterialCommunityIcons
                name={route.icon}
                size={20}
                color={focused ? '#007aff' : '#999'}
              />
              <Text
                style={{
                  color: focused ? '#007aff' : '#999',
                  fontSize: 12,
                  marginTop: 4,
                }}>
                {route.title}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      scrollEnabled
      tabStyle={{width: layout.width / 4, flexDirection: 'column'}}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <View style={styles.headerWrapper}>
        <JobCardHeader selectedJob={selectedJob} itemData={itemData} />
      </View>

      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{index: activeTab, routes}}
          renderScene={renderScene}
          initialLayout={{width: layout.width}}
          renderTabBar={renderTabBar}
          onIndexChange={index => setActiveTab(index)}
          lazy
        />
      </View>
    </SafeAreaView>
  );
};

export default LeadDetailInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerWrapper: {
    padding: 16,
  },
  tabViewContainer: {
    flex: 1,
  },
});
