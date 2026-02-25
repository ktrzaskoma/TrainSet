import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      
      // Store user data
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('userEmail', response.email);
      
      setUser(response);
      setIsAuthenticated(true);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Wystąpił błąd podczas logowania';
      
      if (error.response?.status === 401) {
        errorMessage = 'Nieprawidłowy email lub hasło';
      } else if (error.response?.status === 404) {
        errorMessage = 'Nie znaleziono użytkownika o podanym adresie email';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: { message: errorMessage } };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration with data:', userData);
      const response = await authService.register(userData);
      console.log('Registration response:', response);
      
      // Store user data and login after successful registration
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('userEmail', response.email);
      
      setUser(response);
      setIsAuthenticated(true);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Wystąpił błąd podczas rejestracji';
      
      if (error.response?.status === 409) {
        errorMessage = 'Użytkownik o podanym adresie email już istnieje';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Nieprawidłowe dane rejestracji';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: { message: errorMessage } };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

