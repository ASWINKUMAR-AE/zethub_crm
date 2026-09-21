import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { userAPI } from '../services/api'; // adjust path as needed


const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f8fafd";
const CARD_BG = "#fff";
const ACCENT = PRIMARY_COLOR; // PRIMARY COLOR SET TO BLACK
const ICON_BG = "#e9f0ff";
const SHADOW = Platform.OS === "web" ? "0px 8px 40px rgba(0,0,0,0.10)" : undefined;

export default function TermsConditionScreen() {
  const navigation = useNavigation();
  useEffect(() => {
  const checkRiderStatus = async () => {
    try {
      const statusRes = await userAPI.getStatus();
      // statusRes.status could be: "in_ride", "searching", "idle", etc.
      if (statusRes.status === "inRide") {
        navigation.replace("RiderRideTracker", {
          ...route.params, // pass existing params
          rideId: statusRes.rideId,
          // add any other params from statusRes if needed
        });
      } else if (statusRes.status === "searchingRide") {
        navigation.replace("RidePendingScreen", {
          ...route.params, // pass existing params
          requestId: statusRes.requestId,
          // add any other params from statusRes if needed
        });
      }
      // else do nothing (idle or other status)
    } catch (error) {
      console.warn("Error checking rider status:", error);
    }
  };

  checkRiderStatus();
}, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Decorative Top Bar */}
      <View style={styles.topBar} />

      <View style={styles.container}>
        {/* Floating Card Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonBg}>
              <Ionicons name="arrow-back" size={22} color={PRIMARY_COLOR} />
            </View>
          </TouchableOpacity>
          <Ionicons name="document-text-outline" size={38} color={ACCENT} style={styles.headerIcon} />
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Terms & Conditions
          </ThemedText>
        </View>

        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Section
            number={1}
            title="Acceptance of Terms"
            children="By accessing or using Wave Cabs services, including our mobile application and website, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services."
          />

          <Section
            number={2}
            title="Service Description"
            children="Wave Cabs provides a platform connecting riders with transportation services. We do not provide transportation services directly, but facilitate connections between riders and independent third-party providers."
          />

          <Section
            number={3}
            title="User Accounts"
            children={[
              "To use our services, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
              "You must be at least 18 years old to create an account. By creating an account, you confirm that you are at least 18 years of age."
            ]}
          />

          <Section
            number={4}
            title="User Conduct"
            children={
              <>
                <ThemedText style={styles.paragraph}>
                  You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
                </ThemedText>
                <View style={styles.bulletPoints}>
                  <Bullet text="Use our services for any illegal purpose" />
                  <Bullet text="Interfere with or disrupt our services or servers" />
                  <Bullet text="Attempt to gain unauthorized access to any part of our services" />
                  <Bullet text="Use our services to harm, threaten, or harass any person" />
                  <Bullet text="Submit false or misleading information" />
                </View>
              </>
            }
          />

          <Section
            number={5}
            title="Payments and Fees"
            children={[
              "By using our services, you agree to pay all fees that you incur. Prices for services may vary based on time, location, and other factors. We reserve the right to modify our pricing at any time.",
              "Payment methods accepted include cash, credit/debit cards, and digital wallets. You agree to provide accurate payment information and authorize us to charge the applicable fees to your selected payment method."
            ]}
          />

          <Section
            number={6}
            title="Cancellation Policy"
            children="Riders may cancel a ride request at any time, but cancellation fees may apply depending on the timing of the cancellation. Cancellation fees will be clearly displayed in the app before confirmation."
          />

          <Section
            number={7}
            title="Privacy Policy"
            children="Our Privacy Policy describes how we collect, use, and share information about you when you use our services. By using our services, you consent to our collection and use of information as described in our Privacy Policy."
          />

          <Section
            number={8}
            title="Limitation of Liability"
            children="To the maximum extent permitted by law, Wave Cabs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of our services."
          />

          <Section
            number={9}
            title="Dispute Resolution"
            children="Any dispute arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the applicable arbitration rules. The arbitration shall be conducted in [Jurisdiction], and the language of arbitration shall be English."
          />

          <Section
            number={10}
            title="Modifications to Terms"
            children="We may modify these Terms at any time. If we make changes, we will provide notice by updating the date at the top of these Terms and by maintaining a current version of the Terms on our website. Your continued use of our services after such modifications constitutes your acceptance of the modified Terms."
          />

          <Section
            number={11}
            title="Termination"
            children="We reserve the right to terminate or suspend your account and access to our services at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason."
          />

          {/* <Section
            number={12}
            title="Contact Information"
            children={
              <>
                <ThemedText style={styles.paragraph}>
                  If you have any questions about these Terms, please contact us at:
                </ThemedText>
                <ThemedText style={styles.contactInfo}>
                  <Ionicons name="mail" size={16} color={ACCENT} />  legal@wavecabs.com
                </ThemedText>
                <ThemedText style={styles.contactInfo}>
                  <Ionicons name="location" size={16} color={ACCENT} />  Wave Cabs Headquarters, 123 Transport Street, Mobility City, MC 12345
                </ThemedText>
              </>
            }
          /> */}

          <View style={styles.lastUpdated}>
            <ThemedText style={styles.lastUpdatedText}>
              Last Updated: June 30, 2025
            </ThemedText>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Section Card Component
function Section({ number, title, children }: { number: number; title: string; children: any; }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCircle}>
          <ThemedText style={styles.sectionNumber}>{number}</ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      {
        Array.isArray(children)
          ? children.map((child, i) =>
              typeof child === "string"
                ? <ThemedText style={styles.paragraph} key={i}>{child}</ThemedText>
                : React.cloneElement(child, { key: i })
            )
          : typeof children === "string"
            ? <ThemedText style={styles.paragraph}>{children}</ThemedText>
            : children
      }
    </View>
  );
}

// Bullet point with colored dot
function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <ThemedText style={styles.bulletPoint}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  topBar: {
    height: 90,
    width: '100%',
    backgroundColor: ACCENT, // BLACK
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: BG_COLOR,
  },
  headerCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -45,
    marginBottom: 12,
    paddingVertical: 24,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    shadowColor: ACCENT, // BLACK
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 9,
    ...Platform.select({
      web: { boxShadow: SHADOW }
    }),
    flexDirection: "row",
    justifyContent: "center",
    position: 'relative',
  },
  backButton: {
    position: "absolute",
    left: 18,
    top: 26,
    zIndex: 10,
  },
  backButtonBg: {
    backgroundColor: ICON_BG,
    borderRadius: 18,
    padding: 7,
    shadowColor: ACCENT, // BLACK
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerIcon: {
    marginRight: 18,
    marginLeft: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    flexShrink: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: BG_COLOR,
  },
  section: {
    marginBottom: 26,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    shadowColor: ACCENT, // BLACK
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({
      web: { boxShadow: SHADOW }
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ACCENT, // BLACK
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: "#222",
    flexShrink: 1,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: 8,
    marginLeft: 2,
  },
  bulletPoints: {
    marginLeft: 6,
    marginTop: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT, // BLACK
    marginRight: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
    marginBottom: 8,
    marginLeft: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  lastUpdated: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: "#aaa",
    letterSpacing: 0.2,
  },
  bottomPadding: {
    height: 60,
  },
});