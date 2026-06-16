import axios from 'axios';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const targetHost = hostname === 'localhost' ? '127.0.0.1' : hostname;
    return `http://${targetHost}:5000`;
  }
  return 'http://127.0.0.1:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token and Vapi private key
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fittrack_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const vapiPrivateKey = localStorage.getItem('fittrack_vapi_private_key');
      if (vapiPrivateKey) {
        config.headers['x-vapi-private-key'] = vapiPrivateKey;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
