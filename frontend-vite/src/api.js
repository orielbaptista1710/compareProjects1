// frontend-vite/src/api.js
import axios from "axios";
import { CustomerAuth } from "./config/firebase";

import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  withCredentials: true,
});

//auto attach firebase token for customer
// Firebase returns cached token if valid, fetches new one if expired
API.interceptors.request.use(async (config) => {
  const user = CustomerAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// global response interceptor — handles 401 across entire app
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // only redirect on 401 if it's a developer/admin route
    // don't redirect customer firebase auth routes
    const url = error.config?.url || '';
    const isDeveloperRoute = url.includes('/api/auth/') || 
                             url.includes('/api/properties/') || 
                             url.includes('/api/admin/');

    if (error.response?.status === 401 && isDeveloperRoute) {
      // avoid showing toast on login page itself
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }

    return Promise.reject(error);
  }
);

export default API; 
