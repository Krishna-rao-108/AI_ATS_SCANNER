import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, SignupRequest, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('ats_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authService.getMe();
      // In FastAPI backend, me returns { user_id: number }
      // We can also restore user email if stored in session or synthesize object
      const storedEmail = localStorage.getItem('ats_user_email') || 'user@atsanalyzer.com';
      const storedName = localStorage.getItem('ats_user_name') || 'Team Member';
      setUser({
        id: me.user_id,
        email: storedEmail,
        name: storedName,
      });
    } catch (error) {
      console.warn('Authentication token invalid or expired');
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      await authService.login(credentials);
      localStorage.setItem('ats_user_email', credentials.email);
      // Fetch current user id
      const me = await authService.getMe();
      setUser({
        id: me.user_id,
        email: credentials.email,
        name: credentials.email.split('@')[0],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupRequest): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await authService.signup(payload);
      localStorage.setItem('ats_user_name', payload.name);
      localStorage.setItem('ats_user_email', payload.email);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('ats_user_email');
    localStorage.removeItem('ats_user_name');
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
