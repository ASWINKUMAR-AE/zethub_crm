import { useAuth } from "@/app/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router"; // <-- Use expo-router navigation for tab navigation
import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";

// Set your light theme primary color
const PRIMARY_COLOR = "#000";
interface ProfileMenuProps {
  isVisible: boolean;
  onClose: () => void;
  position: { top: number; right: number };
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isVisible,
  onClose,
  position,
}) => {
  // Hardcoded to light theme
  const colorScheme = "light";
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 7,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, scaleAnim]);

  // Use the correct navigation method for tabs/screens under expo-router
  const navigateTo = (screen: string) => {
    onClose();
    navigation.navigate({ name: screen });
  };

  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: "Profile",
      icon: "person",
      onPress: () => navigateTo("Profile"), // Tab name (case-sensitive)
    },
    // {
    //   title: "Payments",
    //   icon: "card",
    //   onPress: () => navigateTo("Payments"), // Tab or screen name
    // },
    {
      title: "Logout",
      icon: "log-out",
      onPress: () => {
        onClose();
        logout();
        // Replace navigation with router.replace
        setTimeout(() => {
          router.replace("/LoginScreen"); // ✅ Must match your routing structure
        }, 100);
      },
    },
  ];

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            {
              top: position.top + 50,
              right: position.right,
              backgroundColor: "#fff",
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          <View style={[styles.menuArrow, { borderBottomColor: "#fff" }]} />
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={PRIMARY_COLOR}
                style={styles.menuIcon}
              />
              <ThemedText style={[styles.menuText, { color: PRIMARY_COLOR }]}>
                {item.title}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menuContainer: {
    position: "absolute",
    width: 180,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  menuArrow: {
    position: "absolute",
    top: -10,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
  },
});

export default ProfileMenu;
