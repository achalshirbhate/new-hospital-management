import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production backend URL
export const BASE_URL = 'https://new-hospital-management-production.up.railway.app';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.clear();
    }
    return Promise.reject(err);
  }
);

export default api;
