import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8081/api',
    withCredentials: false,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur de réponse — si token expiré, rediriger vers login
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const message = error.response?.data?.message;
            if (message === 'Expired JWT Token') {
                // Supprimer le token expiré
                localStorage.removeItem('token');
                // Rediriger vers login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
/*import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8081/api',
    timeout: 8000,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const msg = error.response?.data?.message;
            if (msg === 'Expired JWT Token' || msg === 'JWT Token not found') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;*/