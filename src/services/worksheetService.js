import axios from 'axios';
import {getLoginDetails} from '../utils/AsyncStorage';
import config from '../config/config';

export const fetchCategories = async projectId => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/get-financial-worksheet-categories`,
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
    const categoriesList = sources.data ?? [];

    if (categoriesList?.length > 0) {
      return categoriesList;
    }

    return [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const getFinancialWorksheet = async projectId => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/get-financial-worksheet`,
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
    const worksheetData = sources.data ?? {};

    return worksheetData;
  } catch (error) {
    console.error('Error fetching getFinancialWorksheet:', error);
    throw error;
  }
};

export const addNewFinancialWorksheetCategory = async data => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/add-financial-worksheet-categories`,
      {
        contractor_id: contractor_id,
        project_id: data.projectId,
        categorie_id: data.category_id,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    console.log(sources, 'sources');

    const worksheetData = sources.data ?? {};

    return worksheetData;
  } catch (error) {
    console.error('Error fetching getFinancialWorksheet:', error);
    throw error;
  }
};

export const storeFinancialWorksheetData = async data => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/store-financial-worksheet-data`,
      {
        contractor_id: contractor_id,
        project_id: data.projectId,
        worksheet_id: data.worksheet_id,
        title: data.title,
        amount: data.amount,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    const worksheetData = sources.data ?? {};

    return worksheetData;
  } catch (error) {
    console.error(
      'Error fetching getFinancialWorksheet:',
      error.response?.data,
    );
    throw error;
  }
};

export const updateFinancialWorksheetData = async data => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/update-financial-worksheet-data`,
      {
        contractor_id: contractor_id,
        project_id: data.projectId,
        item_id: data.item_id,
        title: data.title,
        amount: data.amount,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    const worksheetData = sources.data ?? {};

    return worksheetData;
  } catch (error) {
    console.error('Error fetching getFinancialWorksheet:', error);
    throw error;
  }
};

export const deleteFinancialWorksheetData = async data => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/delete-financial-worksheet-categories-item`,
      {
        contractor_id: contractor_id,
        project_id: data.projectId,
        item_id: data.item_id,
        categorie_id: data.categorie_id,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    const worksheetData = sources.data ?? {};

    return worksheetData;
  } catch (error) {
    console.error('Error fetching deleteFinancialWorksheetData:', error);
    throw error;
  }
};
