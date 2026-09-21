import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Helper functions to handle storage for web and native
const isWeb = Constants.platform?.web;

const getItem = async (key) => {
  if (isWeb) {
    return Promise.resolve(localStorage.getItem(key));
  } else {
    return SecureStore.getItemAsync(key);
  }
};

const setItem = async (key, value) => {
  if (isWeb) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  } else {
    return SecureStore.setItemAsync(key, value);
  }
};

const deleteItem = async (key) => {
  if (isWeb) {
    localStorage.removeItem(key);
    return Promise.resolve();
  } else {
    return SecureStore.deleteItemAsync(key);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const platform = Constants.platform?.ios ? "ios" : "android";
      const response = await authAPI.login(email, password, platform);
      if (response.token) {
        await setItem("token", response.token);
        setUser(response.user);
        return response.redirectPath; // Return redirectPath from backend
      } else {
        throw new Error("Token missing in response");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await deleteItem("token");
    setUser(null);
  };

  const checkToken = async () => {
    const token = await getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const session = await authAPI.getSession(token);
      if (session.user) setUser(session.user);
    } catch (e) {
      console.error("Token validation failed");
      await deleteItem("token");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      const res = await authAPI.signup(userData);
      return res;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, signup, isAuthenticated, role }}>
      {children}
    </AuthContext.Provider>
  );
}
