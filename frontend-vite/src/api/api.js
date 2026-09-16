// frontend-vite/src/api.js
import axios from "axios";
import { CustomerAuth } from "../config/firebase";

import toast from 'react-hot-toast'; 

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Developer/admin auth (JWT cookie via protect.js) and customer auth (Firebase)
// are separate, non-interchangeable systems — see CLAUDE.md. Used to decide
// which requests should carry a Firebase bearer token vs the auth cookie only.
export const isDeveloperRoute = (url = '') =>
  url.includes('/api/auth/') ||
  url.includes('/api/properties/') ||
  url.includes('/api/admin/');

//auto attach firebase token for customer requests only
// Firebase returns cached token if valid, fetches new one if expired
API.interceptors.request.use(async (config) => {
  const user = CustomerAuth.currentUser;
  if (user && !isDeveloperRoute(config.url)) {
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
    if (error.response?.status === 401 && isDeveloperRoute(error.config?.url)) {
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
