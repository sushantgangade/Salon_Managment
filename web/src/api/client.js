import axios from 'axios';

const api = axios.create({
    //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://salon-managment-yi1q.onrender.com',
    baseURL: import.meta.env.VITE_API_URL || 'https://salon-managment-yi1q.onrender.com',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;