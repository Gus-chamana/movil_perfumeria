import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiClient } from './api';

export interface UserProfile {
  id: string;
  email: string;
  rol: string;
  name: string;
  lastName: string;
  dni: string;
  address: string;
  district: string;
}

interface AuthContextType {
  userToken: string | null;
  userProfile: UserProfile | null;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (formData: any) => Promise<void>;
  logoutUser: () => void;
  updateUserProfile: (profileData: UserProfile) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Iniciar sesión llamando a la API Express + Supabase
  const loginUser = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      setUserToken(data.token);
      setUserProfile(data.profile);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Registro atómico en dos pasos
  const registerUser = async (formData: any) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', formData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Cerrar sesión limpiando la memoria
  const logoutUser = () => {
    setUserToken(null);
    setUserProfile(null);
  };

  // 4. Actualizar el perfil localmente en caliente
  const updateUserProfile = (profileData: UserProfile) => {
    setUserProfile(profileData);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userProfile,
        loginUser,
        registerUser,
        logoutUser,
        updateUserProfile,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
