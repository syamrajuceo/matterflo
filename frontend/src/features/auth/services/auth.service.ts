import axios from 'axios';
import type { IRegisterRequest, IAuthResponse, IUser } from '../types/auth.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add request interceptor to include token
axios.interceptors.request.use(
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

// Add response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're not already on login/register pages
    // This prevents redirecting during login attempts
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't redirect if we're already on auth pages (login/register)
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async login(email: string, password: string): Promise<IAuthResponse> {
    const response = await axios.post<{ success: true; data: IAuthResponse }>(
      '/auth/login',
      { email, password }
    );
    return response.data.data;
  }

  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    const response = await axios.post<{ success: true; data: IAuthResponse }>(
      '/auth/register',
      data
    );
    return response.data.data;
  }

  async me(token: string): Promise<IUser> {
    const response = await axios.get<{ success: true; data: IUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  }
}

export const authService = new AuthService();

