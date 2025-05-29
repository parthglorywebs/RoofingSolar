import {useNavigation} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {FlatList, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Avatar, Card, Divider} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const pipelineColorMap = {
  lead: '#E8EFFB',
  prospect: '#FCF5E5',
  approve: '#DCF6E9',
  completed: '#E5F6FB',
  invoice: '#EDE7FB',
  closed: '#F9F1F0',
};

const LoadCard = ({item, onPress}) => {
  const isPaid = item.balancedue?.balanceDue === '0.00';
  const totalAmount = item?.balancedue?.totalAmount;
  const balanceDue = item?.balancedue?.balanceDue;
  const paymentStatus = `${item.balancedue?.percentage ?? 0}%`;
  const stage = item.currentstage.charAt(0).toUpperCase();

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(item)}>
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={`${item.id}: ${item.title}`}
          left={() => (
            <Avatar.Text
              label={stage}
              size={40}
              style={{
                backgroundColor: pipelineColorMap[item.currentstage] || '#ccc',
              }}
            />
          )}
          right={() => (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              style={styles.chevron}
            />
          )}
        />
        <Card.Content>
          <View style={styles.row}>
            <MaterialCommunityIcons name="phone" size={16} />
            <Text style={styles.infoText}>{item.phone ?? 'N/A'}</Text>
            <MaterialCommunityIcons
              name="email"
              size={16}
              style={styles.iconSpacing}
            />
            <Text style={styles.infoText}>{item.user_email ?? 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker" size={16} />
            <Text style={[styles.infoText, styles.linkText]}>
              {item.address}
            </Text>
          </View>

          <Divider style={{marginVertical: 8}} />

          <View style={styles.rowBetween}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.amountText}>
                {Number(totalAmount).toLocaleString('en-US', {
                  currency: 'USD',
                  style: 'currency',
                })}{' '}
              </Text>
              <Text
                style={[styles.changeText, {color: isPaid ? 'green' : 'red'}]}>
                {Number(balanceDue).toLocaleString('en-US', {
                  currency: 'USD',
                  style: 'currency',
                })}{' '}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={{marginRight: 4}}>{paymentStatus}</Text>
              {isPaid ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  color="green"
                  size={16}
                />
              ) : (
                <View
                  style={[styles.bar, {backgroundColor: 'red', width: 30}]}
                />
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const LoadListing = ({data, itemData}) => {
  const navigation = useNavigation();
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
  return (
    <View style={{marginTop: 15}}>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.container}
        renderItem={({item}) => (
          <LoadCard item={item} onPress={handlePropertyDetail} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  card: {
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    marginRight: 8,
    fontSize: 14,
  },
  linkText: {
    color: '#2196F3',
  },
  iconSpacing: {
    marginLeft: 8,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  changeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'green',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginRight: 12,
    alignSelf: 'center',
  },
});

export default LoadListing;
