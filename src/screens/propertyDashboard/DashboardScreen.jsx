import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useColorScheme} from 'react-native';
import Colors from '../../assets/styling/colors';
import {getLoginDetails} from '../../utils/AsyncStorage';
import axios from 'axios';
import config from '../../config/config';

const {width} = Dimensions.get('window'); // Get the screen width

const DashboardScreen = () => {
  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#fff' : '#333',
  };

  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState([]);
  const [activityData, setActivityData] = useState({});
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    fetchDashboardPipeline();
  }, []);

  const fetchDashboardPipeline = async () => {
    const {access_token, contractor_id} = await getLoginDetails();
    try {
      setLoading(true);
      const response = await axios.post(
        `${config.baseUrl}contractor/current-pipeline`,
        {
          contractor_id: contractor_id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const data = response.data;

      setPipelineData(data.data.milestone || []);
      setProjectCount(data.data.projectcount || 0);
      setActivityData(data.data.activity);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load contractor profile');
    }
  };

  // Data for the grid
  const gridData = [
    {
      key: '1',
      text: '333',
      subText: '---',
      circleText: 'L',
      circleColor: '#E8EFFB',
    },
    {
      key: '2',
      text: '129',
      subText: '$1,687,490',
      circleText: 'P',
      circleColor: '#FCF5E5',
    },
    {
      key: '3',
      text: '482',
      subText: '$1,687,490',
      circleText: 'A',
      circleColor: '#EBF8EC',
    },
    {
      key: '4',
      text: '212',
      subText: '$1,687,490',
      circleText: 'C',
      circleColor: '#E5F6FB',
    },
    {
      key: '5',
      text: '126',
      subText: '$1,687,490',
      circleText: 'I',
      circleColor: '#EDE7FB',
    },
  ];

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

  const renderDynamicGridValue = (currentStage, value) => {
    // Show the total value if the stage is 'lead'
    if (currentStage === 'lead') {
      return value;
    }
    return '';
  };

  const renderGridItem = ({item}) => {
    if (loading) {
      return (
        <View style={styles.gridItem}>
          <ActivityIndicator size="large" color={Colors.themeblue} />
        </View>
      );
    }

    const {textColor, backgroundColor} = getCircleColors(item.currentStage);

    return (
      <TouchableOpacity onPress={() => handleRowPress(item)}>
        <View style={styles.gridItem}>
          <View style={styles.textContainer}>
            <Text style={styles.gridText}>{item.pipeline || '0'}</Text>
            <Text style={styles.subText}>
              {Number(item.total || '0').toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </Text>
          </View>
          <View style={[styles.circle, {backgroundColor}]}>
            <Text style={[styles.circleText, {color: textColor}]}>
              {item.currentStage
                ? item.currentStage.charAt(0).toUpperCase()
                : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityValues = () => {
    if (loading) {
      return (
        <View style={styles.activityValuesContainer}>
          <ActivityIndicator size="large" color={Colors.themeblue} />
        </View>
      );
    }
    const activity = activityData || {};
    const activityItems = [
      {label: 'New Leads', value: activity.jobs_leads || 0},
      {label: 'Jobs Approved', value: activity.jobs_approved || 0},
      {label: 'Jobs Completed', value: activity.jobs_completed || 0},
      {
        label: 'Money Collected',
        value: `${Number(activity.jobs_money_collected || 0).toLocaleString(
          'en-US',
          {style: 'currency', currency: 'USD'},
        )}`,
      },
      {label: 'Jobs Invoiced', value: activity.jobs_invoiced || 0},
      {label: 'Jobs Closed', value: activity.jobs_closed || 0},
    ];

    return activityItems.map((item, index) => (
      <React.Fragment key={index}>
        <TouchableOpacity
          style={styles.activityValueRow}
          onPress={() => {
            // handleLeads(item)
          }}>
          <Text style={styles.activityLabel}>{item.label}</Text>
          <Text
            style={{
              color: Colors.themeblue,
              fontSize: 16,
              fontWeight: 'bold',
              justifyContent: 'center',
            }}>
            {item.value}
          </Text>
          <Image
            source={require('../../assets/images/next.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        {index < activityItems.length - 1 && <View style={styles.divider} />}
      </React.Fragment>
    ));
  };

  const tabBarHeight = Platform.OS === 'ios' ? 30 : 60;

  const renderHeader = () => (
    <View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Current Pipeline:</Text>
        <Text style={styles.value}>Active jobs: {projectCount}</Text>
      </View>
      {pipelineData && pipelineData.length > 0 ? (
        <FlatList
          data={pipelineData}
          renderItem={renderGridItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            marginHorizontal: 10,
          }}
        />
      ) : (
        <FlatList
          data={gridData}
          renderItem={renderGridItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            marginHorizontal: 10,
          }}
        />
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Activity Count:</Text>
        <Text style={styles.value}>
          {activityData.jobs_day ? activityData.jobs_day : 'Last 0 Days'}
        </Text>
      </View>

      <View style={styles.jobActivityCard}>
        <View style={styles.activityValuesContainer}>
          {renderActivityValues()}
        </View>
      </View>
    </View>
  );

  const handleLeads = item => {
    navigation.navigate('Leads', {itemData: item});
  };

  const handleRowPress = item => {
    // console.log('Navigating with item.currentStage:', item.currentStage);
    navigation.navigate('Leads', {
      screen: 'LeadsInner',
      params: {itemData: item},
    });
  };

  return (
    <SafeAreaView>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <FlatList
        ListHeaderComponent={renderHeader}
        data={[]}
        renderItem={() => null}
        keyExtractor={() => 'header'}
        contentContainerStyle={[
          styles.scrollViewContainer,
          {paddingBottom: tabBarHeight},
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    color: Colors.themePlaceHolder,
  },
  gridContainer: {
    paddingVertical: 10,
  },
  gridItem: {
    width: (width - 45) / 2,
    height: ((width - 45) / 2) * 0.5,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  gridText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A84E3',
  },
  subText: {
    fontSize: 14,
    color: '#696969',
    marginTop: 5,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 143.396,
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 8.34,
  },
  circleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  jobActivityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 15,
    // marginVertical: 10,
    // marginBottom: 15,
  },
  activityValuesContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  activityValueRow: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.themePlaceHolder,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
    width: '100%',
  },
  arrowIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
  },
});

export default DashboardScreen;
