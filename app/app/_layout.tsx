import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "./_context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../constants/theme";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { userToken, userRole, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!userToken && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/LoginScreen");
    } else if (userToken && inAuthGroup) {
      // Redirect to main tabs if already authenticated
      router.replace("/(tabs)");
    }
  }, [userToken, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar style="light" />
        <Slot />
      </AuthGate>
    </AuthProvider>
  );
}
