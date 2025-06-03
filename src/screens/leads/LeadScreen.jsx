import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Modal,
  FlatList,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import {useColorScheme} from 'react-native';
import Colors from '../../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Card,
  Chip,
  IconButton,
  TextInput as PaperTextInput,
  Searchbar,
} from 'react-native-paper';
import axios from 'axios';
import config from '../../config/config';
import {getLoginDetails} from '../../utils/AsyncStorage';
import {useNavigation} from '@react-navigation/native';
import countries from '../../assets/countries.json';
import * as Progress from 'react-native-progress';
import ActionSheet from 'react-native-actions-sheet';
import FilterActionSheet from '../../components/FilterActionSheet';
import LoadListing from './component/LoadListing';

const {height: screenHeight} = Dimensions.get('window');
const pipelineColorMap = {
  lead: '#E8EFFB',
  prospect: '#FCF5E5',
  approve: '#DCF6E9',
  completed: '#E5F6FB',
  invoice: '#EDE7FB',
  closed: '#F9F1F0',
};

const propertyData = [];

const FloatingPlusButton = ({onPress}) => {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <MaterialCommunityIcons name="plus" size={28} color="white" />
    </TouchableOpacity>
  );
};

// New Component to show chips for selected filters
const FilterChip = ({stage, onClose}) => {
  return (
    <View style={styles.filterChipContainer}>
      <Chip
        textStyle={{color: 'white'}}
        style={styles.filterChip}
        onClose={onClose}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </Chip>
    </View>
  );
};

