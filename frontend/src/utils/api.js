import axios from 'axios';

// Автоматическое определение базового URL API
const getApiBaseUrl = () => {
  // Если фронтенд работает на localhost (разработка), используем localhost:8080
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  // В продакшене API находится на том же хосте что и фронтенд
  return `${window.location.protocol}//${window.location.hostname}:8080`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;