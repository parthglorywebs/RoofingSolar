import axios from 'axios';
import config from '../config/config';
import {getLoginDetails} from '../utils/AsyncStorage';
import {getImageUrlByType} from '../utils/common';
import {Alert} from 'react-native';

export const fetchCoverPhoto = async projectId => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/get-cover-photos`,
      {
        contractor_id: contractor_id,
        project_id: projectId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    const leadCoverDetail = sources?.data?.data;
    if (sources && sources.success && leadCoverDetail) {
      const thumbUrl = getImageUrlByType(
        leadCoverDetail.project_image,
        'thumbnail',
      );
      const gallery = getImageUrlByType(
        leadCoverDetail.project_image,
        'gallery',
      );
      return {
        id: leadCoverDetail.id,
        project_id: leadCoverDetail.project_id,
        project_image: gallery,
        resizeimage: thumbUrl,
        compressimage: leadCoverDetail.compressimage,
        date: leadCoverDetail.date,
        time: leadCoverDetail.time,
        media_type: leadCoverDetail.media_type,
        notes: leadCoverDetail.notes,
        credit_image: leadCoverDetail.credit_image,
        tags: leadCoverDetail.tags,
        thumb_video_image: leadCoverDetail.thumb_video_image,
        created_by: leadCoverDetail.created_by,
        created_at: leadCoverDetail.created_at,
        updated_at: leadCoverDetail.updated_at,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetchCoverPhoto:', error);
    throw error;
  }
};

export const fetchProjectOverview = async projectId => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/get-project-overview`,
      {
        contractor_id: contractor_id,
        project_id: projectId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    if (sources && sources.data) {
      const general_information = sources.data.general_information;
      return {
        jobActivity: sources.data.job_activity,
        general_information: {
          name: general_information.customerName || '',
          company_name: general_information.company_name || '---',
          address: general_information.customerAddress || '',
          contact_number: general_information.customerPhone || '',
          email: general_information.customerEmail || '',
          lead_source: general_information.role || '',
        },
        milestone:
          sources.data.milestone && Array.isArray(sources.data.milestone)
            ? sources.data.milestone
            : [],
        projectOverviewData: {
          instatus: sources.data.instatus || '',
          currentstage: sources.data.currentstage || '',
          lasttouched: sources.data.lasttouched || '',
        },
      };
    }
    console.error('Invalid data format received from API:', data);
    Alert.alert('Error', 'Failed to load project data.');

    return null;
  } catch (error) {
    console.error('Error fetching project overview:', error);
    Alert.alert('Error', 'Failed to load project overview.');
    throw error;
  }
};
