import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import Colors from '../assets/styling/colors';

const stages = ['lead', 'prospect', 'approve', 'completed', 'invoice'];

const FilterActionSheet = forwardRef(({onSelect, onReset}, ref) => {
  const [selected, setSelected] = useState(null);

  useImperativeHandle(ref, () => ({
    show: () => {
      actionSheetRef?.current?.show();
    },
    hide: () => {
      actionSheetRef?.current?.hide();
    },
    setSelected,
  }));

  const actionSheetRef = React.useRef();

  const handleSelect = stage => {
    setSelected(stage);
    onSelect(stage);
    actionSheetRef.current?.hide();
  };

  return (
    <ActionSheet ref={actionSheetRef}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter by Stage</Text>
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.reset}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {stages.map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.option, selected === stage && styles.selectedOption]}
            onPress={() => handleSelect(stage)}>
            <Text
              style={[
                styles.optionText,
                selected === stage && styles.selectedOptionText,
              ]}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ActionSheet>
  );
});

export default FilterActionSheet;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  reset: {
    color: Colors.primary,
  },
  option: {
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: Colors.primary + '33',
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
