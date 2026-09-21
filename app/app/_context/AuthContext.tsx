import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../_services/api';

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userRole: string | null;
  userInfo: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      setUserToken(res.data.token);
      setUserRole(res.data.role);
      setUserInfo(res.data);
      
      await AsyncStorage.setItem('userToken', res.data.token);
      await AsyncStorage.setItem('userRole', res.data.role);
      await AsyncStorage.setItem('userInfo', JSON.stringify(res.data));
    } catch (e: any) {
      console.error('Login error', e.response?.data?.message || e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserRole(null);
    setUserInfo(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userInfo');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let role = await AsyncStorage.getItem('userRole');
      let info = await AsyncStorage.getItem('userInfo');

      if (token && role && info) {
        setUserToken(token);
        setUserRole(role);
        setUserInfo(JSON.parse(info));
      }
    } catch (e) {
      console.log(`isLogged in error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userRole, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