const LeadScreen = ({route}) => {
  const itemData = route?.params?.itemData;
  const navigation = useNavigation();
  const sheetRef = useRef();
  const [pagination, setPagination] = useState({
    current_page: 0,
    last_page: 10,
    per_page: 10,
    total: 0,
  });
  const [modalVisibleAdvance, setModalVisibleAdvance] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState(''); // New state for address
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [projectListData, setProjectListData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorList, setErrorList] = useState(null);
  const [searchText, setSearchText] = useState(''); // State to manage search input
  const [showSearch, setShowSearch] = useState(false);

  const [stageInfo, setStageInfo] = useState(null);
  //New State variables
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilterStage, setSelectedFilterStage] = useState(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  console.log(stageInfo?.backgroundColor, isDarkMode, 'stageInfo');

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#333' : Colors.black,
  };

  const [selectedChip, setSelectedChip] = useState(null);

  const flatListRef = useRef(null);

  const loadMoreData = useCallback(async () => {
    // Prevent loading if already on last page

    if (pagination.current_page >= pagination.last_page || isFetchingMore)
      return;

    setIsFetchingMore(true);

    try {
      const {access_token, contractor_id} = await getLoginDetails();
      const nextPage = pagination.current_page + 1;
      console.log(selectedFilterStage, 'selectedFilterStage');

      const requestData = {
        contractor_id,
        stage: selectedFilterStage,
        page: nextPage,
      };

      const response = await axios.post(
        `${config.baseUrl}contractor/project-listing`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const sources = response.data;
      const newData = sources?.data?.data ?? [];
      const paginationInfo = sources?.data?.pagination ?? {};

      // Filter out duplicates before appending
      setProjectListData(prevData => {
        const existingIds = new Set(prevData.map(item => item.id));
        const filteredNewData = newData.filter(
          item => !existingIds.has(item.id),
        );
        return [...prevData, ...filteredNewData];
      });

      setPagination(paginationInfo);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    pagination.current_page,
    pagination.last_page,
    isFetchingMore,
    selectedFilterStage,
  ]);

  useEffect(() => {
    if (itemData?.currentStage !== stageInfo?.currentStage) {
      setProjectListData([]);
      setPagination({
        current_page: 0,
        last_page: 1, // Use 1 to trigger the first page
        per_page: 10,
        total: 0,
      });
      setStageInfo(itemData);
      setSelectedFilterStage(itemData?.currentStage);
    }
  }, []);

  useEffect(() => {
    if (stageInfo && itemData?.currentStage !== stageInfo?.currentStage) {
      setProjectListData([]);
      setPagination({
        current_page: 0,
        last_page: 1, // Use 1 to trigger the first page
        per_page: 10,
        total: 0,
      });
      setStageInfo(itemData);
      setSelectedFilterStage(itemData?.currentStage);
    }
  }, [itemData, stageInfo]);

  // Separate effect that triggers load when stageInfo is set
  useEffect(() => {
    if (stageInfo?.currentStage) {
      loadMoreData();
    }
  }, [stageInfo]);

  // useEffect(() => {
  //   fetchProjectList(selectedFilterStage, 1); // Fetch initial data
  // }, [fetchProjectList, selectedFilterStage]);

  // const fetchProjectList = useCallback(async (stage, page) => {
  //   const {access_token, contractor_id} = await getLoginDetails();
  //   try {
  //     // Removed setLoading(true) here

  //     setErrorList(null); // Clear any existing errors
  //     setIsFetchingMore(true); // Start loading

  //     const requestData = {
  //       contractor_id: contractor_id,
  //       stage: stage || '',
  //       page: page,
  //     };

  //     const response = await axios.post(
  //       `${config.baseUrl}contractor/project-listing`,
  //       requestData,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${access_token}`,
  //         },
  //       },
  //     );

  //     if (
  //       response &&
  //       response.data &&
  //       response.data.success &&
  //       response.data.data &&
  //       response.data.data.data
  //     ) {
  //       const newData = response.data.data.data;
  //       console.log(newData.length, 'newData');
  //       const paginationInfo = response.data.data.pagination;

  //       // Update state based on whether we're loading initial data or fetching more
  //       if (page === 1) {
  //         // Initial load: replace existing data
  //         setProjectListData(newData);
  //       } else {
  //         // Subsequent loads: append new data to existing data
  //         setProjectListData(prevData => [...prevData, ...newData]);
  //       }

  //       setLastPage(paginationInfo.last_page);
  //       setCurrentPage(paginationInfo.current_page);
  //     } else {
  //       console.error('No Data found for Project List.');
  //       setErrorList('No data received');
  //       if (page === 1) {
  //         setProjectListData([]); // Clear the project list only on the first page
  //       }
  //     }

  //     // setLoading(false);  Removed
  //     setIsFetchingMore(false); // Reset fetching more state
  //   } catch (error) {
  //     console.error('Error fetching contractor profile:', error);
  //     // setLoading(false); Removed
  //     setIsFetchingMore(false); // Reset fetching more state
  //     setErrorList('Failed to load project list.');
  //   }
  // }, []);

  const handleLoadMore = () => {
    if (pagination.current_page < pagination.last_page) {
      loadMoreData(); // Now the function setIsFetchingMore(true) from starting of function fetchProjectList
    }
  };

  const handlePropertyPress = useCallback(item => {
    setSelectedChip(item.id);
    if (item.id === 'add') {
      // console.log('Navigate to add new project');
    }
  }, []);

  const openFilterModal = () => {
    sheetRef.current?.show();
    // setFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setFilterModalVisible(false);
  };

  const handleStageSelect = stage => {
    setSelectedFilterStage(stage);
    setProjectListData([]);
    setPagination({
      current_page: 0,
      last_page: 1, // Use 1 to trigger the first page
      per_page: 10,
      total: 0,
    });
    setStageInfo(prev => ({...prev, stage: stage}));
    closeFilterModal();
  };

  const handleResetFilter = () => {
    setSelectedFilterStage(null);
    setPagination({
      current_page: 0,
      last_page: 1, // Use 1 to trigger the first page
      per_page: 10,
      total: 0,
    });
    setProjectListData([]);
    setStageInfo(prev => ({...prev, stage: null}));
    closeFilterModal();
  };

  const openModal = useCallback(job => {
    setSelectedJob(job);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedJob(null);
  }, []);

  const openModalAdvance = useCallback(() => {
    setModalVisibleAdvance(true);
  }, []);

  const closeModalAdvance = useCallback(() => {
    setModalVisibleAdvance(false);
  }, []);

  const handleAddProject = useCallback(async () => {
    setIsLoading(true);
    // Validate the inputs
    const errors = {};
    if (!projectName.trim()) {
      errors.projectNames = 'Project Name is required';
    }
    if (!email.trim()) {
      errors.emails = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.emails = 'Invalid email address';
    }
    if (!contactNumber.trim()) {
      errors.contactnumbers = 'Contact Number is required';
    }
    if (!name.trim()) {
      errors.names = 'Name is required';
    }
    if (!address.trim()) {
      errors.address = 'Address is required';
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      setIsLoading(false);
      return;
    }

    const {access_token, contractor_id} = await getLoginDetails();

    try {
      const response = await axios.post(
        `${config.baseUrl}contractor/create-project`,
        {
          contractor_id: contractor_id,
          projectname: projectName,
          email: email,
          contact_number: contactNumber,
          country_code: 'us',
          name: name,
          address: address, // Include Address
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (response && response.data && response.data.success) {
        Alert.alert('Success', 'Project Added Successfully');
        closeModalAdvance();
        setSelectedFilterStage('lead');
        setPagination({
          current_page: 0,
          last_page: 1, // Use 1 to trigger the first page
          per_page: 10,
          total: 0,
        });
        setProjectListData([]);
        setStageInfo(prev => ({...prev, stage: 'lead'}));
      } else {
        Alert.alert('Failed', 'Failed to add project');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error add project', error);
      setIsLoading(false);
      Alert.alert('Failed', 'Failed to add project');
    }
  }, [
    projectName,
    email,
    contactNumber,
    name,
    address,
    closeModalAdvance,
    selectedFilterStage,
  ]);

  const handleFocus = useCallback(
    fieldName => {
      setError(prev => ({...prev, [fieldName]: ''}));
    },
    [setError],
  );

  const handlePropertyDetail = useCallback(
    project => {
      if (!project) {
        console.warn(
          'selectedJob is undefined, cannot navigate to PropertyInfo',
        );
        return;
      }

      navigation.navigate('PropertyInfo', {
        itemData: {
          ...project, // Use the passed project directly
          currentStage: itemData?.currentStage || project?.stage_name,
          progress: project.progress?.props?.progress,
          totalAmount: project?.balancedue?.totalAmount,
          balanceDue: project?.balancedue?.balanceDue,
          percentage: project?.balancedue?.percentage,
        },
        selectedJob: project,
      });
    },
    [navigation, itemData],
  );

  const renderItem = useCallback(
    ({item}) => {
      const isSelected = selectedChip === item.id;
      return (
        <Chip
          icon={() => (
            <MaterialCommunityIcons
              name={item.icon}
              size={20}
              color={isSelected ? Colors.primary : Colors.black}
            />
          )}
          style={[
            styles.propertyChip,
            {backgroundColor: isSelected ? Colors.invoice : '#EFEFEF'},
          ]}
          textStyle={{
            color: isSelected ? Colors.primary : 'black',
          }}
          onPress={() => handlePropertyPress(item)}>
          {item.name}
        </Chip>
      );
    },
    [selectedChip, handlePropertyPress],
  );

  const getCircleColors = useCallback(
    currentStage => {
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
        case 'lead':
          return {textColor: '#6691E7', backgroundColor: '#E8EFFB'};
      }
    },
    [isDarkMode],
  );

  const getCircleInfo = useCallback(
    currentStage => {
      const {textColor, backgroundColor} = getCircleColors(
        currentStage?.toLowerCase(),
        isDarkMode,
      );
      return {textColor, backgroundColor};
    },
    [isDarkMode, getCircleColors],
  );

  const filteredProjects = useMemo(() => {
    const lowerCaseSearchText = searchText.toLowerCase();

    return (projectListData ?? []).filter(project => {
      const {
        title = '',
        customer_name = '',
        user_email = '',
        id = '',
        address = '',
      } = project;

      return (
        title.toLowerCase().includes(lowerCaseSearchText) ||
        customer_name.toLowerCase().includes(lowerCaseSearchText) ||
        user_email.toLowerCase().includes(lowerCaseSearchText) ||
        id.toString().toLowerCase().includes(lowerCaseSearchText) ||
        address.toLowerCase().includes(lowerCaseSearchText)
      );
    });
  }, [searchText, projectListData]);

  const handleClose = useCallback(() => {
    setSearchText('');
  }, [setSearchText]);

  const renderEmptyState = useCallback(() => {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No projects available.</Text>
      </View>
    );
  }, []);

  const renderFooter = () => {
    if (isFetchingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    } else if (currentPage >= lastPage && projectListData.length > 0) {
      // Only show the message when all pages are loaded and there's media
      return (
        <TouchableOpacity
          style={{paddingVertical: 20, alignItems: 'center'}}
          onPress={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({offset: 0, animated: true});
            }
          }}>
          <Text style={{color: '#888'}}>
            You have reached project list limit. Tap to return to top
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderProjectList = useMemo(
    () =>
      filteredProjects.map((project, index) => {
        const stageForCircleInfo =
          selectedFilterStage || itemData?.currentStage || project?.stage_name;
        const circleText = stageForCircleInfo?.charAt(0)?.toUpperCase() || 'L';
        const circleInfo = getCircleInfo(stageForCircleInfo);
        const passedTextColor = itemData?.textColor;

        return (
          <TouchableOpacity
            key={index}
            style={styles.jobActivityCard}
            onPress={() =>
              // openModal(project)
              handlePropertyDetail(project)
            }>
            <View style={[styles.rowContainer, {backgroundColor: '#FFF'}]}>
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

              <View style={styles.activityValuesContainer}>
                {[
                  {
                    label: `${project.title}`,
                    icon: null,
                    isBold: true,
                    color: Colors.themeBlack,
                  },
                  {
                    label: project.user_email ? project.user_email : '---',
                    icon: 'email-outline',
                    isBold: false,
                    color: Colors.themeBlack,
                  },
                  {
                    label: project.customer_number
                      ? project.customer_number
                      : '---',
                    icon: 'phone-outline',
                    isBold: false,
                    color: Colors.themeBlack,
                  },
                  {
                    label: project.address ? project.address : '---',
                    icon: 'map-marker-outline',
                    isBold: false,
                    color: project.address ? Colors.primary : Colors.red,
                  },
                ].map((item, idx) => (
                  <View key={idx} style={[styles.activityValueRow]}>
                    {item.icon && (
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={16}
                        color={item.color}
                        style={{marginRight: 6}}
                      />
                    )}
                    <Text
                      style={[
                        styles.activityLabel,
                        {
                          fontWeight: item.isBold ? 'bold' : 'normal',
                          color: item.color,
                          fontSize: item.isBold ? 16 : 12,
                        },
                      ]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Image
                source={require('../../assets/images/next.png')}
                style={styles.arrowIcon}
              />
            </View>

            <View style={styles.dividerList} />

            <View>
              <View style={styles.renderBottomContainer}>
                <View style={styles.renderRowContainer}>
                  <View style={styles.rowDirectionView}>
                    <Text style={styles.textTotalAmount}>
                      {'$' + project?.balancedue?.totalAmount}
                    </Text>
                    <Text style={styles.textBalance}>
                      {'$' + project?.balancedue?.balanceDue}
                    </Text>
                  </View>

                  <View style={styles.viewPercentage}>
                    <Text style={styles.textPercentage}>
                      {project?.balancedue?.percentage + '%'}
                    </Text>
                    <Progress.Bar
                      progress={project?.balancedue?.percentage / 100}
                      width={null}
                      height={5}
                      borderWidth={0}
                      style={{flex: 1}}
                      borderRadius={5}
                      unfilledColor={Colors.red}
                      color={
                        project?.balancedue?.percentage === 100
                          ? Colors.red
                          : Colors.success
                      }
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }),
    [filteredProjects, getCircleInfo, itemData, openModal, selectedFilterStage],
  );

  const handleCallPress = useCallback(
    async phoneNumber => {
      if (!selectedJob) {
        Alert.alert('Error', 'No contact selected');
        return;
      }
      let cleanedPhoneNumber = encodeURIComponent(
        phoneNumber.replace(/[^0-9+]/g, ''),
      );
      const countryCode =
        countries.find(item => item.code === selectedJob?.country_code)
          ?.dial_code || '+1';
      cleanedPhoneNumber = countryCode + cleanedPhoneNumber;

      let url;
      if (Platform.OS === 'ios') {
        url = `facetime:${cleanedPhoneNumber}`;
      } else {
        url = `tel:${cleanedPhoneNumber}`;
      }

      try {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          if (Platform.OS === 'ios') {
            Alert.alert(
              'FaceTime not available',
              'Falling back to a regular phone call.',
            );
          }
          const telUrl =
            Platform.OS === 'android'
              ? `tel:${cleanedPhoneNumber}`
              : `telprompt:${cleanedPhoneNumber}`;
          const callSupported = await Linking.canOpenURL(telUrl);
          if (callSupported) {
            await Linking.openURL(telUrl);
          } else {
            Alert.alert(`Error to open: ${telUrl}`);
          }
        }
      } catch (error) {
        console.error('An error occurred', error);
        Alert.alert('Call Failed', `Unable to open: ${error.message}`);
      }
    },
    [selectedJob],
  );

  const handleEmail = useCallback(
    async email => {
      if (!selectedJob) {
        Alert.alert('Error', 'No contact selected');
        return;
      }
      const url = `mailto:${email}`;
      try {
        // const supported = await Linking.canOpenURL(url);
        // if (supported) {
        //   await Linking.openURL(url);
        // } else {
        //   Alert.alert(`Error to open : ${url}`);
        // }
        Linking.openURL('https://mail.google.com/mail/u/0/#inbox?compose=new');
      } catch (error) {
        console.error('An error occurred', error);
        Alert.alert(
          'Email Failed',
          `Unable to open the email app: ${error.message}`,
        );
      }
    },
    [selectedJob],
  );

  const handleMap = useCallback(
    async address => {
      if (!selectedJob) {
        Alert.alert('Error', 'No contact selected');
        return;
      }
      const encodedAddress = encodeURIComponent(address);
      const url = Platform.select({
        ios: `maps://?q=${encodedAddress}`,
        android: `geo:0,0?q=${encodedAddress}`,
      });

      try {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(`Don't know how to open this URL: ${url}`);
        }
      } catch (error) {
        console.error('An error occurred', error);
        Alert.alert(
          'Map Failed',
          `Unable to open the map app: ${error.message}`,
        );
      }
    },
    [selectedJob],
  );

  const renderContent = useMemo(() => {
    return (
      <View
        style={{
          flexDirection: 'column',
          marginBottom: 10,
          backgroundColor: selectedFilterStage
            ? pipelineColorMap[selectedFilterStage]
            : '#F8FAFB',
        }}>
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>Result ({pagination.total})</Text>
          <View style={[styles.buttonContainer, {justifyContent: 'flex-end'}]}>
            {selectedFilterStage && (
              <FilterChip
                stage={selectedFilterStage}
                onClose={() => handleResetFilter()}
              />
            )}
            {/* {selectedFilterStage && (
              <View style={{display: 'flex', alignItems: 'center'}}>
                <Chip
                  textStyle={{color: 'white'}}
                  style={styles.filterChip}
                  onClose={() => {}}>
                  {selectedFilterStage}
                </Chip>
              </View>
            )} */}
            <TouchableOpacity
              style={[styles.filterButton, {backgroundColor: Colors.white}]}
              onPress={openFilterModal}>
              <MaterialCommunityIcons
                name="filter-variant"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={styles.advancebutton}
              onPress={openModalAdvance}>
              <Text style={styles.advancetext}>+</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        <FlatList
          data={propertyData}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContainer}
          nestedScrollEnabled={true}
        />

        <View style={styles.container}>
          <Searchbar
            style={styles.searchInput}
            onChangeText={setSearchText}
            placeholder="Search"
            value={searchText}
          />
        </View>
        {loading && pagination.current_page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : errorList ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.errorText}>Error: {errorList}</Text>
          </View>
        ) : projectListData.length === 0 ? (
          renderEmptyState()
        ) : (
          <LoadListing data={filteredProjects} itemData={itemData} />
        )}
        {/*  Removed `!loading && !isFetchingMore`  and put condition inside main content */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={styles.modalContainer}>
                  <View style={styles.myTopBox}></View>
                  {selectedJob && (
                    <View>
                      <Text style={styles.modalTitle}>
                        {selectedJob?.title}
                      </Text>
                      <View style={styles.modalDetail}>
                        <TouchableOpacity
                          onPress={() => handleCallPress(selectedJob.phone)}>
                          <View style={styles.callDetail}>
                            <MaterialCommunityIcons
                              name="phone"
                              size={18}
                              color={Colors.themePlaceHolder}
                            />
                            <Text style={styles.modalLabel}>
                              {countries.find(
                                item => item.code === selectedJob?.country_code,
                              )?.dial_code || '+1'}
                              {selectedJob.phone}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />
                        <TouchableOpacity
                          onPress={() =>
                            handleEmail(selectedJob.customer_email)
                          }>
                          <View style={styles.callDetail}>
                            <MaterialCommunityIcons
                              name="email"
                              size={18}
                              color={Colors.themePlaceHolder}
                            />
                            <Text style={styles.modalLabel}>
                              {selectedJob.customer_email}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />
                        <TouchableOpacity
                          onPress={() => handleMap(selectedJob.address)}>
                          <View style={styles.callDetail}>
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={18}
                              color={Colors.themePlaceHolder}
                            />
                            <Text style={styles.modalLabel}>
                              {selectedJob.address
                                ? selectedJob.address
                                : '---'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <View style={styles.callDetail}>
                          <MaterialCommunityIcons
                            name="account"
                            size={18}
                            color={Colors.themePlaceHolder}
                          />
                          <Text
                            style={[styles.modalLabel, {fontWeight: 'bold'}]}>
                            {selectedJob.customer_name}
                          </Text>
                        </View>

                        <View style={styles.divider} />
                        <View style={styles.callDetail}>
                          <MaterialCommunityIcons
                            name="information"
                            size={18}
                            color={Colors.themePlaceHolder}
                          />
                          <Text style={styles.modalLabel}>
                            {'In Status: '}
                            <Text style={{fontWeight: 'bold'}}>
                              {selectedJob.instatus}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.viewAll,
                      {position: 'relative', marginBottom: 10},
                    ]}
                    onPress={handlePropertyDetail}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal
          visible={modalVisibleAdvance}
          transparent={true}
          animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModalAdvance}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalSubTitle}>Project Name*</Text>
              <PaperTextInput
                style={[styles.input, error.projectNames && styles.errorInput]}
                label="Enter your Project Name"
                placeholder="Enter your Project Name"
                keyboardType="default"
                value={projectName}
                mode="outlined"
                onFocus={() => handleFocus('projectNames')}
                onChangeText={text => {
                  setProjectName(text);
                  if (error.projectNames)
                    setError(prev => ({...prev, projectNames: ''}));
                }}
                error={!!error.projectNames}
              />
              {error.projectNames ? (
                <Text style={styles.errorText}>{error.projectNames}</Text>
              ) : null}

              <Text style={styles.modalSubTitle}>Email*</Text>
              <PaperTextInput
                style={[styles.input, error.emails && styles.errorInput]}
                label="Enter your Email Address"
                placeholder="Enter your Email Address"
                keyboardType="email-address"
                value={email}
                mode="outlined"
                autoCapitalize="none"
                onFocus={() => handleFocus('emails')}
                onChangeText={text => {
                  setEmail(text);
                  if (error.emails) setError(prev => ({...prev, emails: ''}));
                }}
                error={!!error.emails}
              />
              {error.emails ? (
                <Text style={styles.errorText}>{error.emails}</Text>
              ) : null}

              <Text style={styles.modalSubTitle}>Contact Number*</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity
                  style={styles.countryCodeContainer}
                  onPress={() => {}}>
                  <Text style={styles.countryCodeText}>
                    {`🇺🇸`} {`US`}
                  </Text>
                </TouchableOpacity>
                <PaperTextInput
                  style={[
                    styles.inputContact,
                    error.contactnumbers && styles.errorInput,
                  ]}
                  label="Enter your Contact Number"
                  placeholder="Enter your Contact Number"
                  keyboardType="phone-pad"
                  value={contactNumber}
                  mode="outlined"
                  autoCapitalize="none"
                  onChangeText={text => {
                    const formattedText = text.replace(/[^0-9+]/g, '');
                    setContactNumber(formattedText);
                    if (error.contactnumbers) {
                      setError(prev => ({...prev, contactnumbers: ''}));
                    }
                  }}
                  error={!!error.contactnumbers}
                  onFocus={() => handleFocus('contactnumbers')}
                />
              </View>
              {error.contactnumbers ? (
                <Text style={styles.errorText}>{error.contactnumbers}</Text>
              ) : null}

              <Text style={styles.modalSubTitle}>Name*</Text>
              <PaperTextInput
                style={[styles.input, error.names && styles.errorInput]}
                label="Enter your Name"
                placeholder="Enter your Name"
                keyboardType="default"
                value={name}
                mode="outlined"
                onFocus={() => handleFocus('names')}
                onChangeText={text => {
                  setName(text);
                  if (error.names) setError(prev => ({...prev, names: ''}));
                }}
                error={!!error.names}
              />
              {error.names ? (
                <Text style={styles.errorText}>{error.names}</Text>
              ) : null}

              {/* Address Field */}
              <Text style={styles.modalSubTitle}>Address</Text>
              <PaperTextInput
                style={[styles.input, error.address && styles.errorInput]}
                label="Enter Address"
                placeholder="Enter Address"
                keyboardType="default"
                value={address}
                mode="outlined"
                onFocus={() => handleFocus('address')}
                onChangeText={text => {
                  setAddress(text);
                  if (error.address) setError(prev => ({...prev, address: ''}));
                }}
                error={!!error.address}
              />
              {error.address ? (
                <Text style={styles.errorText}>{error.address}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddProject}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Filter Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isFilterModalVisible}
          onRequestClose={closeFilterModal}>
          <TouchableWithoutFeedback onPress={closeFilterModal}>
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={styles.filterModalContainer}>
                  <View style={styles.filterHeader}>
                    <Text style={styles.modalTitle}>Filter by Stage</Text>
                    <TouchableOpacity onPress={handleResetFilter}>
                      <Text style={styles.resetButtonText}>Reset All</Text>
                    </TouchableOpacity>
                  </View>
                  {['lead', 'prospect', 'approve', 'completed', 'invoice'].map(
                    stage => (
                      <TouchableOpacity
                        key={stage}
                        style={[
                          styles.filterOption,
                          selectedFilterStage === stage &&
                            styles.selectedFilterOption,
                        ]}
                        onPress={() => handleStageSelect(stage)}>
                        <Text
                          style={[
                            styles.filterOptionText,
                            selectedFilterStage === stage &&
                              styles.selectedFilterOptionText,
                          ]}>
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }, [
    errorList,
    loading,
    filteredProjects,
    projectListData,
    renderItem,
    handlePropertyDetail,
    openModal,
    closeModal,
    getCircleInfo,
    isDarkMode,
    searchText,
    error,
    projectName,
    email,
    contactNumber,
    name,
    address, // Include Address
    isLoading,
    handleClose,
    handleFocus,
    handleAddProject,
    modalVisibleAdvance,
    closeModalAdvance,
    openModalAdvance,
    itemData,
    isFilterModalVisible,
    selectedFilterStage,
    handleStageSelect,
    openFilterModal,
    closeFilterModal,
    selectedFilterStage,
    renderProjectList,
    handleCallPress,
    handleEmail,
    handleMap,
    isFetchingMore,
    currentPage,
    renderEmptyState,
    getCircleColors,
    stageInfo?.currentStage,
  ]);

  return (
    <SafeAreaView>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <FlatList
        ref={flatListRef}
        data={[{key: 'content', component: renderContent}]}
        keyExtractor={item => item.key}
        renderItem={() => renderContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />

      <FloatingPlusButton onPress={openModalAdvance} />
      <FilterActionSheet
        ref={sheetRef}
        onSelect={stage => {
          handleStageSelect(stage);
        }}
        onReset={() => {
          handleStageSelect(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButtonText: {
    color: Colors.primary,
    fontSize: 16,
    marginBottom: 10,
  },
  filterModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
  },
  filterChipContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    // width: '50%',
  },
  filterChip: {
    backgroundColor: Colors.filter,
    marginBottom: 10,
    borderRadius: 20,
  },
  filterOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFilterOption: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.themeBlack,
    paddingHorizontal: 10,
  },
  selectedFilterOptionText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  countryCodeContainer: {
    backgroundColor: '#EFEFEF',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    marginBottom: 10,
  },
  inputContact: {
    flex: 1,
    marginBottom: 10,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    marginTop: 15,
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
    justifyContent: 'center',
    alignSelf: 'center',
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalSubTitle: {
    marginVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.themePlaceHolder,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.red,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContainer: {
    flexGrow: 1,
  },
  propertyChip: {
    borderRadius: 30,
    marginHorizontal: 12,
    paddingHorizontal: 10,
    backgroundColor: '#D9F1D6',
    justifyContent: 'center',
    alignItems: 'center',
    width: '35%',
    height: 43,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.invoice,
    borderRadius: 5,
  },
  searchInput: {
    backgroundColor: Colors.white,
  },
  callIcon: {
    resizeMode: 'contain',
  },
  icon: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  myTopBox: {
    position: 'absolute',
    width: 60,
    height: 2,
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#E4E4E4',
    borderStyle: 'solid',
    borderRadius: 10,
    top: 5,
  },

  modalDetail: {
    flexDirection: 'column',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 15,
    paddingTop: 10,
  },
  activityValuesContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: 10,
  },
  callDetail: {
    flexDirection: 'row',
    justifyContent: 'left',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 10,
  },
  activityValueRow: {
    flexDirection: 'row',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.themeBlack,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
    marginRight: 10,
  },
  advancebutton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  advancetext: {
    color: '#fff',
    fontSize: 22,
  },

  generalInfoCard: {
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    // marginVertical: 10,
  },
  jobActivityCard: {
    backgroundColor: Colors.light,
    borderRadius: 12,
    marginHorizontal: 20,
    // paddingHorizontal: 10,
    marginTop: 20,
    // elevation: 5,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    flexDirection: 'column',
  },
  jobActivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  arrowIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
  },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  dividerList: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
    paddingHorizontal: 10,
    color: Colors.themePlaceHolder,
  },
  renderBottomContainer: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  renderRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDirectionView: {
    flexDirection: 'row',
    // alignItems: 'center',
    flex: 1.5,
  },
  textTotalAmount: {
    fontSize: 14,
    color: Colors.themeBlack,
    textAlign: 'left',
  },
  textBalance: {
    fontSize: 14,
    color: Colors.red,
    paddingHorizontal: 5,
    textAlign: 'left',
  },
  viewPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    // paddingHorizontal: 5,
  },
  textPercentage: {
    fontSize: 16,
    color: Colors.themePlaceHolder,
    paddingHorizontal: 5,
    textAlign: 'right',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20, // Adjust based on tab height
    right: 20,
    backgroundColor: '#2196F3', // or your theme's blue
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default LeadScreen;
