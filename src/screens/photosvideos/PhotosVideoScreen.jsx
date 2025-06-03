import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import moment from 'moment';
import axios from 'axios';
import config from '../../config/config';
import Video from 'react-native-video';
import {Menu, Provider, Divider} from 'react-native-paper';
import {getLoginDetails} from '../../utils/AsyncStorage';
import Colors from '../../assets/styling/colors';
import {Calendar} from 'react-native-calendars';
import ImageViewer from 'react-native-image-zoom-viewer';
import FastImage from 'react-native-fast-image';
import BackgroundService from 'react-native-background-actions';
import {createThumbnail} from 'react-native-create-thumbnail';
import PushNotification from 'react-native-push-notification';
// import notifee, {AndroidImportance} from '@notifee/react-native';
import {getImageUrlByType} from '../../utils/common';
import ImageSelector from '../../components/ImagePicker/ImageSelector';
import MediaGallery from './MediaGallery';

const {width, height} = Dimensions.get('window');
const NOTIFICATION_ID = 999;

const PhotosVideoScreen = ({selectedJob}) => {
  const [groupedMedia, setGroupedMedia] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [filterText, setFilterText] = useState('Filter');
  const [filterIcon, setFilterIcon] = useState('filter');
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const flatListRef = useRef(null);
  const [contractorId, setContractorId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [deletingMediaUri, setDeletingMediaUri] = useState(null);
  const [modalMediaLoading, setModalMediaLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showNotesIndicator, setShowNotesIndicator] = useState(false);

  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);
  const [selectedMediaForMenu, setSelectedMediaForMenu] = useState(null);
  const [settingCoverPhoto, setSettingCoverPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // percentage (0–100)
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadFileName, setCurrentUploadFileName] = useState('');

  const [videoImageListing, setVideoImageListing] = useState([]);
  const [page, setPage] = useState(1); // Current page number
  const [totalPages, setTotalPages] = useState(1); // Total number of pages
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Loading state for pagination
  const [apiLoading, setApiLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Track the initial data fetch
  const [uploadingStatus, setUploadingStatus] = useState({
    processing: 0,
    completed: 0,
    total: 0,
    inProgress: false,
  });

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchInitialData = useCallback(async () => {
    const {contractor_id} = await getLoginDetails();
    setContractorId(contractor_id);
    await onRefresh(1); // Fetch initial data with page 1
    setInitialLoad(false); // Initial load is complete
  }, []);

  const getMediaList = async rawItems => {
    const mediaList = await Promise.all(
      rawItems.flatMap(({is_date, is_item}) =>
        is_item.map(async item => {
          if (item.media_type === 'video') {
            const thumb_video_image = await getImageUrlByType(
              item.project_image,
              'thumb_video_image',
            );
            const videoUrl = await getImageUrlByType(
              item.project_image,
              'video',
            );

            return {
              ...item,
              is_date,
              url: videoUrl,
              galleryUrl: thumb_video_image,
              type: item.media_type,
              notes: item.notes,
              createdAt: item.created_at,
              username: item.created_by,
            };
          } else {
            const thumbUrl = await getImageUrlByType(
              item.project_image,
              'thumbnail',
            );
            const galleryUrl = await getImageUrlByType(
              item.project_image,
              'gallery',
            );

            return {
              ...item,
              is_date,
              url: thumbUrl,
              galleryUrl: galleryUrl,
              type: item.media_type,
              notes: item.notes,
              createdAt: item.created_at,
              username: item.created_by,
            };
          }
        }),
      ),
    );

    return mediaList;
  };

  const onRefresh = useCallback(
    async (currentPage = 1, fromDate = null, toDate = null) => {
      if (currentPage === 1) {
        setApiLoading(true); // Initial load
      } else {
        setIsFetchingMore(true); // Pagination loader
      }

      const {access_token, contractor_id} = await getLoginDetails();
      try {
        let apiUrl = `${config.baseUrl}contractor/get-photos-videos`;
        let postData = {
          contractor_id: contractor_id,
          project_id: selectedJob.id,
          page: currentPage,
        };

        const response = await axios.post(apiUrl, postData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${access_token}`,
          },
        });

        const sources = response.data;
        const rawItems = sources?.data?.data?.data ?? [];

        const formattedItems = rawItems.map(item => {
          const is_date = item.created_at;

          if (item.media_type === 'video') {
            const thumb_video_image = getImageUrlByType(
              item.project_image,
              'thumb_video_image',
            );
            const videoUrl = getImageUrlByType(item.project_image, 'video');
            return {
              ...item,
              is_date,
              url: videoUrl,
              galleryUrl: thumb_video_image,
              type: item.media_type,
              notes: item.notes,
              createdAt: item.created_at,
              username: item.created_by,
            };
          }

          const thumbnail = getImageUrlByType(item.project_image, 'thumbnail');
          const galleryUrl = getImageUrlByType(item.project_image, 'gallery');
          const original = getImageUrlByType(item.project_image, 'original');

          return {
            ...item,
            is_date,
            url: galleryUrl,
            thumbnail: thumbnail,
            original: original,
            type: item.media_type,
            notes: item.notes,
            createdAt: item.created_at,
            username: item.created_by,
          };
        });
        if (formattedItems?.length > 0) {
          if (currentPage === 1) {
            setVideoImageListing(formattedItems);
          } else {
            setVideoImageListing(prev => [...prev, ...formattedItems]); // Append new items
          }
        } else {
          setVideoImageListing([]);
        }

        setTotalPages(sources.data.last_page);
        setPage(currentPage);
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setApiLoading(false);
        setIsFetchingMore(false);
      }
    },
    [selectedJob],
  );

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      console.log(granted);

      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    }
    return true;
  };

  // const fetchPhotoVideos = useCallback(
  //   async (currentPage = 1, fromDate = null, toDate = null) => {
  //     // Added currentPage parameter with default value
  //     if (currentPage === 1) {
  //       setApiLoading(true); // Only show full loader on initial load
  //     } else {
  //       setIsFetchingMore(true); // Show pagination loader
  //     }

  //     try {
  //       const {access_token, contractor_id} = await getLoginDetails();
  //       let apiUrl = `${config.baseUrl}contractor/get-photos-videos`;
  //       let postData = {
  //         contractor_id: contractor_id,
  //         project_id: selectedJob.id,
  //         page: currentPage, // Use the currentPage parameter
  //       };

  //       // if (fromDate && toDate) {
  //       //   apiUrl = `${config.baseUrl}contractor/date-filter-photos-videos`;
  //       //   postData = {
  //       //     contractor_id: contractor_id,
  //       //     project_id: selectedJob.id,
  //       //     fromdate: moment(fromDate).format('MM/DD/YYYY'),
  //       //     todate: moment(toDate).format('MM/DD/YYYY'),
  //       //     page: currentPage, // Include page for date-filtered requests as well
  //       //   };
  //       // }

  //       const response = await axios.post(apiUrl, postData, {
  //         headers: {
  //           'Content-Type': 'application/x-www-form-urlencoded',
  //           Authorization: `Bearer ${access_token}`,
  //         },
  //         transformResponse: data => {
  //           try {
  //             return JSON.parse(data);
  //           } catch (e) {
  //             return data;
  //           }
  //         },
  //       });

  //       if (response.status !== 200) {
  //         // Check for 422 status specifically
  //         if (response.status === 422) {
  //           setGroupedMedia({}); // Clear any existing data
  //           console.log(
  //             'No Photos and videos found for the selected date range',
  //           );
  //           // Optionally, show a user-friendly message (not an Alert, just a text in the UI)
  //           return; // Exit the function early
  //         } else {
  //           throw new Error('Request failed with status ' + response.status); //Handle other errors
  //         }
  //       }

  //       const data = response.data;
  //       const rawItems = data?.data?.data ?? [];
  //       const mediaList = await getMediaList(rawItems);

  //       const allRecords = (data?.data?.data ?? []).flatMap(a => a.is_item);
  //       const medial = mediaList;
  //       console.log(allRecords, medial.length, 'mediaList');

  //       setVideoImageListing(mediaList);
  //       setTotalPages(data.data.last_page); // Set total pages from response
  //       if (currentPage === 1) {
  //         setPage(currentPage); // Update current page state
  //       }

  //       // const itemData = (data?.data?.data ?? []).map(item => {
  //       //   return {
  //       //     id: '4',
  //       //     url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  //       //     type: 'video',
  //       //     createdAt: '2025-05-29T11:15:00Z',
  //       //   };
  //       // });

  //       // if (
  //       //   data &&
  //       //   data.success === false &&
  //       //   data.message === 'Photos & Videos not found.'
  //       // ) {
  //       //   setGroupedMedia({});
  //       //   // console.log('No Photos and videos found');
  //       // } else if (data && data.data) {
  //       //   const grouped = data.data.data.reduce((acc, dayData) => {
  //       //     const dayItems = dayData.is_item
  //       //       .map(item => {
  //       //         const thumbUrl = getImageUrlByType(
  //       //           item.project_image,
  //       //           'thumbnail',
  //       //         );
  //       //         const galleryUrl = getImageUrlByType(
  //       //           item.project_image,
  //       //           'gallery',
  //       //         );

  //       //         if (!thumbUrl || !galleryUrl) return null;

  //       //         return {
  //       //           uri: thumbUrl,
  //       //           galleryUrl: galleryUrl,
  //       //           type: item.media_type,
  //       //           notes: item.notes,
  //       //           postedTime: item.created_at,
  //       //           date: dayData.is_date,
  //       //           mediaId: item.id,
  //       //           created_by: item.created_by,
  //       //         };
  //       //       })
  //       //       .filter(Boolean); // Removes any null items

  //       //     if (dayItems.length > 0) {
  //       //       if (!acc[dayData.is_date]) {
  //       //         acc[dayData.is_date] = [];
  //       //       }
  //       //       acc[dayData.is_date].push(...dayItems);
  //       //     }

  //       //     return acc;
  //       //   }, {});

  //       //   if (currentPage === 1) {
  //       //     // Initial data load, replace existing data
  //       //     setGroupedMedia(grouped);
  //       //   } else {
  //       //     // Append new data to existing data
  //       //     setGroupedMedia(prevGroupedMedia => {
  //       //       const newGroupedMedia = {...prevGroupedMedia};
  //       //       for (const date in grouped) {
  //       //         if (newGroupedMedia[date]) {
  //       //           // If date already exists, append the items
  //       //           newGroupedMedia[date] = [
  //       //             ...newGroupedMedia[date],
  //       //             ...grouped[date],
  //       //           ];
  //       //         } else {
  //       //           // If date doesn't exist, add the new date and items
  //       //           newGroupedMedia[date] = grouped[date];
  //       //         }
  //       //       }
  //       //       return newGroupedMedia;
  //       //     });
  //       //   }

  //       //   setTotalPages(data.data.last_page); // Set total pages from response
  //       //   setPage(currentPage); // Update current page state
  //       // } else {
  //       //   console.error('Invalid data format received from API:', data);
  //       //   Alert.alert(
  //       //     'Error',
  //       //     'Failed to load media files. Invalid data format.',
  //       //   );
  //       // }
  //     } catch (error) {
  //       console.error('Error fetching photos/videos:', error);
  //       // Alert.alert('Error', 'Failed to load photos and videos.');
  //     } finally {
  //       setApiLoading(false);
  //       setIsFetchingMore(false); // End pagination loading
  //     }
  //   },
  //   [selectedJob],
  // );

  const sleep = time => new Promise(resolve => setTimeout(resolve, time));

  const backgroundUploadTask = async (
    taskData,
    onProgressUpdate,
    onFileChange,
    onUploadError,
  ) => {
    const {files} = taskData;
    let totalSteps = 0;
    let completedSteps = 0;

    try {
      // 1. Request notification permission (Android 13+)
      await requestPermission();

      // 2. Create notification channel
      PushNotification.createChannel(
        {
          channelId: 'upload-channel',
          channelName: 'Upload Notifications',
          channelDescription: 'Notifications for file upload progress',
          importance: 4,
          vibrate: true,
        },
        created => console.log(`Notification channel created: ${created}`),
      );

      // 3. Show initial notification
      PushNotification.localNotification({
        channelId: 'upload-channel',
        id: NOTIFICATION_ID,
        title: 'Upload in progress',
        message: 'Preparing to upload files...',
        ongoing: true,
      });

      // 4. Calculate total upload steps
      for (let file of files) {
        const presignedUrls = await getPresignedUrls(file);
        totalSteps += presignedUrls.length;
      }

      // 5. Start uploading each file
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const currentFileName = file.name || file.fileName || 'Unnamed File';
        onFileChange(currentFileName);

        const extension = getExtensionFromUri(file.uri);
        const format = getFormatFromExtension(extension);
        const mimeType = file.type;
        const originalWidth = file.width;
        const originalHeight = file.height;
        const presignedUrls = await getPresignedUrls(file);
        const media_variants = [];

        for (let urlIndex = 0; urlIndex < presignedUrls.length; urlIndex++) {
          const url = presignedUrls[urlIndex];
          let resizedFile = file;
          const targetSize = getTargetSizeForKey(url.key);

          // Generate video thumbnail if needed
          if (
            url.key === 'thumb_video_image' &&
            file.type.startsWith('video/')
          ) {
            try {
              const thumbnail = await createThumbnail({
                url: file.uri,
                timeStamp: 1000,
              });

              resizedFile = {
                uri: thumbnail.path,
                width: thumbnail.width,
                height: thumbnail.height,
                fileName: `${file.fileName || 'video'}_thumbnail.png`,
                type: 'image/png',
                size: 0,
              };
            } catch (error) {
              console.warn('Failed to generate video thumbnail:', error);
            }
          } else if (targetSize) {
            const {width, height} = calculateAspectFitSize(
              originalWidth,
              originalHeight,
              targetSize.width,
              targetSize.height,
            );
            resizedFile = await resizeImage(file, width, height, format);
          }

          // Upload file to S3
          const uploadedUrl = await uploadToS3(
            url.url,
            resizedFile.uri,
            mimeType,
          );
          if (!uploadedUrl) continue;

          media_variants.push({
            key: url.key,
            filename: getFileNameFromUrl(uploadedUrl),
            type: file.type,
            size: resizedFile.size || file.fileSize || 0,
          });

          // 6. Update progress
          completedSteps++;
          const progress = Math.round((completedSteps / totalSteps) * 100);
          onProgressUpdate(progress);

          // 📣 Update notification with current file name and progress
          PushNotification.localNotification({
            channelId: 'upload-channel',
            id: NOTIFICATION_ID,
            title: `Uploading: ${currentFileName}`,
            message: `Progress: ${progress}%`,
            ongoing: true,
          });

          await sleep(100);
        }

        // 7. Store metadata
        await storeMetadata({
          project_id: selectedJob.id,
          uuid: '59d09068-6f3d-482d-b166-fc29a8a13b31',
          media_variants,
        });
      }

      // 8. Final success notification
      onProgressUpdate(100);
      PushNotification.localNotification({
        channelId: 'upload-channel',
        id: NOTIFICATION_ID,
        title: 'Upload complete',
        message: 'All files have been uploaded successfully.',
        ongoing: false,
      });
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error);

      // ❌ Error Notification
      PushNotification.localNotification({
        channelId: 'upload-channel',
        id: NOTIFICATION_ID,
        title: 'Upload failed',
        message: 'An error occurred during upload.',
        ongoing: false,
      });
    } finally {
      await BackgroundService.stop();
    }
  };

  const handleUploadError = error => {
    Alert.alert(
      'Upload Failed',
      'Something went wrong during upload. Please try again.',
    );
    setUploading(false); // Close modal or spinner
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isFetchingMore) {
      onRefresh(page + 1); // Load next page
    }
  };

  const getPresignedUrls = async file => {
    try {
      const {access_token} = await getLoginDetails();
      const formData = new FormData();
      formData.append('project_id', selectedJob.id);
      formData.append('filename', file.fileName);
      formData.append('type', file.type);

      const {data} = await axios.post(
        `${config.baseUrl}contractor/get-presinged-urls`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const urls = data?.presigned_urls || [];
      if (!urls.length) {
        throw new Error('No presigned URLs returned');
      }

      return urls;
    } catch (error) {
      console.error('❌ Error getting presigned URLs:', error.response);
      throw error; // Let the upload function handle this
    }
  };

  const getExtensionFromUri = uri =>
    uri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/)?.[1].toUpperCase() || 'JPEG';

  const getFormatFromExtension = ext => {
    switch (ext) {
      case 'PNG':
      case 'WEBP':
        return ext;
      case 'JPG':
      case 'JPEG':
      default:
        return 'JPEG';
    }
  };

  const uploadToS3 = async (url, fileUri, mimeType) => {
    try {
      const blob = await fetch(fileUri).then(res => res.blob());
      const result = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': mimeType},
        body: blob,
      });

      if (!result.ok)
        throw new Error(`Upload failed with status ${result.status}`);
      return url;
    } catch (error) {
      console.error('❌ Upload error:', error);
      return null;
    }
  };

  const calculateAspectFitSize = (
    originalWidth,
    originalHeight,
    maxWidth,
    maxHeight,
  ) => {
    const ratio = Math.min(
      maxWidth / originalWidth,
      maxHeight / originalHeight,
    );
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  };

  const getFileNameFromUrl = url => {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
  };

  const resizeImage = async (file, width, height, format) => {
    return ImageResizer.createResizedImage(
      file.uri,
      width,
      height,
      format,
      100,
    );
  };

  const storeMetadata = async ({project_id, uuid, media_variants}) => {
    try {
      const {access_token} = await getLoginDetails();
      const formData = new FormData();
      formData.append('project_id', project_id);
      formData.append('uuid', uuid);

      media_variants.forEach((variant, index) => {
        formData.append(`media_variants[${index}][key]`, variant.key);
        formData.append(`media_variants[${index}][filename]`, variant.filename);
        formData.append(`media_variants[${index}][type]`, variant.type);
        formData.append(`media_variants[${index}][size]`, String(variant.size));
      });

      const {data} = await axios.post(
        `${config.baseUrl}contractor/store-metadata`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      console.log('✅ Metadata stored successfully:', data);
      fetchInitialData();
      return data;
    } catch (error) {
      console.error(
        '❌ Failed to store metadata:',
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  const getTargetSizeForKey = key => {
    switch (key) {
      case 'gallery':
        return {width: 1900, height: 1900};
      case 'small':
        return {width: 80, height: 80};
      case 'thumbnail':
        return {width: 218, height: 218};
      case 'pdfimage':
        return {width: 600, height: 450};
      default:
        return null;
    }
  };

  const processAndUpload = async files => {
    // const files = await pickImage();
    if (!files) return;

    setUploadingStatus({
      processing: 0,
      completed: 0,
      total: files.length,
      inProgress: true,
    });

    const options = {
      taskName: 'Uploader',
      taskTitle: 'Uploading files',
      taskDesc: 'Your files are uploading in the background',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#ff00ff',
      linkingURI: 'yourSchemeHere://myapp',
      parameters: {
        files,
      },
    };

    try {
      const check = BackgroundService.isRunning();
      if (check) {
        await BackgroundService.start(data => {
          setIsUploading(true);
          backgroundUploadTask(
            data,
            progress => setUploadProgress(progress),
            fileName => setCurrentUploadFileName(fileName),
            handleUploadError,
          ).then(() => {
            setIsUploading(false);
            setCurrentUploadFileName('');
          });
        }, options);
      } else {
        setIsUploading(true);
        backgroundUploadTask(
          {files},
          progress => setUploadProgress(progress),
          fileName => setCurrentUploadFileName(fileName),
          handleUploadError,
        ).then(() => {
          setIsUploading(false);
          setCurrentUploadFileName('');
        });
      }
    } catch (error) {
      console.warn('Background service not available, uploading directly.');
      // Fallback to direct upload
      setIsUploading(true);
      backgroundUploadTask(
        {files},
        progress => setUploadProgress(progress),
        fileName => setCurrentUploadFileName(fileName),
        handleUploadError,
      ).then(() => {
        setIsUploading(false);
        setCurrentUploadFileName('');
      });
    } finally {
      setUploadingStatus(prev => ({...prev, inProgress: false}));
    }
  };

  // const handleAddMediaAndUpload = async () => {
  //   try {
  //     // Step 1: Select multiple images and videos
  //     const response = await launchImageLibrary({
  //       mediaType: 'mixed',
  //       quality: 1,
  //       selectionLimit: 0,
  //     });
  //     if (response.didCancel) return false;
  //     if (response.errorCode) return false;
  //     // const res = await new Promise((resolve, reject) => {
  //     //   launchImageLibrary(
  //     //     {
  //     //       mediaType: 'mixed',
  //     //       quality: 1,
  //     //       selectionLimit: 0,
  //     //     },
  //     //     response => {
  //     //       if (response.didCancel) return reject('User cancelled');
  //     //       if (response.errorCode) return reject(response.errorMessage);
  //     //       resolve(response.assets);
  //     //     },
  //     //   );
  //     // });

  //     const assets = response.assets;

  //     const filesToUpload = [];

  //     // Step 2: Process each asset
  //     for (const asset of assets) {
  //       console.log(asset, 'asset');
  //       const {uri, type, fileName, width, height} = asset;

  //       // if (type.startsWith('image')) {
  //       //   // Resize to thumbnail
  //       //   const thumb = await ImageResizer.createResizedImage(
  //       //     uri,
  //       //     80,
  //       //     80,
  //       //     'JPEG',
  //       //     80,
  //       //   );

  //       //   // Resize to gallery
  //       //   const gallery = await ImageResizer.createResizedImage(
  //       //     uri,
  //       //     800,
  //       //     800,
  //       //     'JPEG',
  //       //     90,
  //       //   );

  //       //   filesToUpload.push(
  //       //     {uri, type, fileName}, // original
  //       //     {
  //       //       uri: thumb.uri,
  //       //       type: 'image/jpeg',
  //       //       fileName: `thumb_${fileName}`,
  //       //     },
  //       //     {
  //       //       uri: gallery.uri,
  //       //       type: 'image/jpeg',
  //       //       fileName: `gallery_${fileName}`,
  //       //     },
  //       //   );
  //       // } else if (type.startsWith('video')) {
  //       //   // Extract thumbnail for video
  //       //   // const preview = await ProcessingManager.getPreviewForSecond(uri, 1);
  //       //   // filesToUpload.push(
  //       //   //   {uri, type, fileName}, // original video
  //       //   //   {
  //       //   //     uri: preview.path || preview.uri,
  //       //   //     type: 'image/jpeg',
  //       //   //     fileName: `video_thumb_${fileName}.jpg`,
  //       //   //   },
  //       //   // );
  //       // }
  //     }

  //     // Step 3: Generate presigned URLs
  //     const presignReq = filesToUpload.map(file => ({
  //       filename: file.fileName,
  //       type: file.type,
  //     }));

  //     const {data} = await axios.post(`${config.baseUrl}/get-presigned-urls`, {
  //       files: presignReq,
  //     });

  //     const {presignedUrls} = data;

  //     // Step 4: Upload each file
  //     for (let i = 0; i < filesToUpload.length; i++) {
  //       const file = filesToUpload[i];
  //       const presignedUrl = presignedUrls[i];

  //       const fileBlob = {
  //         uri: file.uri,
  //         type: file.type,
  //         name: file.fileName,
  //       };

  //       await axios.put(presignedUrl, fileBlob, {
  //         headers: {'Content-Type': file.type},
  //       });

  //       console.log(`✅ Uploaded ${file.fileName}`);
  //     }

  //     console.log('🎉 All files uploaded!');
  //   } catch (err) {
  //     console.error('❌ Upload failed:', err);
  //   }
  // };

  // const handleAddMedia = useCallback(async () => {
  //   launchImageLibrary(
  //     {
  //       mediaType: 'mixed',
  //       quality: 1,
  //       selectionLimit: 0,
  //     },
  //     async response => {
  //       if (response.didCancel) {
  //         // console.log('User cancelled image picker');
  //         return;
  //       } else if (response.errorCode) {
  //         console.error('ImagePicker Error: ', response.errorMessage);
  //         Alert.alert('Error', 'Failed to select media.');
  //         return;
  //       }

  //       setUploading(true);
  //       try {
  //         const {access_token, contractor_id} = await getLoginDetails();
  //         const formData = new FormData();
  //         formData.append('contractor_id', contractor_id);
  //         formData.append('project_id', selectedJob.id);
  //         response.assets.forEach(asset => {
  //           formData.append('uploadfile[]', {
  //             uri: asset.uri,
  //             type: asset.type,
  //             name: asset.fileName || 'media',
  //           });
  //         });

  //         const uploadResponse = await axios.post(
  //           `${config.baseUrl}contractor/upload-photos-videos`,
  //           formData,
  //           {
  //             headers: {
  //               'Content-Type': 'multipart/form-data',
  //               Authorization: `Bearer ${access_token}`,
  //             },
  //           },
  //         );

  //         if (uploadResponse.data.status === 200) {
  //           // After successful upload, refresh the data from the first page
  //           await fetchPhotoVideos(1);
  //           Alert.alert('Success', 'Media uploaded successfully');
  //         } else {
  //           Alert.alert('Error', 'Failed to upload media.');
  //         }
  //       } catch (error) {
  //         console.error('Error uploading media:', error);
  //         Alert.alert('Error', 'Failed to upload media.');
  //       } finally {
  //         setUploading(false);
  //       }
  //     },
  //   );
  // }, [fetchPhotoVideos, selectedJob]);

  const openMediaMenu = item => {
    setSelectedMediaForMenu(item);
    setMediaMenuVisible(true);
  };

  // Function to close the media options menu
  const closeMediaMenu = () => {
    setSelectedMediaForMenu(null);
    setMediaMenuVisible(false);
  };

  // Function to handle setting the media as cover photo (placeholder)
  const handleSetAsCoverPhoto = media_id => {
    Alert.alert('Are you sure?', 'You want to set this file as cover photo!', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes, Set as Cover Photo!',
        onPress: async () => {
          setSettingCoverPhoto(true); // Show loading indicator
          try {
            const {access_token, contractor_id} = await getLoginDetails();
            const response = await axios.post(
              `${config.baseUrl}contractor/set-cover-photos`,
              {
                contractor_id: contractorId,
                project_id: selectedJob.id,
                media_id: media_id,
              },
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: `Bearer ${access_token}`,
                },
              },
            );

            if (response.data.success === true) {
              console.log('Cover photo set successfully');
              Alert.alert('Successfully', response.data.message);
              // TODO: Invalidate cache of current project to force refresh cover image
            } else {
              Alert.alert(
                'Error',
                response.data.message || 'Failed to set cover photo',
              );
            }
          } catch (error) {
            console.error('Error setting cover photo:', error);
            Alert.alert('Error', 'Failed to set cover photo');
          } finally {
            setSettingCoverPhoto(false); // Hide loading indicator
            closeMediaMenu(); // Close the menu
            console.log(
              'Set as Cover Photo : ' + media_id,
              contractorId,
              selectedJob.id,
            );
          }
        },
      },
    ]);
  };

  const handleRemoveMedia = useCallback(
    (uri, mediaId, date) => {
      Alert.alert(
        'Delete Media',
        'Are you sure you want to delete this media?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteMedia(uri, mediaId, date);
            },
          },
        ],
      );
    },
    [deleteMedia],
  );

  const deleteMedia = useCallback(
    async (uri, mediaId, date) => {
      setDeletingMediaUri(uri);
      setUploading(true);

      try {
        const {access_token, contractor_id} = await getLoginDetails();
        const response = await axios.post(
          `${config.baseUrl}contractor/delete-photos-videos`,
          {
            contractor_id: contractor_id,
            project_id: selectedJob.id,
            media_id: mediaId,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        if (response.data.status === 200) {
          setGroupedMedia(prev => {
            const filteredMedia = prev[date].filter(file => file.uri !== uri);
            if (filteredMedia.length === 0) {
              const {[date]: removed, ...rest} = prev;
              return rest;
            } else {
              return {...prev, [date]: filteredMedia};
            }
          });
        } else {
          Alert.alert('Failed', 'Failed to delete media');
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        Alert.alert('Error', 'Failed to delete media.');
      } finally {
        setUploading(false);
        setDeletingMediaUri(null);
      }
    },
    [selectedJob],
  );

  const renderItem = useCallback(
    ({item, index, date}) => {
      const isFocused = focusedIndex === index;
      const showDeleteButton = item.created_by === contractorId;
      const isDeleting = deletingMediaUri === item.uri;
      const hasNotes = item.notes && item.notes.trim() !== '';

      return (
        <TouchableOpacity
          style={styles.mediaCard}
          onPress={() => {
            console.log(item, 'item');
            setSelectedMedia(item);
            setModalVisible(true);
            setModalMediaLoading(true);
            setNotes(item.notes || ''); // Set initial notes in modal
            setNotesSaved(false);
            setShowNotesIndicator(hasNotes);
          }}>
          <>
            {item.type && item.type.toLowerCase().includes('image') ? (
              <FastImage // Use FastImage here
                source={{
                  uri: item.uri, // Use thumbnail if available
                  priority: FastImage.priority.high, // Or 'high', 'low'
                }}
                style={{
                  ...styles.image,
                  width: width * 0.3,
                  height: width * 0.3,
                  marginRight: 5,
                }}
                resizeMode={FastImage.resizeMode.cover} // Or 'contain', 'stretch', etc.
              />
            ) : item.type && item.type.toLowerCase().includes('video') ? (
              <View style={{position: 'relative', marginRight: 5}}>
                <Video
                  source={{uri: item.uri}}
                  style={{
                    ...styles.video,
                    width: width * 0.3,
                    height: width * 0.3,
                  }}
                  controls={true}
                  paused={true}
                  muted={true}
                  resizeMode="contain"
                  onError={error => console.log('Error playing video: ', error)}
                />
                <View style={styles.playButtonOverlay}>
                  <MaterialCommunityIcons
                    name="play-circle-outline"
                    size={40}
                    color="white"
                  />
                </View>
              </View>
            ) : null}

            {hasNotes && (
              <View style={styles.notesIconContainer}>
                <MaterialCommunityIcons
                  name="checkbox-marked-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
            )}

            <View style={styles.mediaTimeContainer}>
              <Text style={styles.timeText}>
                {moment(item.postedTime).format('hh:mm A')}
              </Text>
              <Text style={styles.timeText}>
                {moment(item.date).format('YYYY-MM-DD')}
              </Text>
            </View>

            {/* {showDeleteButton && (
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() =>
                  handleRemoveMedia(item.uri, item.mediaId, item.date)
                }>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="black" />
                )}
              </TouchableOpacity>
            )} */}

            {showDeleteButton && (
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => openMediaMenu(item)}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color="black"
                  />
                )}
              </TouchableOpacity>
            )}
          </>
        </TouchableOpacity>
      );
    },
    [
      deletingMediaUri,
      contractorId,
      openMediaMenu,
      handleRemoveMedia,
      setSelectedMedia,
      setModalVisible,
      setModalMediaLoading,
    ],
  );

  const renderDateSection = useCallback(
    ([date, mediaList]) => {
      return (
        <View key={date}>
          <Text style={styles.dateText}>
            {moment(date).format('YYYY-MM-DD')}
          </Text>
          <View style={styles.dateLine} />
          <FlatList
            numColumns={3}
            data={mediaList}
            keyExtractor={(item, index) => item.uri + item.date + index}
            renderItem={({item, index}) => renderItem({item, index, date})}
            onScroll={handleScroll}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No media selected</Text>
            }
            contentContainerStyle={styles.flatListContent}
            initialScrollIndex={0}
          />
        </View>
      );
    },
    [renderItem, handleScroll],
  );

  const handleRangeSelect = range => {
    let startDate, endDate;

    switch (range) {
      case 'Today':
        startDate = moment();
        endDate = moment();
        break;
      case 'Yesterday':
        startDate = moment().subtract(1, 'days');
        endDate = moment().subtract(1, 'days');
        break;
      case 'Last 7 Days':
        startDate = moment().subtract(6, 'days');
        endDate = moment();
        break;
      case 'Last 30 Days':
        startDate = moment().subtract(29, 'days');
        endDate = moment();
        break;
      case 'This Month':
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        break;
      case 'Last Month':
        startDate = moment().subtract(1, 'month').startOf('month');
        endDate = moment().subtract(1, 'month').endOf('month');
        break;
      case 'Custom Range':
        setShowCalendar(true);
        setMenuVisible(false);
        return;

      default:
        break;
    }

    if (startDate && endDate) {
      setSelectedRange({
        start: moment(startDate).format('MMMM D, YYYY'),
        end: moment(endDate).format('MMMM D, YYYY'),
      });

      onRefresh(1, startDate, endDate); // Reset to page 1 when applying date filter
    }

    setMenuVisible(false);
  };

  const handleFilterToggle = () => {
    if (filterText === 'Filter') {
      setMenuVisible(!menuVisible);

      setFilterText('Reset');
      setFilterIcon('vector-arrange-below');
    } else {
      setMenuVisible(false);
      setFilterText('Filter');
      setFilterIcon('filter');
    }
  };

  const handleResetFilter = () => {
    setMenuVisible(false);
    setSelectedRange(null);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setFilterText('Filter');
    setFilterIcon('filter');
    onRefresh(1); // Fetch all data without date filter, reset to page 1
  };

  const handleScroll = useCallback(
    event => {
      const layoutWidth = event.nativeEvent.layoutMeasurement.width;
      const contentOffsetX = event.nativeEvent.contentOffset.x;

      const centerOfScreen = layoutWidth / 2;

      let closestIndex = null;
      let minDistance = Infinity;

      for (const date in groupedMedia) {
        if (groupedMedia.hasOwnProperty(date)) {
          groupedMedia[date].forEach((_, index) => {
            const itemWidth = width * 0.3 + 10;
            const itemCenter = index * itemWidth + itemWidth / 2;
            const distance = Math.abs(
              itemCenter - (contentOffsetX + centerOfScreen),
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = index;
            }
          });
        }
      }

      setFocusedIndex(closestIndex);
    },
    [groupedMedia],
  );

  const handleModalLoad = () => {
    setModalMediaLoading(false);
  };

  const saveNotes = async () => {
    if (!selectedMedia) return;

    setSavingNotes(true);
    try {
      const {access_token, contractor_id} = await getLoginDetails();

      const formData = new FormData();
      formData.append('contractor_id', contractor_id);
      formData.append('project_id', selectedJob.id);
      formData.append('media_id', selectedMedia.mediaId);
      formData.append('note', notes);

      const response = await axios.post(
        `${config.baseUrl}contractor/add-notes-photos-videos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (response.data.status === 200) {
        Alert.alert('Success', 'Notes saved successfully!');
        setNotesSaved(true); // Set NotesSaved state to true
        setShowNotesIndicator(true);

        // Update the notes in the groupedMedia state
        setGroupedMedia(prevGroupedMedia => {
          const updatedGroupedMedia = {...prevGroupedMedia};
          for (const date in updatedGroupedMedia) {
            const mediaList = updatedGroupedMedia[date];
            const mediaIndex = mediaList.findIndex(
              media => media.mediaId === selectedMedia.mediaId,
            );
            if (mediaIndex !== -1) {
              updatedGroupedMedia[date][mediaIndex] = {
                ...updatedGroupedMedia[date][mediaIndex],
                notes: notes,
              };
              break;
            }
          }
          return updatedGroupedMedia;
        });
        // Update selected media locally
        setSelectedMedia(prevSelectedMedia => ({
          ...prevSelectedMedia,
          notes: notes,
        }));
      } else {
        Alert.alert('Error', 'Failed to save notes.');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const onDayPress = day => {
    if (!tempStartDate) {
      setTempStartDate(day.dateString);
      setTempEndDate(null);
    } else if (!tempEndDate) {
      if (day.dateString >= tempStartDate) {
        setTempEndDate(day.dateString);
      } else {
        setTempEndDate(tempStartDate);
        setTempStartDate(day.dateString);
      }
    } else {
      setTempStartDate(day.dateString);
      setTempEndDate(null);
    }
  };

  const confirmDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);

      setSelectedRange({
        start: moment(tempStartDate).format('MMMM D, YYYY'),
        end: moment(tempEndDate).format('MMMM D, YYYY'),
      });
      setShowCalendar(false);
      onRefresh(1, tempStartDate, tempEndDate); // Reset to page 1 when applying date range
    } else {
      Alert.alert('Please select a valid date range.');
    }
  };

  const resetDateRange = () => {
    setMenuVisible(false);
    setSelectedRange(null);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setFilterText('Filter');
    setFilterIcon('filter');
  };

  const handleCancelCalendar = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setShowCalendar(false);
  };

  const renderCustomDateRangeLabel = () => {
    if (selectedRange) {
      return `${selectedRange.start} - ${selectedRange.end}`;
    } else {
      const today = moment().format('MMMM D, YYYY');
      return `${today} - ${today}`;
    }
  };

  const markedDates = () => {
    if (tempStartDate && tempEndDate) {
      const startDate = new Date(tempStartDate);
      const endDate = new Date(tempEndDate);
      const dates = {};
      let currentDate = startDate;

      while (currentDate <= endDate) {
        const dateString = moment(currentDate).format('YYYY-MM-DD');
        dates[dateString] = {selected: true, color: 'blue'};
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    }
    return {};
  };

  const renderHeader = () => (
    <View>
      <Menu
        style={styles.menuStyle}
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={handleFilterToggle}>
            <Text>
              {selectedRange
                ? `${selectedRange.start} - ${selectedRange.end}`
                : `${moment().format('MMMM D, YYYY')} - ${moment().format(
                    'MMMM D, YYYY',
                  )}`}
            </Text>
          </TouchableOpacity>
        }>
        <Menu.Item onPress={() => handleRangeSelect('Today')} title="Today" />
        <Menu.Item
          onPress={() => handleRangeSelect('Yesterday')}
          title="Yesterday"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last 7 Days')}
          title="Last 7 Days"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last 30 Days')}
          title="Last 30 Days"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('This Month')}
          title="This Month"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Last Month')}
          title="Last Month"
        />
        <Menu.Item
          onPress={() => handleRangeSelect('Custom Range')}
          title="Custom Range"
        />
        <Divider />
        <Menu.Item onPress={handleResetFilter} title="Cancel" />
      </Menu>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingMore) {
      return (
        <View style={{paddingVertical: 20}}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      );
    } else if (page >= totalPages && Object.keys(groupedMedia).length > 0) {
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
            You have reached this project media. Tap to return to top
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const onDelete = useCallback(media_id => {
    setVideoImageListing(prevList =>
      prevList.filter(item => item.id !== media_id),
    );
  }, []);

  return (
    <View style={styles.container}>
      {uploadingStatus.inProgress && (
        <View style={styles.uploadStatusContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.uploadStatusText}>
            {uploadingStatus.completed}/{uploadingStatus.total}
          </Text>
        </View>
      )}
      {/* {apiLoading && initialLoad ? ( // Show loader if API is loading and it's the initial load
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{marginTop: '50%'}}
        />
      ) : Object.keys(groupedMedia).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTextCenter}>No Photos or Videos found.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef} // Attach the ref here
          data={Object.entries(groupedMedia)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => renderDateSection(item)}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter} // Add footer loading indicator
          onEndReached={handleLoadMore} // Load more data when reaching the end
          onEndReachedThreshold={0.5} // Trigger load more when 50% of the list is visible
        />
      )} */}
      <MediaGallery
        mediaList={videoImageListing}
        onLoadMore={handleLoadMore}
        isLoadingMore={false}
        totalPages={totalPages}
        currentPage={page}
        selectedJob={selectedJob}
        handleSetAsCoverPhoto={handleSetAsCoverPhoto}
        onDelete={onDelete}
        onRefresh={() => onRefresh(page)}
      />

      <View style={styles.topRightContainer}>
        {uploading && (
          <ActivityIndicator
            size="small"
            color="#007bff"
            style={{marginRight: 10}}
          />
        )}

        <ImageSelector onImagesSelected={uris => processAndUpload(uris)}>
          <View style={[styles.addButton, {opacity: uploading ? 0.5 : 1}]}>
            <MaterialCommunityIcons name="image-plus" size={20} color="white" />
          </View>
        </ImageSelector>
        {/* <TouchableOpacity
          style={[styles.addButton, {opacity: uploading ? 0.5 : 1}]}
          onPress={processAndUpload}
          disabled={uploading}>
          <MaterialCommunityIcons name="image-plus" size={20} color="white" />
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterToggle}>
          <MaterialCommunityIcons name={filterIcon} size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Media Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mediaMenuVisible}
        onRequestClose={closeMediaMenu}>
        <View style={styles.modalOverlay}>
          <View style={styles.mediaMenuContainer}>
            {/* <TouchableOpacity
              style={styles.mediaMenuItem}
              onPress={() => {
                handleSetAsCoverPhoto();
              }}>
              <Text>Set as Cover Photo</Text>
            </TouchableOpacity> */}
            {selectedMediaForMenu &&
              !(
                selectedMediaForMenu.type &&
                selectedMediaForMenu.type.toLowerCase().includes('video')
              ) && (
                <TouchableOpacity
                  style={styles.mediaMenuItem}
                  onPress={() => {
                    handleSetAsCoverPhoto();
                  }}>
                  <Text>Set as Cover Photo</Text>
                </TouchableOpacity>
              )}
            <TouchableOpacity
              style={styles.mediaMenuItem}
              onPress={() => {
                handleRemoveMedia(
                  selectedMediaForMenu.uri,
                  selectedMediaForMenu.mediaId,
                  selectedMediaForMenu.date,
                );
                closeMediaMenu();
              }}>
              <Text style={{color: 'red'}}>Remove File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaMenuItem}
              onPress={closeMediaMenu}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView>
                {modalMediaLoading && (
                  <ActivityIndicator
                    size="large"
                    color="#007bff"
                    style={styles.modalLoader}
                  />
                )}
                {selectedMedia &&
                  selectedMedia.type &&
                  selectedMedia.type.toLowerCase().includes('image') && (
                    <FastImage // Use FastImage here
                      source={{
                        uri: selectedMedia.galleryUrl, // Use thumbnail if available
                        priority: FastImage.priority.high, // Or 'high', 'low'
                      }}
                      style={{width: '100%', height: 400}}
                      renderIndicator={() => null}
                      resizeMode={FastImage.resizeMode.cover} // Or 'contain', 'stretch', etc.
                      loadingRender={() => (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#007bff" />
                        </View>
                      )}
                    />
                  )}

                {selectedMedia &&
                  selectedMedia.type &&
                  selectedMedia.type.toLowerCase().includes('video') && (
                    <Video
                      source={{uri: selectedMedia.uri}}
                      style={styles.modalVideo}
                      controls={true}
                      resizeMode="contain"
                      onLoad={handleModalLoad}
                      paused={false}
                    />
                  )}

                {!notesSaved ? (
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add notes..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline={true}
                  />
                ) : null}

                <TouchableOpacity
                  style={styles.saveNotesButton}
                  onPress={saveNotes}
                  disabled={savingNotes || notesSaved}>
                  {savingNotes ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveNotesText}>Save Notes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => {
                  setModalVisible(false);
                  setNotes('');
                  setNotesSaved(false);
                  setShowNotesIndicator(false);
                }}>
                <Text style={styles.closeModalText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              onDayPress={onDayPress}
              markedDates={markedDates()}
            />
            <View style={styles.calendarButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelCalendar}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={confirmDateRange}>
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* <Modal visible={isUploading} transparent animationType="fade">
        <View style={styles.uploadModalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Uploading Files...</Text>
            <Text style={styles.fileNameText}>{currentUploadFileName}</Text>

            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, {width: `${uploadProgress}%`}]}
              />
            </View>
            <Text>{uploadProgress}%</Text>
          </View>
        </View>
      </Modal> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  menuStyle: {
    top: '35%',
    left: '50%',
    marginVertical: 5,
  },
  dateText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'left',
    marginVertical: 10,
  },
  dateLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'black',
    marginBottom: 10,
  },
  flatListContent: {
    paddingVertical: 10,
  },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    height: 120,
    position: 'relative',
    marginBottom: 8,
    // marginRight: 5,
  },
  image: {
    borderRadius: 5,
  },
  video: {
    borderRadius: 5,
    backgroundColor: 'black',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -20}, {translateY: -20}],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTimeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 1,
    alignItems: 'center',
    opacity: 0.5,
    height: 30,
  },
  timeText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeIcon: {
    position: 'absolute',
    top: -1,
    right: 2,
    backgroundColor: 'white',
    width: 22,
    height: 22,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  closeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginTop: '80%',
  },
  topRightContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 50,
    elevation: 10,
  },
  addButton: {
    marginRight: 10,
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 50,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mediaMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '80%', // Adjust width as needed
    maxWidth: 400, // Maximum width
    alignItems: 'stretch', // Ensure buttons stretch to full width
  },
  mediaMenuItem: {
    paddingVertical: 12, // Increased padding for better touch target
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Light border
    alignItems: 'center',
  },

  mediaMenuText: {
    fontSize: 16, // Readable font size
    color: '#333', // Darker text color
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalImage: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  modalVideo: {
    width: '100%',
    height: 400,
    marginBottom: 10,
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  closeModalText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextCenter: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveNotesButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveNotesText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '90%',
    maxWidth: 400,
  },
  calendar: {
    marginBottom: 10,
  },
  calendarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  applyButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: 'grey',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  existingNotes: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },

  notesIconContainer: {
    position: 'absolute',
    left: 5,
    top: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional background
    borderRadius: 12, // Make it circular
    padding: 2,
  },
  uploadStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: '100%',
    marginTop: 25,
  },

  uploadStatusText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Uploading Modal Style
  uploadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: 250,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginVertical: 10,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
});

export default PhotosVideoScreen;
