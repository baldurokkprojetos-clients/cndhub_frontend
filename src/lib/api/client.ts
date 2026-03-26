import axios from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = normalizedBaseUrl.endsWith('/api/v1')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de auth, etc.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    const mockRole = localStorage.getItem('mock_role');
    const mockUserId = localStorage.getItem('mock_user_id');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (mockRole) {
      config.headers['X-User-Role'] = mockRole;
    }

    if (mockUserId) {
      config.headers['X-User-Id'] = mockUserId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento global de erros (ex: 401 Unauthorized)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('mock_user_id');
        localStorage.removeItem('mock_role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
