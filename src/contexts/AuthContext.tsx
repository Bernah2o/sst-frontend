import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { apiService } from '../services/api';
import { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  updateUser: (userData: User) => void;
  refreshUserData: () => Promise<void>;
  clearAuthData: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Validar que el usuario tenga las propiedades necesarias
        if (parsedUser && parsedUser.id && parsedUser.email) {
          setUser(parsedUser);
          
          // Obtener información completa del usuario incluyendo custom_role
          apiService.getCurrentUser()
            .then(completeUser => {
              setUser(completeUser);
              localStorage.setItem('user', JSON.stringify(completeUser));
            })
            .catch(error => {
              // Mantener el usuario del localStorage si falla la actualización
            });
        } else {
          // Datos corruptos, limpiar localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  // Función para limpiar datos inconsistentes
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiService.login(credentials);
      
      if (response.access_token && response.user) {
        localStorage.setItem('token', response.access_token);
        
        // Get complete user information including custom_role
        try {
          const completeUser = await apiService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(completeUser));
          setUser(completeUser);
        } catch (userError) {
          // Fallback to basic user info from login response
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
    } finally {
      clearAuthData();
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const completeUser = await apiService.getCurrentUser();
       if (completeUser) {
         setUser(completeUser);
         localStorage.setItem('user', JSON.stringify(completeUser));
      }
    } catch (error) {
      // Si hay error, limpiar datos de autenticación
      clearAuthData();
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    refreshUserData,
    clearAuthData,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;