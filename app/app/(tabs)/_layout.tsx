import { Tabs, useRouter } from "expo-router";
import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Home, FolderGit2, Calendar, CreditCard, Users, LogOut } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import { useAuth } from "../_context/AuthContext";

export default function TabLayout() {
  const { userRole, logout } = useAuth();
  const router = useRouter();

  const HeaderLogout = () => (
    <TouchableOpacity onPress={() => logout()} style={{ marginRight: SPACING.md }}>
      <LogOut color={COLORS.error} size={24} />
    </TouchableOpacity>
  );

  const screenOptions = {
    headerShown: true,
    headerRight: () => <HeaderLogout />,
    headerStyle: {
      backgroundColor: COLORS.background,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    headerTintColor: COLORS.text,
    headerTitleStyle: {
      fontWeight: '700' as const,
    },
    headerShadowVisible: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textSecondary,
    tabBarShowLabel: false, // Cleaner look for glass navbar
    tabBarIconStyle: {
      marginTop: 10, // Remove default top margin
    },
    tabBarStyle: {
      position: 'absolute' as const,
      bottom: Platform.OS === 'ios' ? 24 : 16,
      left: 16,
      right: 16,
      height: 64,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
      borderRadius: RADIUS.round,
      justifyContent: 'center', // Center items vertically
      paddingBottom: 0,
    },
    tabBarBackground: () => (
      <BlurView
        intensity={60}
        tint="dark"
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: RADIUS.round,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      />
    ),
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="Projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <FolderGit2 color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="Milestones"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={28} />,
        }}
      />

      {/* Admin Only Tabs */}
      <Tabs.Screen
        name="Payments"
        options={{
          title: "Payments",
          href: userRole === 'admin' ? '/Payments' : null,
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="Team"
        options={{
          title: "Team",
          href: userRole === 'admin' ? '/Team' : null,
          tabBarIcon: ({ color, size }) => <Users color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}
