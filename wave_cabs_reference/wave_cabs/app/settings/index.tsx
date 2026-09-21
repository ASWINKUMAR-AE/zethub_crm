import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userAPI } from "../services/api";

// Grayscale color palette
const PRIMARY_COLOR = "#000000";
const SECONDARY_COLOR = "#333333";
const LIGHT_GRAY = "#F5F5F5";
const MEDIUM_GRAY = "#E0E0E0";
const DARK_GRAY = "#424242";
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const CARD_BG = WHITE;
const BORDER_COLOR = MEDIUM_GRAY;
const ICON_BG = LIGHT_GRAY;

const { width } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && width >= 900;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState({ name: "User", phone: "" });
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  
  useEffect(() => {
    const checkRiderStatus = async () => {
      try {
        const statusRes = await userAPI.getStatus();
        if (statusRes.status === "inRide") {
          navigation.replace("RiderRideTracker", {
            ...route.params,
            rideId: statusRes.rideId,
          });
        } else if (statusRes.status === "searchingRide") {
          navigation.replace("RidePendingScreen", {
            ...route.params,
            requestId: statusRes.requestId,
          });
        }
      } catch (error) {
        console.warn("Error checking rider status:", error);
      }
    };

    checkRiderStatus();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await userAPI.getProfile();
        if (data && typeof data === "object") {
          setProfile({
            name: data.name || "User",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_GRAY} />
      <View style={styles.header}>
        {navigation.canGoBack && navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonBg}>
              <Ionicons name="arrow-back" size={22} color={PRIMARY_COLOR} />
            </View>
          </TouchableOpacity>
        )}
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Settings
        </ThemedText>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person" size={28} color={WHITE} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="defaultSemiBold" style={styles.profileName}>
              {isLoading ? "Loading..." : profile.name}
            </ThemedText>
            <ThemedText style={styles.profilePhone}>
              {isLoading ? "" : profile.phone || ""}
            </ThemedText>
          </View>
          <Link href="/settings/profile" asChild>
            <TouchableOpacity style={styles.editButton}>
              <ThemedText style={styles.editButtonText}>Edit</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        {/* ACCOUNT Section */}
        <SectionHeader title="ACCOUNT" />

        <View style={styles.card}>
          <SettingItem
            icon="person-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Profile"
            subtitle="Personal information"
            href="/settings/profile"
          />
{/* 
          <SettingItem
            icon="location-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Favourites"
            subtitle="Manage favourite locations"
            href={{
              pathname: "/settings/favourites",
              params: { name: profile.name, phone: profile.phone },
            }}
          /> */}

          <SettingItem
            icon="notifications-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Preferences"
            subtitle="Manage notifications & preferences"
            href="/settings/preferences"
          />
        </View>

        {/* SUPPORT Section */}
        <SectionHeader title="SUPPORT" />

        <View style={styles.card}>
          <SettingItem
            icon="help-circle-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Help & Support"
            subtitle="Get assistance and support"
            href="/support_help"
          />

          <SettingItem
            icon="information-circle-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="About"
            subtitle="App version & information"
            href="/settings/about"
          />
        </View>

        {/* LEGAL Section */}
        <SectionHeader title="LEGAL" />

        <View style={styles.card}>
          <SettingItem
            icon="document-text-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Terms & Conditions"
            subtitle="Legal agreements"
            href="/terms_condition"
          />

          <SettingItem
            icon="shield-checkmark-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Privacy Policy"
            subtitle="How we handle your data"
            href="/settings/privacy-policy"
          />
        </View>

        {/* ACCOUNT ACTIONS Section */}
        <SectionHeader title="ACCOUNT ACTIONS" />

        <View style={styles.card}>
          <SettingItem
            icon="log-out-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Logout"
            subtitle="Sign out from your account"
            isDestructive={false}
          />

          <SettingItem
            icon="trash-outline"
            iconBg={LIGHT_GRAY}
            iconColor={DARK_GRAY}
            title="Delete Account"
            subtitle="Permanently delete your account"
            isDestructive={true}
            href="/settings/delete-account"
            isLast={true}
          />
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Wave Cabs © 2025</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <ThemedText style={styles.sectionHeader}>{title}</ThemedText>;
}

function SettingItem({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  href,
  isDestructive,
  isLast,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  href?: string;
  isDestructive?: boolean;
  isLast?: boolean;
}) {
  const content = (
    <View style={[styles.itemContainer, isLast && styles.lastItem]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText
          style={[styles.title, isDestructive && styles.destructiveText]}
        >
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        )}
      </View>
      {href && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={MEDIUM_GRAY}
          style={styles.chevron}
        />
      )}
    </View>
  );

  return href ? (
    <Link href={href} asChild>
      <TouchableOpacity activeOpacity={0.7}>{content}</TouchableOpacity>
    </Link>
  ) : (
    <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  topSafeArea: {
    backgroundColor: LIGHT_GRAY,
  },
  header: {
    backgroundColor: CARD_BG,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    marginRight: 12,
  },
  backButtonBg: {
    backgroundColor: ICON_BG,
    borderRadius: 18,
    padding: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  contentContainer: {
    paddingHorizontal: isDesktop ? "20%" : 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 50,
    padding: 20,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  profilePhone: {
    fontSize: 14,
    color: DARK_GRAY,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  editButtonText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK_GRAY,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 14,
    color: DARK_GRAY,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  destructiveText: {
    color: DARK_GRAY,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#000000ff",
    borderRadius: 52,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  footerText: {
    fontSize: 14,
    color: "#ffff",
  },
});