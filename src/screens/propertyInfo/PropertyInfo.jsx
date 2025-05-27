import React, {useState, useCallback, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView, //Import ScrollView
} from 'react-native';
import {useColorScheme} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import Colors from '../../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Chip} from 'react-native-paper';
import * as Progress from 'react-native-progress';
import {getLoginDetails} from '../../utils/AsyncStorage';
import axios from 'axios';
import config from '../../config/config';
import OverviewComponent from '../../components/Overview/OverviewComponent';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import MessagesScreen from '../messages/MessageScreen';
import DocumentsTabs from '../tabs/Documents/DocumentsTabs';
import PhotosVideoScreen from '../photosvideos/PhotosVideoScreen';
import WorksheetTabs from '../tabs/Worksheets/WorksheetTabs';
import {getImageUrlByType} from '../../utils/common';

const Tab = createMaterialTopTabNavigator();

const icons = {
  Communications: 'message-processing',
  Estimates: 'file-document-outline',
  'Financial Worksheet': 'cash-multiple',
  Invoices: 'clipboard-file',
  Orders: 'clipboard-list-outline',
  Photos: 'image-multiple',
  Documents: 'file-outline',
};

const PropertyInfo = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {itemData, selectedJob: initialSelectedJob} = route.params;
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {};
  const [loading, setLoading] = useState(true);
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
  const [currentPosition, setCurrentPosition] = useState(0);
  const [milestoneData, setMilestoneData] = useState([]);
  const [selectedJob, setSelectedJob] = useState(initialSelectedJob);
  const [stageInfo, setStageInfo] = useState(null);

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(true);

  useEffect(() => {
    if (itemData) {
      setStageInfo(itemData);
    }
  }, [itemData]);

  useEffect(() => {
    fetchProjectOverview();
    fetchCoverPhoto();
  }, [fetchProjectOverview, fetchCoverPhoto, initialSelectedJob.id]);

  const fetchProjectOverview = useCallback(async () => {
    try {
      setLoading(true);
      const {access_token, contractor_id} = await getLoginDetails();
      const params = {
        contractor_id: contractor_id,
        project_id: initialSelectedJob.id,
      };
      console.log(params, 'params===>');
      const response = await axios.post(
        `${config.baseUrl}contractor/get-project-overview`,
        params,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      // console.log(contractor_id, initialSelectedJob.id);

      const data = response.data;
      if (data && data.data) {
        setJobActivity(data.data.job_activity);
        const general_information = data.data.general_information;
        console.log(general_information, 'general_information');

        setGeneralInformation({
          name: general_information.customerName || '',
          company_name: general_information.company_name || '---',
          address: general_information.customerAddress || '',
          contact_number: general_information.customerPhone || '',
          email: general_information.customerEmail || '',
          lead_source: general_information.role || '',
        });
        if (data.data.milestone && Array.isArray(data.data.milestone)) {
          setMilestoneData(data.data.milestone);
        }

        setProjectOverviewData({
          instatus: data.data.instatus || '',
          currentstage: data.data.currentstage || '',
          lasttouched: data.data.lasttouched || '',
        });
      } else {
        console.error('Invalid data format received from API:', data);
        Alert.alert('Error', 'Failed to load project data.');
      }
    } catch (error) {
      console.error('Error fetching project overview:', error);
      Alert.alert('Error', 'Failed to load project overview.');
    } finally {
      setLoading(false);
    }
  }, [initialSelectedJob.id]);

  const getCircleColors = currentStage => {
    switch (currentStage) {
      case 'lead':
        return {textColor: '#6691E7', backgroundColor: '#E8EFFB'};
      case 'prospect':
        return {textColor: '#E8BC52', backgroundColor: '#FCF5E5'};
      case 'approve':
        return {textColor: '#13C577', backgroundColor: '#EBF8EC'};
      case 'completed':
        return {textColor: '#50C3E6', backgroundColor: '#E5F6FB'};
      case 'invoice':
        return {textColor: '#865CE2', backgroundColor: '#EDE7FB'};
      default:
        return {
          textColor: isDarkMode ? '#FFF' : '#0A84E3',
          backgroundColor: isDarkMode ? '#444' : '#FFF',
        };
    }
  };

  const getCircleInfo = useCallback(
    currentStage => {
      const {textColor, backgroundColor} = getCircleColors(
        currentStage?.toLowerCase(),
        isDarkMode,
      );
      return {textColor, backgroundColor};
    },
    [isDarkMode],
  );

  const fetchCoverPhoto = useCallback(async () => {
    setCoverPhotoLoading(true);

    try {
      const {access_token, contractor_id} = await getLoginDetails();
      const response = await axios.post(
        `${config.baseUrl}contractor/get-cover-photos`,
        {
          contractor_id: contractor_id,
          project_id: initialSelectedJob.id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;

      if (data && data.success && data.data && data.data.data) {
        // Set the cover photo from the response

        const thumbUrl = getImageUrlByType(
          data.data.data.project_image,
          'thumbnail',
        );
        const gallery = getImageUrlByType(
          data.data.data.project_image,
          'gallery',
        );
        setCoverPhoto({
          id: data.data.data.id,
          project_id: data.data.data.project_id,
          project_image: gallery,
          resizeimage: thumbUrl,
          compressimage: data.data.data.compressimage,
          date: data.data.data.date,
          time: data.data.data.time,
          media_type: data.data.data.media_type,
          notes: data.data.data.notes,
          credit_image: data.data.data.credit_image,
          tags: data.data.data.tags,
          thumb_video_image: data.data.data.thumb_video_image,
          created_by: data.data.data.created_by,
          created_at: data.data.data.created_at,
          updated_at: data.data.data.updated_at,
        });
      } else if (data && !data.success) {
        console.warn('No cover photo found: ', data.message);
        setCoverPhoto(null);
      } else {
        console.warn('Unexpected response structure: ', data);
        setCoverPhoto(null);
      }
    } catch (error) {
      console.error('Error fetching cover photo:', error);
      Alert.alert('Error', 'Failed to load cover photo.');
      setCoverPhoto(null);
    } finally {
      // Introduce a small delay to ensure the ActivityIndicator is visible
      setTimeout(() => {
        setCoverPhotoLoading(false);
      }, 200); // 200ms delay (adjust as needed)
    }
  }, [initialSelectedJob.id]);

  const JobCardHeader = () => {
    const jobCard = {
      name: selectedJob.name || '',
      address: selectedJob.address || '---',
      amount: '$' + selectedJob.balancedue.totalAmount,
      details: '$' + `${selectedJob.balancedue.balanceDue}`,
      progress: (
        <Progress.Bar
          progress={0.91}
          width={null}
          height={5}
          style={{flex: 1}}
          borderWidth={0}
          borderRadius={5}
          unfilledColor="#E0E0E0"
          color="#4CAF50"
        />
      ),
    };

    const circleText =
      itemData?.currentStage?.charAt(0)?.toUpperCase() ||
      selectedJob?.stage_name?.charAt(0)?.toUpperCase() ||
      'N';
    const circleInfo = getCircleInfo(
      itemData?.currentStage || selectedJob?.stage_name,
    );
    const passedTextColor = itemData?.textColor;

    return (
      <View style={styles.jobActivityCard}>
        {coverPhotoLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : coverPhoto ? (
          <Image
            source={{uri: `${coverPhoto.resizeimage}`}}
            style={styles.coverPhoto}
          />
        ) : null}

        <View style={styles.rowContainer}>
          <View
            style={[
              styles.circle,
              {backgroundColor: circleInfo.backgroundColor},
            ]}>
            <Text
              style={[
                styles.circleText,
                {color: passedTextColor || circleInfo.textColor},
              ]}>
              {circleText}
            </Text>
          </View>
          <View style={styles.jobCardHeader}>
            <Text style={styles.jobCardName}>{jobCard.name}</Text>
            <Text style={styles.jobCardAddress}>{jobCard.address}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.jobCardDetails}>
          <Text style={styles.jobCardAmount}>{jobCard.amount}</Text>
          <Text style={styles.jobCardDetailsText}>{jobCard.details}</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'space-between',
              paddingHorizontal: 5,
            }}>
            <Text
              style={{
                fontSize: 16,
                color: Colors.themePlaceHolder,
                paddingHorizontal: 5,
                textAlign: 'right',
              }}>
              {selectedJob?.balancedue?.percentage + '%'}
            </Text>
            <Progress.Bar
              progress={selectedJob?.balancedue?.percentage / 100}
              width={null}
              height={5}
              borderWidth={0}
              style={{flex: 1}}
              borderRadius={5}
              unfilledColor={Colors.red}
              color={
                selectedJob?.balancedue?.percentage === 100
                  ? Colors.red
                  : Colors.success
              }
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{marginTop: '50%'}}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <JobCardHeader />

      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarScrollEnabled: true,
          tabBarStyle: {
            backgroundColor: Colors.tabBackground,
            // paddingTop: 5,
            paddingBottom: 5,
          },
          tabBarItemStyle: {
            width: 'auto',
            paddingHorizontal: 10,
            paddingVertical: 5,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            textTransform: 'capitalize',
          },
          tabBarIndicatorStyle: {
            backgroundColor: 'transparent', // Hide the default indicator
          },
          tabBarIcon: ({focused, color, size}) => {
            let iconName;

            if (route.name === 'Overview') {
              iconName = focused ? 'information' : 'information-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'email' : 'email-outline';
            } else if (route.name === 'Documents') {
              iconName = focused ? 'file-document' : 'file-document-outline';
            } else if (route.name === 'Photos & Videos') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Worksheet') {
              iconName = focused ? 'google-spreadsheet' : 'table';
            }

            // You can return any component that you like here!
            return (
              <MaterialCommunityIcons
                name={iconName}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.themePlaceHolder,
          tabBarButton: props => {
            const isFocused = props.accessibilityState.selected;
            return (
              <TouchableOpacity
                {...props}
                style={[
                  styles.propertyChip,
                  {
                    backgroundColor: isFocused
                      ? Colors.tabBackground
                      : Colors.tabBackground,
                    marginRight: 10,
                    borderColor: isFocused
                      ? Colors.primary
                      : Colors.themePlaceHolder,
                    borderWidth: isFocused ? 0.5 : 0.2,
                  },
                ]}
                rippleColor="transparent">
                {props.children}
              </TouchableOpacity>
            );
          },
        })}>
        <Tab.Screen
          name="Overview"
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <MaterialCommunityIcons
                name={focused ? 'information' : 'information-outline'}
                size={22}
                color={color}
              />
            ),
          }}
          children={() => (
            <ScrollView>
              <OverviewComponent
                projectOverviewData={projectOverviewData}
                milestoneData={milestoneData}
                currentPosition={currentPosition}
                generalInformation={generalInformation}
                jobActivity={jobActivity}
                selectedJob={selectedJob}
                itemData={itemData}
              />
            </ScrollView>
          )}
        />
        <Tab.Screen
          name="Messages"
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <MaterialCommunityIcons
                name={focused ? 'email' : 'email-outline'}
                size={22}
                color={color}
              />
            ),
          }}
          children={() => <MessagesScreen selectedJob={selectedJob} />}
        />
        <Tab.Screen
          name="Documents"
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <MaterialCommunityIcons
                name={focused ? 'file-document' : 'file-document-outline'}
                size={22}
                color={color}
              />
            ),
          }}
          children={() => <DocumentsTabs selectedJob={selectedJob} />}
        />
        <Tab.Screen
          name="Photos & Videos"
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <MaterialCommunityIcons
                name={focused ? 'camera' : 'camera-outline'}
                size={22}
                color={color}
              />
            ),
          }}
          children={() => <PhotosVideoScreen selectedJob={selectedJob} />}
        />
        <Tab.Screen
          name="Worksheet"
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <MaterialCommunityIcons
                name={focused ? 'google-spreadsheet' : 'table'}
                size={22}
                color={color}
              />
            ),
          }}
          children={() => <WorksheetTabs selectedJob={selectedJob} />}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  jobActivityCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    // marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    // marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  activityValuesContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignSelf: 'left',
  },
  activityValueRow: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.themePlaceHolder,
    flex: 1,
  },
  contactLabelHeader: {
    color: Colors.primaryLabel,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.themePlaceHolder,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  primaryView: {
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  editIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  worksheetContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  milestoneHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  milestoneLastTouched: {
    fontSize: 16,
    color: Colors.themePlaceHolder,
  },
  jobCardHeader: {
    flexDirection: 'column',
    // marginBottom: 8,
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  jobCardAddress: {
    fontSize: 14,
    color: Colors.primary,
  },
  jobCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardAmount: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  jobCardDetailsText: {
    fontSize: 14,
    color: Colors.red,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    // marginHorizontal: 10,
  },
  circleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  propertyChip: {
    height: 'auto',
    width: 'auto',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});

export default PropertyInfo;
