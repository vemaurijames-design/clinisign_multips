import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const ipsId = localStorage.getItem('ipsId');
  if (ipsId && ipsId !== 'null') config.headers['X-Ips-Id'] = ipsId;
  return config;
});

export default api;

export function apiOrigin() {
  const base = import.meta.env.VITE_API_URL || '/api';
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '');
  return '';
}
