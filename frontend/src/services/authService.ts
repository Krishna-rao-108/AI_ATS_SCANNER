import { apiClient, setStoredToken } from './apiClient';
import type { LoginRequest, SignupRequest, AuthResponse, MeResponse, User } from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<string> {
    const data = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    if (!data.access_token) {
      throw new Error(data.message || 'Invalid email or password');
    }
    setStoredToken(data.access_token);
    return data.access_token;
  },

  async signup(payload: SignupRequest): Promise<User> {
    const user = await apiClient.post<User>('/api/auth/signup', payload);
    return user;
  },

  async getMe(): Promise<MeResponse> {
    return apiClient.get<MeResponse>('/api/auth/me');
  },

  logout(): void {
    setStoredToken(null);
  },
};
