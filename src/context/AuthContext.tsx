import React, { createContext, useState, useContext, ReactNode } from 'react';
import { loginAPI } from '../services/apiService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'ADMIN' | 'MOTORIZADO';
  dni?: string;
  direcciones?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await loginAPI(email, password);
      const backendUser = data.usuario;
      
      // Mapear nombre completo
      let name = 'Cliente Noir';
      if (backendUser.datosPersonales) {
        name = `${backendUser.datosPersonales.nombre} ${backendUser.datosPersonales.apellidoPaterno}`;
      } else if (backendUser.rol === 'ADMIN') {
        name = 'Administrador Noir';
      } else if (backendUser.rol === 'MOTORIZADO') {
        name = 'Juan Motorizado';
      }

      setToken(data.token);
      setUser({
        id: backendUser.id,
        name,
        email: backendUser.email,
        role: backendUser.rol,
        dni: backendUser.datosPersonales?.dni || undefined,
        direcciones: backendUser.direcciones || [],
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateUser = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
