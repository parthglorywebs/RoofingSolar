import axios from 'axios';
import config from '../../config/config';
import { getLoginDetails } from '../../utils/AsyncStorage';

const apiService = {
    async post(endpoint, data, customHeaders = {}) {
        try {
            const { access_token } = await getLoginDetails();
            const headers = {
                Authorization: `Bearer ${access_token}`,
                ...customHeaders,
            };


            const response = await axios.post(`${config.baseUrl}${endpoint}`, data, { headers });

            if (response.data && response.data.error) {
             console.error('API Error:', response.data.error);
             throw new Error(response.data.error)
           }

            return response.data;

        } catch (error) {
            console.error('API Error:', error);
             if (axios.isAxiosError(error)) {
                if (error.response) {
                      console.error("Error Data:", error.response.data)
                      console.error("Error Status:", error.response.status)
                      console.error("Error Header:", error.response.headers)
                      throw new Error(`API request failed with status ${error.response.status}. ${JSON.stringify(error.response.data)}`);

                 } else if (error.request) {
                        console.error('No response received from server.');
                      throw new Error('No response received from server.');
                 } else {
                     // Something happened in setting up the request that triggered an Error
                     console.error('Error during request setup:', error.message);
                       throw new Error(`Error during request setup: ${error.message}`);
                 }

             } else {
                    console.error('Error during API call:', error.message);
                  throw new Error(`Error during API call: ${error.message}`);
             }

        }
    },
};

export default apiService;