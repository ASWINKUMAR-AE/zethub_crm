import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { userAPI } from "../services/api";

const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f8f9fa";
const CARD_BG = "#fff";
const BORDER_COLOR = "#eaeaea";
const ACCENT_COLOR = "#4285f4";

function PreferencesScreen() {
  const navigation = useNavigation();

  // Screen fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [preferences, setPreferences] = useState({
    emailPromotions: false,
    emailInvoice: false,
    smsInvoice: false,
    smsPromotions: false,
    whatsappUpdates: false,
  });

  useEffect(() => {
    fetchPreferences();
    fadeIn();
  }, []);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const fetchPreferences = async () => {
    try {
      const data = await userAPI.getPreferences();
      setPreferences({
        emailPromotions: !!data.emailPromotions,
        emailInvoice: !!data.emailInvoice,
        smsInvoice: !!data.smsInvoice,
        smsPromotions: !!data.smsPromotions,
        whatsappUpdates: !!data.whatsappUpdates,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const togglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);

    try {
      await userAPI.updatePreferences(updated);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Preferences</Text>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <AnimatedCard title="EMAIL">
              <PreferenceItem
                title="Allow emails for promotions and offers"
                value={preferences.emailPromotions}
                onValueChange={() => togglePreference("emailPromotions")}
                icon="mail-outline"
                iconColor="#4285f4"
              />

              <PreferenceItem
                title="Allow emails for invoice"
                value={preferences.emailInvoice}
                onValueChange={() => togglePreference("emailInvoice")}
                icon="document-text-outline"
                iconColor="#34a853"
                isLast
              />
            </AnimatedCard>

            <AnimatedCard title="SMS & WHATSAPP">
              <PreferenceItem
                title="Allow SMS for invoice"
                value={preferences.smsInvoice}
                onValueChange={() => togglePreference("smsInvoice")}
                icon="chatbubble-outline"
                iconColor="#ea4335"
              />

              <PreferenceItem
                title="Allow promotional SMS offers"
                value={preferences.smsPromotions}
                onValueChange={() => togglePreference("smsPromotions")}
                icon="pricetag-outline"
                iconColor="#fbbc04"
              />

              <PreferenceItem
                title="Allow WhatsApp updates"
                value={preferences.whatsappUpdates}
                onValueChange={() => togglePreference("whatsappUpdates")}
                icon="logo-whatsapp"
                iconColor="#25D366"
                isLast
              />
            </AnimatedCard>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ------------------------------------------------------
// Animated Card Component
// ------------------------------------------------------

const AnimatedCard = ({ title, children }) => {
  const slideAnim = useRef(new Animated.Value(22)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.sectionHeader}>{title}</Text>
      {children}
    </Animated.View>
  );
};

// ------------------------------------------------------
// Individual Preference Item Component
// ------------------------------------------------------

const PreferenceItem = ({
  title,
  value,
  onValueChange,
  icon,
  iconColor = "#4285f4",
  isLast = false,
}) => {
  return (
    <View style={[styles.item, isLast && styles.lastItem]}>
      <View style={styles.itemContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>

        <Text style={styles.title}>{title}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d6d6d6", true: "#cce0ff" }}
        thumbColor={value ? ACCENT_COLOR : "#f4f3f4"}
        ios_backgroundColor="#e0e0e0"
        style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
      />
    </View>
  );
};

// ------------------------------------------------------
// Styles
// ------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    backgroundColor: "black",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    flexDirection: "row",
    color:"white",
    margin:20,
    borderRadius:50,
    alignItems: "center",
    elevation: 2,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
    color: PRIMARY_COLOR,
  },
});

export default PreferencesScreen;
