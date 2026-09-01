import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add request interceptor to attach token from localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('aaraish_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;