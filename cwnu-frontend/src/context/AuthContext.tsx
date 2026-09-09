import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User, UserRole, LoginCredentials, RegisterData, ProfileUpdateData, PasswordResetRequest, PasswordResetConfirm, ChangePasswordData } from '../types';

function normalizeUser(user: User): User {
  return { ...user, role: user.role.toLowerCase() as UserRole };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(normalizeUser(response.data));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser && api.isAuthenticated()) {
        try {
          setUser(normalizeUser(JSON.parse(storedUser)));
          await refreshUser();
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    setUser(normalizeUser(response.data.user));
  };

  const register = async (data: RegisterData) => {
    const response = await api.register(data);
    setUser(normalizeUser(response.data.user));
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const requestPasswordReset = async (data: PasswordResetRequest) => {
    await api.requestPasswordReset(data);
  };

  const confirmPasswordReset = async (data: PasswordResetConfirm) => {
    await api.confirmPasswordReset(data);
  };

  const changePassword = async (data: ChangePasswordData) => {
    await api.changePassword(data);
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    const response = await api.updateProfile(data);
    setUser(response.data);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const response = await api.uploadAvatar(file);
    const avatarUrl = response.data.avatarUrl;
    setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
    return avatarUrl;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
        updateProfile,
        uploadAvatar,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}