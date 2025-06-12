import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import {Text, Card} from 'react-native-paper';
import * as Progress from 'react-native-progress';
import Colors from '../../../assets/styling/colors';
import {fetchCoverPhoto} from '../../../services/leadInfoService';

const JobCardHeader = ({selectedJob, itemData}) => {
  const isDarkMode = useColorScheme() === 'dark';

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(true);

  useEffect(() => {
    if (selectedJob?.id) {
      onFetchCoverImage();
    }
  }, [selectedJob]);

  const onFetchCoverImage = async () => {
    try {
      setCoverPhotoLoading(true);
      const response = await fetchCoverPhoto(selectedJob.id);
      setCoverPhoto(response);
    } catch (error) {
      // handle error if needed
    } finally {
      setCoverPhotoLoading(false);
    }
  };

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
      );
      return {textColor, backgroundColor};
    },
    [isDarkMode],
  );

  const jobCard = {
    name: selectedJob?.name || '',
    address: selectedJob?.address || '---',
    amount: '$' + selectedJob?.balancedue?.totalAmount,
    details: '$' + selectedJob?.balancedue?.balanceDue,
  };

  const percentage = selectedJob?.balancedue?.percentage || 0;

  const circleText =
    itemData?.currentStage?.charAt(0)?.toUpperCase() ||
    selectedJob?.stage_name?.charAt(0)?.toUpperCase() ||
    'N';

  const circleInfo = getCircleInfo(
    itemData?.currentStage || selectedJob?.stage_name,
  );
  const passedTextColor = itemData?.textColor;

  return (
    <Card style={styles.card}>
      <View style={styles.coverContainer}>
        {coverPhotoLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Image
            source={{uri: coverPhoto?.resizeimage}}
            style={styles.coverPhoto}
          />
        )}

        {/* Overlay job info on image */}
        <View style={styles.overlay}>
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
          <View style={styles.titleInfo}>
            <Text style={styles.jobName}>{jobCard.name}</Text>
            <Text style={styles.jobAddress}>{jobCard.address}</Text>
          </View>
        </View>
      </View>

      <Card.Content>
        <View style={styles.divider} />
        <View style={styles.detailsRow}>
          <Text style={styles.amountText}>{jobCard.amount}</Text>
          <Text style={styles.balanceText}>{jobCard.details}</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>{percentage + '%'}</Text>
          <Progress.Bar
            progress={percentage / 100}
            width={null}
            height={6}
            borderWidth={0}
            style={styles.progressBar}
            borderRadius={8}
            unfilledColor={Colors.red}
            color={percentage === 100 ? Colors.red : Colors.success}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

export default JobCardHeader;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    elevation: 4,
  },

  coverContainer: {
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  jobAddress: {
    fontSize: 13,
    color: '#f0f0f0',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  amountText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  balanceText: {
    fontSize: 14,
    color: Colors.themePlaceHolder,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.themePlaceHolder,
    minWidth: 50,
  },
  progressBar: {
    flex: 1,
  },
});
