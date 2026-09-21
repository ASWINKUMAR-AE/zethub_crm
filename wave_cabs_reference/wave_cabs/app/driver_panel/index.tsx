import ProfileMenu from "@/components/ProfileMenu";
import SidePanel from "@/components/SidePanel";
import { ThemedText } from "@/components/ThemedText";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f4f7fc";
const CARD_BG = "#fff";
const CARD_BORDER = "#e5eaf2";
const ICON_BG = "#eaf1fb";
const SUBTEXT = "#888";
const { width } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && width >= 900;
const CARD_WIDTH = isDesktop ? 220 : (width - 48) / 2;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);

  const handleStartBooking = () => {
    navigation.navigate("ride_book");
  };

  const handleProfilePress = () => {
    setProfileMenuVisible(true);
  };

  const handleMenuPress = () => {
    setSidePanelVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SidePanel
        isVisible={sidePanelVisible}
        onClose={() => setSidePanelVisible(false)}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <TouchableOpacity onPress={handleProfilePress}>
            <Ionicons name="person-outline" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>
          <ProfileMenu
            isVisible={profileMenuVisible}
            onClose={() => setProfileMenuVisible(false)}
            position={{ top: 50, right: 20 }}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroOuterWrap}>
          <Image
            source={require("@/assets/images/logo_cabit.png")}
            style={styles.heroBackground}
            contentFit="cover"
            blurRadius={2}
            pointerEvents="none"
          />
          <View style={styles.heroContainer}>
            <ThemedText type="title" style={styles.heroTitle}>
              Driver Portal
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Discover a new era of travel — grayscale, elegant, and made for
              you.
            </ThemedText>
            <TouchableOpacity
              style={styles.heroCTA}
              onPress={handleStartBooking}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.heroCTAText}>Start Booking</ThemedText>
              <Ionicons name="arrow-forward" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Cards */}
        {isDesktop ? (
          <View style={styles.cardsRowDesktop}>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <Ionicons
                name="car-sport"
                size={28}
                color={PRIMARY_COLOR}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle" style={styles.featureTitle}>
                Classic
              </ThemedText>
              <ThemedText style={styles.featureDesc}>
                Fast, reliable rides for your everyday journeys.
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="car-electric"
                size={28}
                color={PRIMARY_COLOR}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle" style={styles.featureTitle}>
                Electric
              </ThemedText>
              <ThemedText style={styles.featureDesc}>
                Eco-friendly electric vehicles at your fingertips.
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <Ionicons
                name="bicycle"
                size={28}
                color={PRIMARY_COLOR}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle" style={styles.featureTitle}>
                Micro-Mobility
              </ThemedText>
              <ThemedText style={styles.featureDesc}>
                Scooters & bikes for quick, solo trips.
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <Ionicons
                name="people-outline"
                size={28}
                color={PRIMARY_COLOR}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle" style={styles.featureTitle}>
                Pool
              </ThemedText>
              <ThemedText style={styles.featureDesc}>
                Share your ride, save money, meet new people.
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsGridMobile}>
            <View style={styles.cardsRowMobile}>
              <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
                <Ionicons
                  name="car-sport"
                  size={28}
                  color={PRIMARY_COLOR}
                  style={styles.cardIcon}
                />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Classic
                </ThemedText>
                <ThemedText style={styles.featureDesc}>
                  Fast, reliable rides for your everyday journeys.
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name="car-electric"
                  size={28}
                  color={PRIMARY_COLOR}
                  style={styles.cardIcon}
                />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Electric
                </ThemedText>
                <ThemedText style={styles.featureDesc}>
                  Eco-friendly electric vehicles at your fingertips.
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.cardsRowMobile}>
              <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
                <Ionicons
                  name="bicycle"
                  size={28}
                  color={PRIMARY_COLOR}
                  style={styles.cardIcon}
                />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Micro-Mobility
                </ThemedText>
                <ThemedText style={styles.featureDesc}>
                  Scooters & bikes for quick, solo trips.
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={PRIMARY_COLOR}
                  style={styles.cardIcon}
                />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Pool
                </ThemedText>
                <ThemedText style={styles.featureDesc}>
                  Share your ride, save money, meet new people.
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Pricing */}
        <View style={styles.pricingTitleRow}>
          <MaterialIcons name="attach-money" size={24} color={PRIMARY_COLOR} />
          <ThemedText type="subtitle" style={styles.pricingTitle}>
            Pricing per KM
          </ThemedText>
        </View>
        <View style={styles.pricingCardRow}>
          <View style={[styles.pricingCard, { backgroundColor: CARD_BG }]}>
            <Ionicons name="car-sport-outline" size={32} color="#95d5b2" />
            <ThemedText style={styles.pricingVehicle}>Car</ThemedText>
            <ThemedText style={styles.pricingRate}>
              <ThemedText style={styles.pricingCurrency}>₹</ThemedText>
              <ThemedText style={styles.pricingAmount}>14</ThemedText>
              <ThemedText style={styles.pricingPer}>/km</ThemedText>
            </ThemedText>
            <ThemedText style={styles.pricingDistance}>
              eg: 10km = ₹140
            </ThemedText>
          </View>
          <View style={[styles.pricingCard, { backgroundColor: CARD_BG }]}>
            <Ionicons name="bicycle-outline" size={32} color="#4ea8de" />
            <ThemedText style={styles.pricingVehicle}>Bike</ThemedText>
            <ThemedText style={styles.pricingRate}>
              <ThemedText style={styles.pricingCurrency}>₹</ThemedText>
              <ThemedText style={styles.pricingAmount}>8</ThemedText>
              <ThemedText style={styles.pricingPer}>/km</ThemedText>
            </ThemedText>
            <ThemedText style={styles.pricingDistance}>
              eg: 10km = ₹80
            </ThemedText>
          </View>
          <View style={[styles.pricingCard, { backgroundColor: CARD_BG }]}>
            <MaterialCommunityIcons
              name="auto-rickshaw"
              size={32}
              color="#ffd166"
            />
            <ThemedText style={styles.pricingVehicle}>Auto</ThemedText>
            <ThemedText style={styles.pricingRate}>
              <ThemedText style={styles.pricingCurrency}>₹</ThemedText>
              <ThemedText style={styles.pricingAmount}>11</ThemedText>
              <ThemedText style={styles.pricingPer}>/km</ThemedText>
            </ThemedText>
            <ThemedText style={styles.pricingDistance}>
              eg: 10km = ₹110
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: BG_COLOR,
    flexGrow: 1,
  },
  navBar: {
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: ICON_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  logoWrap: {
    backgroundColor: ICON_BG,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  logo: {
    height: 28,
    width: 90,
    resizeMode: "contain",
  },
  heroOuterWrap: {
    marginTop: 28,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 190,
    zIndex: 0,
    borderRadius: 20,
    opacity: 0.5,
  },
  heroContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 24,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    zIndex: 1,
  },
  heroTitle: {
    color: PRIMARY_COLOR,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: SUBTEXT,
    fontSize: 16,
    marginBottom: 22,
  },
  heroCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9ecef",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  heroCTAText: {
    color: PRIMARY_COLOR,
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  // Desktop: All feature cards in one row
  cardsRowDesktop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    marginHorizontal: 0,
    marginTop: 30,
    marginBottom: 12,
    gap: 32,
  },
  // Mobile: Grid with 2 rows and 2 cols
  cardsGridMobile: {
    marginTop: 18,
    marginHorizontal: 16,
  },
  cardsRowMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 18,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#e5eaf2",
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardIcon: {
    marginBottom: 10,
    backgroundColor: ICON_BG,
    borderRadius: 8,
    padding: 8,
  },
  featureTitle: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  featureDesc: {
    color: SUBTEXT,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginVertical: 28,
    marginHorizontal: 16,
    opacity: 0.8,
  },
  pricingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 6,
  },
  pricingTitle: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  pricingCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  pricingCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#e5eaf2",
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  pricingVehicle: {
    color: PRIMARY_COLOR,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 7,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  pricingRate: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
    marginBottom: 4,
  },
  pricingCurrency: {
    color: SUBTEXT,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 1,
  },
  pricingAmount: {
    color: PRIMARY_COLOR,
    fontSize: 22,
    fontWeight: "bold",
    marginRight: 2,
  },
  pricingPer: {
    color: SUBTEXT,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 2,
  },
  pricingDistance: {
    color: "#6ee7b7",
    fontSize: 12,
    marginTop: 7,
    fontStyle: "italic",
    fontWeight: "500",
  },
});
