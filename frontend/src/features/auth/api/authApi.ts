import { apiClient, extractApiData, type ApiResponse } from '@/lib/api-client';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API functions
export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return extractApiData(response);
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return extractApiData(response);
  },

  /**
   * Get current user
   * GET /api/auth/me
   */
  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return extractApiData(response);
  },
};

