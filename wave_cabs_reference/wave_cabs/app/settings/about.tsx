import { CONTACT } from "@/constants/Contact";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_COLOR = "#000000";
const SECONDARY_COLOR = "#333333";
const BG_COLOR = "#F4F6F9";
const CARD_BG = "#FFFFFF";
const BORDER_COLOR = "#EAEAEA";

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About CABIT</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section */}
        <View style={styles.introCard}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.introTitle}>Welcome to CABIT</Text>
          <Text style={styles.introSub}>
            India-made. Powered in Madurai. Your trusted ride partner.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Our Mission 🚀</Text>
          <Text style={styles.paragraph}>
            At CABIT, we aim to deliver safe, timely, and affordable rides
            across India. Whether you’re booking a city cab, an airport drop,
            or an outstation trip, CABIT ensures reliability, comfort, and
            transparency. We’re building a smarter mobility ecosystem—
            empowering drivers and making rides seamless for everyone.
          </Text>
        </View>

        {/* More Info - Independent Dropdowns */}
        <View style={styles.card}>
          <Text style={[styles.cardHeader, { marginBottom: 6 }]}>More Info</Text>

          <DropdownItem
            title="Join the Team"
            icon="people-outline"
            text="Be part of CABIT’s growing family! We’re always looking for passionate developers, designers, and support staff. Together, we can redefine urban mobility in India. Send your resume to support@cabit.com."
          />
          <DropdownItem
            title="Company Blog"
            icon="newspaper-outline"
            text="Stay tuned for stories from the road! Our blog covers tech updates, driver success stories, city highlights, and customer experiences—all reflecting CABIT’s journey of innovation."
          />
          <DropdownItem
            title="Privacy Policy"
            icon="shield-checkmark-outline"
            text="CABIT respects your privacy and protects your data. We ensure all user information is securely handled and never shared with third parties. Review our policy inside the app for transparency."
          />
          <DropdownItem
            title="Terms of Service"
            icon="document-text-outline"
            text="Using CABIT means agreeing to our fair-use policy—transparent pricing, mutual respect between riders and drivers, and safe travel for all. Our terms evolve as we improve our services."
          />
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Support & Contact 📞</Text>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>{CONTACT.EMAIL}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Phone:</Text>
            <Text style={styles.contactValue}>{CONTACT.PHONE}</Text>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.version}>CABIT App Version 1.0.0</Text>
          <Text style={styles.copyright}>
            © 2025 CABIT. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Reusable Dropdown Item Component
 */
function DropdownItem({
  title,
  icon,
  text,
}: {
  title: string;
  icon: string;
  text: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(animation, {
      toValue,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const height = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100], // adjust for text length
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={styles.dropdownItemContainer}>
      <TouchableOpacity activeOpacity={0.8} style={styles.dropdownHeader} onPress={toggle}>
        <View style={styles.headerLeft}>
          <Ionicons name={icon} size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
          <Text style={styles.dropdownTitle}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={18} color="#777" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.dropdownBody,
          { height, opacity },
        ]}
      >
        <Text style={styles.dropdownText}>{text}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  header: {
    backgroundColor: CARD_BG,
    paddingTop: Platform.OS === "ios" ? 12 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: PRIMARY_COLOR },
  container: { flex: 1, backgroundColor: BG_COLOR },
  contentContainer: { padding: 16, paddingBottom: 40 },

  introCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 40, fontWeight: "900", color: CARD_BG },
  introTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    marginBottom: 6,
  },
  introSub: {
    fontSize: 15,
    color: SECONDARY_COLOR,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: SECONDARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paragraph: {
    fontSize: 15,
    color: SECONDARY_COLOR,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
  },

  dropdownItemContainer: {
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  dropdownBody: {
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    paddingVertical: 10,
  },

  contactItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: SECONDARY_COLOR,
    width: 60,
  },
  contactValue: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    flexShrink: 1,
  },
  versionContainer: {
    marginTop: 30,
    width: "100%",
    alignItems: "center",
  },
  version: { fontSize: 14, color: SECONDARY_COLOR, fontWeight: "500", marginBottom: 4 },
  copyright: { fontSize: 12, color: "#999" },
});
