// frontend-vite/src/api.js
import axios from "axios";
import { CustomerAuth } from "./config/firebase";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

//auto attach firebase token for customer
// Firebase returns cached token if valid, fetches new one if expired
API.interceptors.request.use(async (config) => {
  const user = CustomerAuth.currentUser;
  if (user) {
    //getIdToken() with no args uses cached token if valid n refreshes if expired
    const token = await user.getIdToken();// auto-refreshes if < 5 min left
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API; 
