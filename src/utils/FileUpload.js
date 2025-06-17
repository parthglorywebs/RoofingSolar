import {NativeModules} from 'react-native';

const {RNFileUploader} = NativeModules; // Make sure this matches your module name (getName())

export default {
  startUpload: options => {
    return RNFileUploader.startUpload(options);
  },
  getFileInfo: path => {
    return RNFileUploader.getFileInfo(path);
  },
  cancelUpload: uploadId => {
    return RNFileUploader.cancelUpload(uploadId);
  },
  stopAllUploads: () => {
    return RNFileUploader.stopAllUploads();
  },
};
