import { ThemedText } from "@/components/ThemedText";
import { CONTACT } from "@/constants/Contact";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyPolicy() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        damping: 14,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const lastUpdated = new Date("2025-06-30").toLocaleDateString();
  const screenHeight = Dimensions.get("window").height;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000ff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + -5 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Navigate safely to previous screen
            if (navigation.canGoBack()) navigation.goBack();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: screenHeight * 0.18 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fade,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="shield-checkmark" size={30} color="#111" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Privacy Policy</Text>
              <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
            </View>
          </View>

          {/* Section 1 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            🔒 Welcome to CABNOW OPC PRIVATE LIMITED
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            CABNOW OPC PRIVATE LIMITED is committed to protecting your privacy.
            This policy describes the types of information we collect and how we
            use, disclose, and safeguard your information when you use our
            services.
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            1. Information We Collect
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            We collect information to provide and improve our services to you.
          </ThemedText>

          {[
            {
              title: "Personal Identification Information",
              text: "Includes your name, email address, phone number, and profile picture (if provided).",
            },
            {
              title: "Location Data",
              text: "We collect precise or approximate location data from your mobile device for ride dispatch and tracking.",
            },
            {
              title: "Payment Information",
              text: "We collect payment method details via a secure third-party payment processor. We do not store full card details.",
            },
            {
              title: "Transaction Information",
              text: "Includes booking details like service type, date, time, amount, and payment method.",
            },
            {
              title: "Device & Usage Information",
              text: "Includes device model, OS, app usage stats, crash reports, and access times.",
            },
          ].map((item, index) => (
            <View key={index}>
              <ThemedText style={styles.subTitle}>• {item.title}</ThemedText>
              <ThemedText style={styles.paragraph}>{item.text}</ThemedText>
            </View>
          ))}

          {/* Section 2 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            2. How We Use Your Information
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            To operate, maintain, and enhance our services; provide customer
            support; ensure safety; process payments; and communicate booking
            updates.
          </ThemedText>

          {/* Section 3 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            3. Sharing Your Information
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            We share limited info with drivers, passengers, and third-party
            providers as needed to deliver services. We never sell your data.
          </ThemedText>

          {/* Section 4 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            4. Data Security
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            We employ encryption, secure servers, and restricted access to
            protect your data — though no internet system is 100% secure.
          </ThemedText>

          {/* Section 5 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            5. Your Rights
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            You can request access, correction, or deletion of your data via app
            settings or by contacting support.
          </ThemedText>

          {/* Refund Section */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            💳 Refund & Cancellation Policy
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            This section outlines the cancellation and refund terms for users
            and drivers.
          </ThemedText>

          <ThemedText style={styles.subTitle}>User Cancellations</ThemedText>
          <ThemedText style={styles.paragraph}>
            • Free within 2 minutes of confirmation. After that, a 90% fee may
            apply. No-shows after 10 minutes result in driver cancellation and
            charge.
          </ThemedText>

          <ThemedText style={styles.subTitle}>Driver Cancellations</ThemedText>
          <ThemedText style={styles.paragraph}>
            • Before arrival — no charge. After arrival, users may request a
            refund through support.
          </ThemedText>

          <ThemedText style={styles.subTitle}>Refund Processing</ThemedText>
          <ThemedText style={styles.paragraph}>
            Refunds are processed within 5–10 business days after review.
          </ThemedText>

          {/* Contact */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            CONTACT INFORMATION
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            📞 Mob: {CONTACT.PHONE}
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            📧 Email: {CONTACT.EMAIL}
          </ThemedText>
        </Animated.View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12 }]}>
    
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#000000ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    margin: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffffff",
    textAlign: "center",
    flex: 1,
    marginRight: 28,
  },
  headerRight: { width: 40 },
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrapper: {
    backgroundColor: "#F2F2F2",
    borderRadius: 50,
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  lastUpdated: { fontSize: 12, color: "#777", marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginTop: 14,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
  },
  homeButton: {
    flexDirection: "row",
    backgroundColor: "#000000ff",
    borderRadius: 36,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  homeButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});
