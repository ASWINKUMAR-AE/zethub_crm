import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { userAPI } from "../services/api";

const { width } = Dimensions.get("window");

// PRIMARY COLOR BLACK THEME CONSTANTS
const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f8fafd";
const CARD_BG = "#fff";
const CARD_BORDER = "#ededed";
const ICON_BG = "#ededed";
const SUBTITLE_COLOR = "#222";
const DESCRIPTION_COLOR = "#444";
const PLACEHOLDER_COLOR = "#888";
const ACCENT_RED = "#c62828";

// Sample FAQ data
const FAQ_DATA = [
  {
    id: "1",
    question: "How do I change my pickup location?",
    answer:
      "You can change your pickup location by editing the pickup field in the booking screen before confirming your ride.",
  },
  {
    id: "2",
    question: "How do I contact my driver?",
    answer:
      "Once your ride is confirmed, you can use the in-app chat or call feature to contact your driver directly.",
  },
  {
    id: "3",
    question: "What if I left something in the vehicle?",
    answer:
      "If you left an item in a vehicle, contact our support team immediately. We'll help connect you with your driver to retrieve your belongings.",
  },
  {
    id: "4",
    question: "How do I report an issue with my ride?",
    answer:
      'You can report an issue through the app by going to your ride history, selecting the ride, and tapping "Report an issue".',
  },
  {
    id: "5",
    question: "How do payments work?",
    answer:
      "You can pay for rides using cash, credit/debit cards, or digital wallets. Payment methods can be managed in your account settings.",
  },
];

export default function SupportHelpScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // 👇 navigation + route (fix for route undefined)
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // 🔁 Check rider status on mount
  useEffect(() => {
    const checkRiderStatus = async () => {
      try {
        const statusRes = await userAPI.getStatus();

        if (statusRes.status === "inRide") {
          navigation.replace("RiderRideTracker", {
            ...(route.params || {}),
            rideId: statusRes.rideId,
          });
        } else if (statusRes.status === "searchingRide") {
          navigation.replace("RidePendingScreen", {
            ...(route.params || {}),
            requestId: statusRes.requestId,
          });
        }
        // else: idle → stay on this screen
      } catch (error) {
        console.warn("Error checking rider status:", error);
      }
    };

    checkRiderStatus();
  }, [navigation, route]);

  // 📞 CALL SUPPORT
  const handleCallSupport = () => {
    const phoneNumber = "9876543210"; // 🔁 change to your support number
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // 📧 EMAIL SUPPORT
  const handleEmailSupport = () => {
    const email = "wave.transport.cab@gmail.com"; // already matches your UI
    Linking.openURL(`mailto:${email}`);
  };

  const toggleFaqExpand = (id: string) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = searchQuery
    ? FAQ_DATA.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : FAQ_DATA;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Unified Rounded Design */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <ThemedText style={styles.headerTitle}>Help & Support</ThemedText>

          <View style={{ width: 22 }} />
        </View>

        {/* Search Bar - Stylized */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color={PLACEHOLDER_COLOR}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="How can we help you?"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={PLACEHOLDER_COLOR}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Contact SupportSection */}
        <View style={styles.contactContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact Support
          </ThemedText>

          {/* 📞 Call Support */}
          <TouchableOpacity
            style={styles.contactOption}
            onPress={handleCallSupport}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="call" size={20} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.contactDetails}>
              <ThemedText style={styles.contactTitle}>Direct Call</ThemedText>
              <ThemedText style={styles.contactDescription}>
                Talk to our support experts 24/7
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={PLACEHOLDER_COLOR}
            />
          </TouchableOpacity>

          {/* 📧 Email Support */}
          <TouchableOpacity
            style={styles.contactOption}
            onPress={handleEmailSupport}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={20} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.contactDetails}>
              <ThemedText style={styles.contactTitle}>Email Status</ThemedText>
              <ThemedText style={styles.contactDescription}>
                wave.transport.cab@gmail.com
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={PLACEHOLDER_COLOR}
            />
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.faqContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            FAQs
          </ThemedText>

          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqItem,
                  expandedFaq === faq.id && styles.faqItemExpanded
                ]}
                onPress={() => toggleFaqExpand(faq.id)}
                activeOpacity={0.9}
              >
                <View style={styles.faqHeader}>
                  <ThemedText style={styles.faqQuestion}>
                    {faq.question}
                  </ThemedText>
                  <Ionicons
                    name={expandedFaq === faq.id ? "remove" : "add"}
                    size={20}
                    color={PRIMARY_COLOR}
                  />
                </View>

                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswer}>
                    <ThemedText style={styles.faqAnswerText}>
                      {faq.answer}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={PLACEHOLDER_COLOR}
              />
              <ThemedText style={styles.noResultsText}>
                No assistance found
              </ThemedText>
              <ThemedText style={styles.noResultsSubtext}>
                We couldn't find what you're looking for.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Emergency Section */}
        <TouchableOpacity style={styles.emergencyContainer} activeOpacity={0.8}>
          <View style={styles.emergencyContent}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View style={styles.emergencyTextContainer}>
              <ThemedText style={styles.emergencyTitle}>
                Safety & Emergency
              </ThemedText>
              <ThemedText style={styles.emergencyDescription}>
                Immediate help and safety reporting
              </ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    width: "94%",
    alignSelf: "center",
    backgroundColor: "#000",
    marginTop: Platform.OS === "android" ? 40 : 10,
    borderRadius: 50,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: PRIMARY_COLOR,
    fontSize: 15,
    fontWeight: "500",
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    color: PRIMARY_COLOR,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  contactContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactDetails: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    marginBottom: 2,
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
  contactDescription: {
    fontSize: 13,
    color: DESCRIPTION_COLOR,
    fontWeight: "500",
  },
  faqContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  faqItem: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  faqItemExpanded: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 1.5,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  faqAnswerText: {
    fontSize: 14,
    color: DESCRIPTION_COLOR,
    lineHeight: 22,
    fontWeight: "400",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderStyle: "dashed",
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: PLACEHOLDER_COLOR,
    marginTop: 6,
    textAlign: "center",
  },
  emergencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  emergencyContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  emergencyDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  bottomPadding: {
    height: 120,
  },
});
