import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URL for Zethub CRM
const API_BASE_URL = "https://crmserver.zethub.in";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
