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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      await AsyncStorage.removeItem('userToken');
      // For mobile: use expo-router to redirect
      // For web: window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/(auth)/LoginScreen';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
