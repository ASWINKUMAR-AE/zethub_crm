import { useAuth } from "@/app/context/AuthContext";
import { useMaintenance } from "@/app/context/MaintenanceContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";

const { width, height } = Dimensions.get("window");

// Grayscale color palette
const COLORS = {
  BLACK: "#000000",
  DARK_GRAY: "#1a1a1aed",
  GRAY: "#2D2D2D",
  MEDIUM_GRAY: "#404040",
  LIGHT_GRAY: "#666666",
  LIGHTER_GRAY: "#8C8C8C",
  LIGHTEST_GRAY: "#B3B3B3",
  OFF_WHITE: "#E6E6E6",
  WHITE: "#FFFFFF",
};

interface SidePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isVisible, onClose }) => {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const itemScale = React.useRef(new Animated.Value(0.8)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);
  const router = useRouter();
  const { logout } = useAuth();
  const { maintenance } = useMaintenance();

  React.useEffect(() => {
    if (isVisible) {
      // Reset animations and scroll position
      slideAnim.setValue(-width);
      overlayAnim.setValue(0);
      itemScale.setValue(0.8);

      // Reset scroll position when panel opens
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }

      // Parallel animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(itemScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, overlayAnim, itemScale]);

  const navigateTo = (screen: string) => {
    // Close animation first
    Animated.sequence([
      Animated.timing(itemScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(itemScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();

      // Handle special cases first
      if (screen === "logout") {
        logout();
        router.replace("/LoginScreen");
        return;
      }

      if (screen === "ride_book" && maintenance.isBookingDisabled) {
        Alert.alert(
          maintenance.effectiveMode === 'active' ? "Service Unavailable" : "Booking Temporarily Disabled ⚠️",
          maintenance.message || "Booking is temporarily disabled due to maintenance.",
          [{ text: "OK" }]
        );
        return;
      }

      // Map menu items to actual routes
      const routeMap: Record<string, string> = {
        ride_book: "/(tabs)/ride_book",
        Bookings: "/BookingsScreen",
        support_help: "/(tabs)/support_help",
        Cabcoin: "/(tabs)/Cabcoin",
        Referandearn: "/(tabs)/Referandearn",
        terms_condition: "/(tabs)/terms_condition",
        ride_history: "/(tabs)/ride_history",
        payments: "/(tabs)/Payments",
        settings: "/settings",
        profile: "/settings/profile",
      };

      const route = routeMap[screen] || `/${screen}`;
      router.push(route);
    });
  };

  const menuItems = [
    {
      title: "Book a Ride",
      icon: "car-sport",
      screen: "ride_book",
    },
    {
      title: "Bookings",
      icon: "calendar",
      screen: "Bookings",
    },
    {
      title: "Support",
      icon: "help-circle",
      screen: "support_help",
    },
    {
      title: "Terms & Condition",
      icon: "document-text",
      screen: "terms_condition",
    },
    {
      title: "Ride History",
      icon: "time",
      screen: "ride_history",
    },
    // {
    //   title: "Payments Methods",
    //   icon: "card",
    //   screen: "payments",
    // },
    {
      title: "Profile Settings",
      icon: "person",
      screen: "profile",
    },
    {
      title: "Cabcoin",
      icon: "cash",
      screen: "Cabcoin",
    },
    {
      title: "App Settings",
      icon: "settings",
      screen: "settings",
    },
    {
      title: "Refer & Earn",
      icon: "share-social",
      screen: "Referandearn",
    },
    {
      title: "Logout",
      icon: "log-out",
      screen: "logout",
    },
  ];

  const overlayOpacity = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.overlayTouch,
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateX: slideAnim },
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [-width, 0],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header with gradient border */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={styles.closeButtonInner}>
                    <Ionicons name="close" size={20} color={COLORS.WHITE} />
                  </View>
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <ThemedText
                    type="subtitle"
                    style={styles.headerTitle}
                  >
                    Wave Cabs
                  </ThemedText>
                  <View style={styles.titleUnderline} />
                </View>
              </View>
            </View>

            {/* Scrollable Menu Items with staggered animation */}
            <Animated.View
              style={[
                styles.menuContent,
                { transform: [{ scale: itemScale }] }
              ]}
            >
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                bounces={true}
                overScrollMode="always"
              >
                {menuItems.map((item, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [-width, 0],
                            outputRange: [-50 * (index + 1), 0],
                          }),
                        },
                      ],
                      opacity: slideAnim.interpolate({
                        inputRange: [-width, -width / 2, 0],
                        outputRange: [0, 0.3, 1],
                      }),
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        item.screen === 'logout' && styles.logoutMenuItem,
                        (item.screen === "ride_book" && maintenance.isBookingDisabled) && { opacity: 0.5 }
                      ]}
                      onPress={() => navigateTo(item.screen)}
                      activeOpacity={0.7}
                      disabled={item.screen === "ride_book" && maintenance.isAppLocked}
                    >
                      <View style={[
                        styles.menuIconContainer,
                        item.screen === 'logout' && styles.logoutIconContainer
                      ]}>
                        <Ionicons
                          name={item.icon as any}
                          size={22}
                          color={item.screen === 'logout' ? COLORS.WHITE : COLORS.OFF_WHITE}
                        />
                      </View>
                      <ThemedText style={[
                        styles.menuText,
                        item.screen === 'logout' && styles.logoutText
                      ]}>
                        {item.title}
                      </ThemedText>
                      <View style={styles.menuArrow}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={item.screen === 'logout' ? COLORS.WHITE : COLORS.LIGHTEST_GRAY}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Separator - Don't show after logout */}
                    {index < menuItems.length - 1 && (
                      <View style={styles.menuSeparator} />
                    )}
                  </Animated.View>
                ))}

                {/* Extra spacing at the bottom for better scroll */}
                <View style={styles.scrollSpacing} />
              </ScrollView>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerSeparator} />
              <ThemedText style={styles.footerText}>Version 1.0.0</ThemedText>
              <ThemedText style={styles.footerSubText}>Wave Cabs © 2025</ThemedText>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000061',
  },
  container: {
    width: width * 0.82,
    height: "100%",
    backgroundColor: COLORS.DARK_GRAY,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: -2,
      height: 0,
    },

    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 30,
    borderBottomColor: COLORS.GRAY,
    backgroundColor: COLORS.DARK_GRAY,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    marginRight: 16,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.GRAY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "300",
    color: COLORS.WHITE,
    letterSpacing: 1,
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.LIGHTEST_GRAY,
    marginTop: 8,
    borderRadius: 1,
  },
  menuContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    marginTop: 8,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  menuText: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.OFF_WHITE,
    flex: 1,
    letterSpacing: 0.3,
  },
  logoutText: {
    color: COLORS.WHITE,
    fontWeight: "500",
  },
  menuArrow: {
    opacity: 0.7,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: COLORS.GRAY,
    marginHorizontal: 20,
    marginVertical: 4,
  },
  scrollSpacing: {
    height: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY,
    backgroundColor: COLORS.DARK_GRAY,
  },
  footerSeparator: {
    height: 1,
    backgroundColor: COLORS.MEDIUM_GRAY,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.LIGHTER_GRAY,
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 11,
    color: COLORS.LIGHT_GRAY,
    textAlign: "center",
  },
});

export default SidePanel;