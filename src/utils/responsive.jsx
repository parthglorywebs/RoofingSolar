import {Dimensions, Platform} from 'react-native';

// Get device dimensions
const {width, height} = Dimensions.get('window');

// Function to check if the device is in portrait or landscape mode
export const isPortrait = () => height >= width;
export const isLandscape = () => width > height;

// Scale sizes dynamically
const guidelineBaseWidth = 375; // base width of iPhone 8
const guidelineBaseHeight = 667; // base height of iPhone 8

export const scaleSize = size => (width / guidelineBaseWidth) * size;
export const scaleFont = size => (height / guidelineBaseHeight) * size;

// Utility function for dynamic styling
export const responsive = size => {
  const scaleFactor = isPortrait() ? scaleSize(size) : scaleSize(size * 1.5);
  return Math.round(scaleFactor);
};

export const getGlobalStyles = () => ({
  container: {
    flexGrow: 1,
    padding: responsive(20),
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: responsive(16),
    color: '#000',
  },
  button: {
    paddingVertical: responsive(12),
    borderRadius: responsive(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
