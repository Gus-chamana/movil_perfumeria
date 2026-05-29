import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'ADMIN' | 'MOTORIZADO';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Normalizar email para evitar problemas de mayúsculas/minúsculas
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Simular un pequeño retardo de red para dar experiencia de carga prémium
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 1. Validar estrictamente los correos del sistema predefinidos
    if (normalizedEmail === 'admin@noinessence.com') {
      if (cleanPassword === 'admin123' || cleanPassword === 'Perfumeria123.') {
        setUser({
          id: 'usr_admin',
          name: 'Administrador Noir',
          email: 'admin@noinessence.com',
          role: 'ADMIN',
        });
        return { success: true };
      }
      return { success: false, error: 'Contraseña incorrecta para Administrador.' };
    }

    if (normalizedEmail === 'motorizado@noinessence.com') {
      if (cleanPassword === 'motorizado123' || cleanPassword === 'Perfumeria123.') {
        setUser({
          id: 'usr_moto',
          name: 'Juan Motorizado',
          email: 'motorizado@noinessence.com',
          role: 'MOTORIZADO',
        });
        return { success: true };
      }
      return { success: false, error: 'Contraseña incorrecta para Motorizado.' };
    }

    if (normalizedEmail === 'cliente@noinessence.com') {
      if (cleanPassword === 'cliente123' || cleanPassword === 'cliente@123' || cleanPassword === 'Perfumeria123.') {
        setUser({
          id: 'usr_cliente',
          name: 'Gabriela Alva',
          email: 'cliente@noinessence.com',
          role: 'CLIENTE',
        });
        return { success: true };
      }
      return { success: false, error: 'Contraseña incorrecta para Cliente.' };
    }

    // 2. Permitir acceso a clientes nuevos registrados (evitando que correos reservados caigan aquí)
    if (cleanPassword === 'Perfumeria123.' || cleanPassword.length >= 6) {
      setUser({
        id: `usr_${Math.floor(Math.random() * 10000)}`,
        name: 'Cliente Noir',
        email: normalizedEmail,
        role: 'CLIENTE',
      });
      return { success: true };
    }

    return { success: false, error: 'Correo electrónico o contraseña incorrectos.' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
