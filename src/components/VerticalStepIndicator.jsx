import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StepIndicator from 'react-native-step-indicator';
import Colors from '../assets/styling/colors';
import PropTypes from 'prop-types';

const VerticalStepIndicator = React.memo(({ milestoneData = [] }) => {
  const layoutRef = useRef(null);
  const { height } = useWindowDimensions();
  const adjustedHeight = height - 50;

  const handleLayout = useCallback(() => {
    layoutRef.current.setNativeProps({ style: { height: adjustedHeight } });
  }, [adjustedHeight]);

  const stepLabels = ['L', 'P', 'A', 'C', 'I'];
  const labels = ['LEAD', 'PROSPECT', 'APPROVED', 'COMPLETED', 'INVOICED', 'CLOSED'];
  const stepCount = labels.length;

  // Colors based on stage
  const stepColors = {
    lead: { text: Colors.lead, background: Colors.leadbg },
    prospect: { text: Colors.prospect, background: Colors.prospectbg },
    approve: { text: Colors.approved, background: Colors.approvedbg },
    completed: { text: Colors.completed, background: Colors.completedbg },
    invoice: { text: Colors.invoiced, background: Colors.invoicedbg },
    closed: { text: Colors.passwordToggle, background: Colors.unfinishedbg },
  };

  const dates = labels.map((_, index) => milestoneData[index]?.date || '');
  const detailLabel = labels.map((_, index) => milestoneData[index]?.betweentime || '');

  const currentPosition = milestoneData.findIndex(item => !item.date);
  const validCurrentPosition = currentPosition === -1 ? stepCount - 1 : currentPosition;

  const stepIndicatorSize = 35; // Define stepIndicatorSize
  const customStepStyles = {
    stepIndicatorSize: stepIndicatorSize, //Use stepIndicatorSize
    separatorStrokeWidth: 0.5,
    currentStepStrokeWidth: 0.5,
    stepStrokeWidth: 0.5,
    stepStrokeFinishedColor: Colors.unfinishedbg,
    stepStrokeUnFinishedColor: Colors.unfinishedbg,
    separatorFinishedColor: Colors.unfinishedbg,
    separatorUnFinishedColor: Colors.unfinishedbg,
    stepIndicatorFinishedColor: Colors.unfinishedbg,
    stepIndicatorUnFinishedColor: Colors.unfinishedbg,
    stepIndicatorLabelCurrentColor: Colors.leadbg,
    stepIndicatorLabelFinishedColor: Colors.leadbg,
    stepIndicatorLabelUnFinishedColor: Colors.leadbg,
    labelColor: Colors.lead,
    labelSize: 13,
    stepStrokeCurrentColor: milestoneData[validCurrentPosition]?.stage ? stepColors[milestoneData[validCurrentPosition]?.stage].text : Colors.unfinishedbg,
    stepIndicatorCurrentColor: milestoneData[validCurrentPosition]?.stage ? stepColors[milestoneData[validCurrentPosition]?.stage].background : Colors.unfinishedbg,
  };

  const renderStepIndicator = ({ position }) => {
    const stage = milestoneData[position]?.stage || 'closed';
    const hasDate = !!milestoneData[position]?.date;

    if (position === stepCount - 1) {
      return (
        <MaterialCommunityIcons
          name="check"
          size={customStepStyles.stepIndicatorSize - 10}
          color={hasDate ? Colors.primary : Colors.passwordToggle}
        />
      );
    }

    return (
      <Text
        style={[
          styles.labelText,
          hasDate ? { color: stepColors[stage]?.text } : { color: Colors.passwordToggle },
          hasDate
            ? {
                backgroundColor: stepColors[stage]?.background,
                padding: 0, // Remove padding
                borderRadius: stepIndicatorSize / 2, // Make it a circle
                width: stepIndicatorSize, // set width to stepIndicatorSize
                height: stepIndicatorSize, // set height to stepIndicatorSize
                textAlign: 'center', // center the text
                lineHeight: stepIndicatorSize, // Vertically align the text
                fontSize: 22 ? 22 : 15
              }
            : {},
        ]}
      >
        {stepLabels[position] || ''}
      </Text>
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout} ref={layoutRef}>
      <StepIndicator
        customStyles={customStepStyles}
        currentPosition={validCurrentPosition}
        stepCount={stepCount}
        direction="vertical"
        renderStepIndicator={renderStepIndicator}
      />

      <View style={styles.customLabels}>
        {labels.map((label, index) => {
          const stage = milestoneData[index]?.stage || 'closed';
          const hasDate = !!milestoneData[index]?.date;

          return (
            <View
              key={index}
              accessible={true}
              accessibilityLabel={`Step ${index + 1}: ${label}`}
              accessibilityRole="text"
            >
              <View style={styles.stepRow}>
                <Text
                  style={[
                    styles.labelText,
                    hasDate ? { color: stepColors[stage]?.text } : { color: Colors.passwordToggle },
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.dateText}> {dates[index]}</Text>
              </View>
              <Text style={styles.otherLabel}>{detailLabel[index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  customLabels: {
    position: 'absolute',
    left: '20%',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: 25,
    paddingBottom: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12 ? 14 : 16,
    fontWeight: 'bold',
  },
  otherLabel: {
    fontSize: 12,
    color: Colors.themePlaceHolder,
  },
  dateText: {
    fontSize: 14,
    color: Colors.themePlaceHolder,
  },
});

VerticalStepIndicator.propTypes = {
  milestoneData: PropTypes.arrayOf(
    PropTypes.shape({
      stage: PropTypes.oneOf(['lead', 'prospect', 'approve', 'completed', 'invoice', 'closed']).isRequired,
      date: PropTypes.string,
      betweentime: PropTypes.string,
    })
  ),
};


export default VerticalStepIndicator;