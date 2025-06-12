import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Colors from '../../assets/styling/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Progress from 'react-native-progress';
import VerticalStepIndicator from '../../components/VerticalStepIndicator';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation

const icons = {
  Messages: 'message-processing',
  Documents: 'file-document-outline',
  Photos: 'image-multiple',
  Worksheets: 'google-spreadsheet',
  Payments: 'cash-multiple',
};

const OverviewComponent = ({
  projectOverviewData,
  milestoneData,
  currentPosition,
  generalInformation,
  jobActivity,
  selectedJob,
  itemData,
  onChangeTab,
}) => {
  const navigation = useNavigation();

  const getActivityRoute = label => {
    switch (label) {
      case 'Messages':
        return 'message';
      case 'Documents':
        return 'documents';
      case 'Photos':
        return 'photos';
      case 'Worksheets':
        return 'worksheet';
      case 'Payments':
        return 'Payments';
      default:
        return 'overview';
    }
  };

  const ActivityRow = ({label, value}) => {
    const routeName = getActivityRoute(label);

    return (
      <TouchableOpacity
        style={styles.activityValueRow}
        onPress={() => onChangeTab(routeName)}>
        <MaterialCommunityIcons
          name={icons[label]}
          size={20}
          color={'#888'}
          style={{marginHorizontal: 5}}
        />
        <Text style={styles.activityLabel}>{label}</Text>
        <Text
          style={{
            color: Colors.themeblue,
            fontSize: 16,
            fontWeight: 'bold',
            justifyContent: 'center',
          }}>
          {value}
        </Text>

        <Image
          source={require('../../assets/images/next.png')}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>
    );
  };

  const ContactRow = ({label, value}) => {
    return (
      <TouchableOpacity style={styles.activityValueRow}>
        <View style={styles.primaryView}>
          <Text style={styles.contactLabelHeader}>
            {label} {/* Wrapped with <Text> */}
          </Text>
          <Text style={styles.contactLabel}>
            {value} {/* Wrapped with <Text> */}
          </Text>
        </View>

        {/* <MaterialCommunityIcons
          name="pencil"
          size={24}
          color={Colors.next}
          style={{marginLeft: 10}}
        /> */}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView>
      <View style={styles.milestoneHeader}>
        <Text style={styles.milestoneHeaderText}>Milestones</Text>
        <Text style={styles.milestoneLastTouched}>
          In {projectOverviewData.currentstage}:{' '}
          <Text style={{fontWeight: 'bold'}}>
            {projectOverviewData.instatus}
          </Text>
        </Text>
      </View>
      <View style={[styles.verticalStepCard]}>
        <VerticalStepIndicator
          currentPosition={currentPosition}
          milestoneData={milestoneData}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Job Activity</Text>
        <Text style={styles.milestoneLastTouched}>
          Last Touched:{' '}
          <Text style={{fontWeight: 'bold'}}>
            {projectOverviewData.lasttouched}
          </Text>
        </Text>
      </View>

      <View style={styles.jobActivityCard}>
        <View style={styles.activityValuesContainer}>
          <ActivityRow
            label="Messages"
            value={jobActivity.communication_count}
          />
          <ActivityRow label="Documents" value={jobActivity.documents_count} />
          <ActivityRow label="Photos" value={jobActivity.images_count} />
          <ActivityRow
            label="Worksheets"
            value={jobActivity.worksheets_count}
          />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Primary Contact</Text>
      </View>

      <View style={styles.jobActivityCard}>
        <View style={styles.activityValuesContainer}>
          <ContactRow label="Name:" value={generalInformation.name} />
          {/* <ContactRow label="Company Name:" value={generalInformation.company_name} /> */}
          <ContactRow label="Address:" value={generalInformation.address} />
          <ContactRow
            label="Phone:"
            value={generalInformation.contact_number}
          />
          <ContactRow label="Email:" value={generalInformation.email} />
          {/* <ContactRow label="Lead Source:" value={generalInformation.lead_source} /> */}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    marginHorizontal: 20,
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
  verticalStepCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 400,
  },
  jobActivityCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  activityValuesContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignSelf: 'left',
  },
  activityValueRow: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.themePlaceHolder,
    flex: 1,
  },
  contactLabelHeader: {
    color: Colors.primaryLabel,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.themePlaceHolder,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  primaryView: {
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  editIcon: {
    marginLeft: 10,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  worksheetContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  milestoneHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  milestoneLastTouched: {
    fontSize: 16,
    color: Colors.themePlaceHolder,
  },

  jobCardHeader: {
    flexDirection: 'column',
    marginBottom: 8,
    flex: 1,
  },
  jobCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  jobCardAddress: {
    fontSize: 14,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 8,
  },
  jobCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 8,
  },
  jobCardAmount: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  jobCardDetailsText: {
    fontSize: 14,
    color: Colors.red,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  circleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  horizontalListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  arrowIndicator: {
    zIndex: 1,
    justifyContent: 'center',
  },
  flatListContentContainer: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  propertyChip: {
    height: 'auto',
    width: 'auto',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});
export default OverviewComponent;
