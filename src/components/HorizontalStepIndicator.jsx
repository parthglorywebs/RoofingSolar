import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import PropTypes from 'prop-types';
import Colors from '../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HorizontalStepIndicator = React.memo(({ labels, currentPosition, dates }) => {

  const renderStepIndicator = ({ position, stepStatus, label, index }) => {
    const isCurrent = position === currentPosition;
    let iconName = '';
    let iconColor = '';

    if (stepStatus === 'finished') {
        iconName = 'check';
        iconColor = 'white';
    } else if (isCurrent) {
        iconName = 'check';  // Show check for current
        iconColor = 'white'; // White check in current step
    } else {
        return null;
    }

    return (
      <View style={styles.iconContainer}>
          <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={iconColor}
          />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StepIndicator
        stepCount={labels.length}
        customStyles={stepIndicatorStyles}
        currentPosition={currentPosition}
        labels={labels}
        renderStepIndicator={renderStepIndicator}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
  },
  stepDate: {
    fontSize: 10,
    color: 'gray',
    textAlign: 'center',
  },
  iconContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
  }
});

const stepIndicatorStyles = {
  stepIndicatorSize: 25,
  currentStepIndicatorSize: 30,
  separatorStrokeWidth: 2,
  currentStepStrokeWidth: 3,
  stepStrokeCurrentColor: Colors.success,
  stepIndicatorCurrentColor: Colors.success, 
  stepStrokeFinishedColor: Colors.success, 
  stepIndicatorFinishedColor: Colors.success, 
  stepStrokeUnFinishedColor: Colors.unfinished,
  stepIndicatorUnFinishedColor: Colors.unfinished,
  separatorFinishedColor: Colors.success,
  separatorUnFinishedColor: Colors.unfinished,
  stepIndicatorLabelFontSize: 0,
  currentStepIndicatorLabelFontSize: 0,
  stepIndicatorLabelCurrentColor: 'transparent', 
  stepIndicatorLabelFinishedColor: 'transparent', 
  stepIndicatorLabelUnFinishedColor: 'transparent', 
  
};

HorizontalStepIndicator.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentPosition: PropTypes.number.isRequired,
  dates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default HorizontalStepIndicator;