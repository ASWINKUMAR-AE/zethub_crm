import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      setUserToken(res.data.token);
      setUserRole(res.data.role);
      setUserInfo(res.data);
      
      await AsyncStorage.setItem('userToken', res.data.token);
      await AsyncStorage.setItem('userRole', res.data.role);
      await AsyncStorage.setItem('userInfo', JSON.stringify(res.data));
    } catch (e) {
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
