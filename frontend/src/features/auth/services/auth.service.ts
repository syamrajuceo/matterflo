import axios from 'axios';
import type { IRegisterRequest, IAuthResponse, IUser } from '../types/auth.types';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add request interceptor to include token and company context
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Include active company ID in header for developers switching companies
    // Only add if company ID exists and is not empty
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (activeCompanyId && activeCompanyId.trim()) {
      config.headers['x-company-id'] = activeCompanyId;
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
        console.log('[Auth] 401 Unauthorized - clearing auth and logging out', {
          path: currentPath,
          url: error.config?.url,
        });
        
        // Clear auth state in Zustand store first (this updates the store synchronously)
        const clearAuth = useAuthStore.getState().clearAuth;
        clearAuth();
        
        // Clear localStorage (Zustand persist will also clear this, but be explicit)
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        
        // Dispatch custom event for React Router to handle navigation
        // This avoids full page reload - AuthLogoutHandler in App.tsx will use navigate()
        // Use requestAnimationFrame to ensure state is cleared and DOM is ready
        requestAnimationFrame(() => {
          console.log('[Auth] Dispatching auth:logout event');
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'unauthorized' } }));
        });
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

