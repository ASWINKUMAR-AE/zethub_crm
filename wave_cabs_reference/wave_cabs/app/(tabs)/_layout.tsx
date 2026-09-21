import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { Tabs, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const currentScreen = segments.length > 0 ? segments[segments.length - 1] : "";

  // ------------------------------
  // 🔴 INSTAGRAM STYLE OFFLINE POPUP
  // ------------------------------
  const [isOffline, setIsOffline] = useState(false);
  const offlineAnim = useRef(new Animated.Value(100)).current; // hidden initially

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        setIsOffline(true);
        Animated.timing(offlineAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(offlineAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setIsOffline(false));
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth Redirect
  useEffect(() => {
    if (!loading && !user && !["LoginScreen", "Signup"].includes(currentScreen)) {
      router.replace("/LoginScreen");
    }
  }, [user, loading, segments, currentScreen, router]);

  // Disable hardware back handling
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === "bookingProcess") {
        Alert.alert(
          "Discard Booking?",
          "Are you sure you want to discard this booking process?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => router.replace("/ride_book"),
            },
          ],
          { cancelable: true }
        );
        return true;
      }

      if (currentScreen === "SelectOnMapScreen") {
        router.replace("/ride_book");
        return true;
      }

      if (currentScreen === "ride_book") return false;

      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [currentScreen, router]);

  if (loading || !user) return null;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          headerBackVisible: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#9CA3AF",
        }}
        tabBar={({ state, descriptors, navigation }) => (
          <CustomTabBar
            state={state}
            descriptors={descriptors}
            navigation={navigation}
          />
        )}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
        <Tabs.Screen name="Settings" options={{ title: "Settings" }} />

        {/* Hidden Screens */}
        <Tabs.Screen name="LoginScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="Signup" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="BookingScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="Payments" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="bookingProcess" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="ride_book" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="ride_history" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="SelectOnMapScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="support_help" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="Cabcoin" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="RidePendingScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="RideCompletedScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="dashboard_user" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="terms_condition" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="Referandearn" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="MessageScreen" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="RiderRideTracker" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="CompleteRide" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="DriverRideTracker" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="ride_acceptance" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="BookingSummaryScreen" options={{ tabBarButton: () => null }} />
      </Tabs>

      {/* --------------------------
          🔴 OFFLINE POPUP (Instagram Style)
      --------------------------- */}
      <Animated.View
        style={[
          styles.offlinePopup,
          { transform: [{ translateY: offlineAnim }] },
        ]}
      >
        <Text style={styles.offlineText}>⚠️ No Internet Connection</Text>
      </Animated.View>
    </>
  );
}

/* -----------------------------
   CUSTOM TAB BAR (UNCHANGED)
----------------------------- */
function CustomTabBar({ state, descriptors, navigation }) {
  const currentRoute = state.routes[state.index].name;

  const hiddenRoutes = [
    "LoginScreen", "Signup", "BookingScreen", "Payments", "bookingProcess",
    "ride_book", "ride_history", "SelectOnMapScreen", "support_help",
    "Cabcoin", "RidePendingScreen", "RideCompletedScreen", "dashboard_user",
    "terms_condition", "Referandearn", "MessageScreen", "RiderRideTracker",
    "CompleteRide", "DriverRideTracker", "ride_acceptance"
  ];

  if (hiddenRoutes.includes(currentRoute)) {
    return null;
  }

  const translateXAnim = useRef(new Animated.Value(0)).current;

  const visibleRoutes = state.routes.filter(
    (route) =>
      !hiddenRoutes.includes(route.name) &&
      ["index", "Profile", "Settings"].includes(route.name)
  );

  return (
    <View style={styles.customTabBar}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused =
          state.index === state.routes.findIndex((r) => r.name === route.name);

        const scaleAnim = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;
        const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.7)).current;

        useEffect(() => {
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: isFocused ? 1.1 : 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: isFocused ? 1 : 0.7,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(translateXAnim, {
              toValue: isFocused
                ? index * (360 / visibleRoutes.length)
                : translateXAnim,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }, [isFocused, index]);

        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        let iconName = "home";
        if (route.name === "Profile") iconName = "person";
        if (route.name === "Settings") iconName = "settings";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, isFocused && styles.activeTabItem]}
          >
            <Animated.View
              style={[
                styles.tabContent,
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
              ]}
            >
              <Ionicons
                name={isFocused ? iconName : `${iconName}-outline`}
                size={24}
                color={isFocused ? "#FFFFFF" : "#4B5563"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.activeLabel : styles.inactiveLabel,
                ]}
              >
                {options.title}
              </Text>
            </Animated.View>

            {isFocused && <Animated.View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* -----------------------------
   STYLES
----------------------------- */
const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 50,
    marginHorizontal: 20,
    marginBottom: 20,
    height: 70,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
    borderRadius: 50,
  },

  activeTabItem: {
    backgroundColor: "#0a0a0aff",
  },

  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },

  activeLabel: {
    color: "#FFFFFF",
  },
  inactiveLabel: {
    color: "#000000",
  },

  activeIndicator: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  tabBar: {
    display: "none",
  },

  /* ------------------------
     🔴 OFFLINE POPUP
  ------------------------ */
  offlinePopup: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ff4444c9",
    paddingVertical: 12,
    alignItems: "center",
    margin: 10,
    borderRadius: 50,
    zIndex: 500,
  },
  offlineText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
