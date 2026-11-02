import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();
// Normalize trailing slashes or /api suffix so Vercel env vars work in any format
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  try {
    const raw = localStorage.getItem('pulsestore-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore storage error
  }
  return config;
});
