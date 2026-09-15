/**
 * TravelMate Auth Context
 * Provides authentication state and actions to the entire app.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('travelmate_token');
    const storedUser = localStorage.getItem('travelmate_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('travelmate_token');
        localStorage.removeItem('travelmate_user');
      }
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (data) => {
    setError(null);
    const result = await authService.register(data);
    return result;
  }, []);

  const login = useCallback(async (data) => {
    setError(null);
    const result = await authService.login(data);
    if (result.success && result.data) {
      const { user: userData, token } = result.data;
      localStorage.setItem('travelmate_token', token);
      localStorage.setItem('travelmate_user', JSON.stringify(userData));
      setUser(userData);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout even if API call fails
    }
    localStorage.removeItem('travelmate_token');
    localStorage.removeItem('travelmate_user');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
