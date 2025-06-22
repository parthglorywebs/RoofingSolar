import axios from 'axios';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import PushNotification from 'react-native-push-notification';
import {createThumbnail} from 'react-native-create-thumbnail';
import BackgroundService from 'react-native-background-actions';
import config from '../config/config';
import {getLoginDetails} from './AsyncStorage';

/**
 * Get image URL by type from a media object.
 * Falls back to 'original' if the specified type is not available.
 * Optionally allows a final fallback URL if nothing is found.
 *
 * @param {Object} mediaObject - Object containing media URLs.
 * @param {string} type - Requested type (e.g., 'thumbnail', 'gallery').
 * @param {string|null} fallback - Final fallback if nothing is available.
 * @returns {string|null} - Image URL or fallback.
 */
export const getImageUrlByType = (mediaObject, type, fallback = null) => {
  if (!mediaObject || typeof mediaObject !== 'object') return fallback;

  const url = mediaObject[type];
  if (url) return url;

  // Fallback to 'original'
  return mediaObject.original || fallback;
};

export const sleep = time => new Promise(resolve => setTimeout(resolve, time));

export const getExtensionFromUri = uri =>
  uri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/)?.[1].toUpperCase() || 'JPEG';

export const getFormatFromExtension = ext => {
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

export const getFileNameFromUrl = url => {
  const cleanUrl = url.split('?')[0];
  return cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
};

export const calculateAspectFitSize = (
  originalWidth,
  originalHeight,
  maxWidth,
  maxHeight,
) => {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
};

export const resizeImage = async (file, width, height, format) => {
  return ImageResizer.createResizedImage(file.uri, width, height, format, 100);
};

export const uploadToS3 = (url, fileUri, mimeType, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', url);

    xhr.setRequestHeader('Content-Type', mimeType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(url); // upload succeeded, resolve with the S3 URL
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.responseText}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload.'));
    };

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
    }
    fetch(fileUri)
      .then(res => res.blob())
      .then(blob => {
        xhr.send(blob);
      })
      .catch(err => reject(err));
  });
};

export const getTargetSizeForKey = key => {
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

export const requestPermission = async () => {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    return Object.values(granted).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  return true;
};

export const getPresignedUrls = async file => {
  try {
    const {access_token} = await getLoginDetails();
    const formData = new FormData();
    formData.append('project_id', file.project_id);
    formData.append('filename', file.fileName);
    formData.append('type', file.type);

    const response = await axios.post(
      `${config.baseUrl}contractor/get-presinged-urls`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const urls = response.data?.presigned_urls || [];
    if (!urls.length) throw new Error('No presigned URLs returned');
    return urls;
  } catch (error) {
    console.error('❌ Error getting presigned URLs:', error.response || error);
    throw error;
  }
};

export const uploadSingleFile = async ({
  file,
  selectedJobId,
  onProgressUpdate,
  onFileChange,
  onUploadComplete,
}) => {
  const currentFileName = file.name || file.fileName || 'Unnamed File';
  const extension = getExtensionFromUri(file.uri);
  const format = getFormatFromExtension(extension);
  const mimeType = file.type;

  if (onFileChange) onFileChange(currentFileName);

  const presignedUrls = await getPresignedUrls({
    ...file,
    project_id: selectedJobId,
  });

  const media_variants = [];
  const fileNotificationId = Math.floor(1000 + Math.random() * 9000);
  PushNotification.localNotification({
    channelId: 'upload-channel',
    id: fileNotificationId,
    title: `Uploading: ${currentFileName}`,
    message: `Preparing ${currentFileName} variant...`,
    progress: 0,
    onlyAlertOnce: false,
    ongoing: false,
    playSound: false,
    vibrate: false,
    importance: 'high',
    visibility: 'public',
  });

  for (let i = 0; i < presignedUrls.length; i++) {
    const url = presignedUrls[i];
    let resizedFile = file;
    const targetSize = getTargetSizeForKey(url.key);
    const variantLabel = url.key.replace(/_/g, ' ');
    const fileName = `${variantLabel} - ${currentFileName}`;

    if (url.key === 'thumb_video_image' && mimeType.startsWith('video/')) {
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
        continue;
      }
    } else if (targetSize) {
      resizedFile = await resizeImage(
        file,
        targetSize.width,
        targetSize.height,
        format,
      );
    }
    const uploadedUrl = await uploadToS3(
      url.url,
      resizedFile.uri,
      mimeType,
      progress => {
        const percent = Math.round(
          ((i + progress / 100) / presignedUrls.length) * 100,
        );
        PushNotification.localNotification({
          channelId: 'upload-channel',
          id: fileNotificationId,
          title: `Uploading: ${fileName}`,
          message: `Uploading ${variantLabel}... ${progress.toFixed(0)}%`,
          progress: progress.toFixed(0),
          onlyAlertOnce: false,
          ongoing: false,
          playSound: false,
          vibrate: false,
          importance: 'high',
          visibility: 'public',
        });

        onProgressUpdate?.(percent);
      },
    );
    if (!uploadedUrl) continue;
    media_variants.push({
      key: url.key,
      filename:
        uploadedUrl
          .replace('https://roofing-stg.s3.us-west-1.amazonaws.com', '')
          .split('?')?.[0] ?? uploadedUrl,
      type: file.type,
      size: resizedFile.size || file.fileSize || 0,
    });

    await sleep(100);
  }
  PushNotification.localNotification({
    channelId: 'upload-channel',
    id: fileNotificationId,
    title: `Uploaded: ${currentFileName}`,
    message: `${currentFileName} upload completed ✅`,
    progress: 100,
    ongoing: false,
    playSound: false,
    vibrate: false,
    importance: 'high',
    visibility: 'public',
  });
  onUploadComplete?.({
    project_id: selectedJobId,
    uuid: '59d09068-6f3d-482d-b166-fc29a8a13b31',
    media_variants,
  });
};

const NOTIFICATION_ID = 10001;

export const uploadMultipleFiles = async ({
  files,
  selectedJobId,
  onProgressUpdate,
  onFileChange,
  onUploadError,
  onStoreMetaData,
}) => {
  const totalFiles = files.length;
  const fileProgressMap = new Map(); // Track progress per file (0-100)

  try {
    await requestPermission();

    // Initialize notifications for each file and overall
    files.forEach((file, index) => {
      const fileName = file.name || file.fileName || `File ${index + 1}`;
      const fileNotificationId = 10000 + index;

      // Initialize progress to 0
      fileProgressMap.set(fileNotificationId, 0);
    });

    // Upload all files concurrently, track progress per file
    await Promise.all(
      files.map((file, index) => {
        const fileName = file.name || file.fileName || `File ${index + 1}`;
        const fileNotificationId = 10000 + index;

        return uploadSingleFile({
          file,
          selectedJobId,
          onFileChange: name => {
            if (onFileChange) onFileChange(name);
          },
          onProgressUpdate: progress => {
            const p = Math.min(Math.round(progress), 100);
            fileProgressMap.set(fileNotificationId, p);

            // Calculate overall progress: average of all files
            const totalProgress = Math.round(
              Array.from(fileProgressMap.values()).reduce((a, b) => a + b, 0) /
                totalFiles,
            );

            if (onProgressUpdate) onProgressUpdate(totalProgress);
          },
          onUploadComplete: onStoreMetaData,
        }).then(() => {
          // After file upload completes, mark progress as 100% to be safe
          fileProgressMap.set(fileNotificationId, 100);
        });
      }),
    );
  } catch (error) {
    if (onUploadError) onUploadError(error);
  } finally {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
  }
};
