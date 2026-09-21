import ProfileMenu from "@/components/ProfileMenu";
import SidePanel from "@/components/SidePanel";
import { ThemedText } from "@/components/ThemedText";
import { useUserBookings } from "@/hooks/useUserBookings";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useAuth } from "../context/AuthContext";
import { useMaintenance } from "../context/MaintenanceContext";
import { useUpdate } from "../context/UpdateContext";

// 🔑 Google API Key
const GOOGLE_API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";

import { Alert } from "react-native";




const PRIMARY_COLOR = "#000";
const BG_COLOR = "#fff";
const CARD_BORDER = "#e5eaf2";
const ICON_BG = "#000000ff";
const SUBTEXT = "#040404ff";
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  // auth might be null
  const auth = useAuth();
  const { isUpdateRequired, openStore } = useUpdate();
  const { maintenance } = useMaintenance();
  const user = auth?.user;

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // 🛠️ Upcoming Outstation Banner Logic
  const { bookings, refetch } = useUserBookings(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) refetch();
    }, [user?.id, refetch])
  );

  const upcomingOutstation = bookings.filter((b: any) => {
    const type = (b.ride_type || b.rideType || '').toLowerCase();
    const status = (b.status || '').toLowerCase();
    return type === 'outstation' && ['scheduled', 'upcoming', 'searching', 'accepted', 'confirmedandnotstarted'].includes(status);
  }).sort((a: any, b: any) => {
    const d1 = new Date(a.scheduled_at || a.ride_date).getTime();
    const d2 = new Date(b.scheduled_at || b.ride_date).getTime();
    return d1 - d2;
  });

  const upcomingCount = upcomingOutstation.length;
  const nearestUpcoming = upcomingOutstation[0];

  // Route Map
  const routeMap = {
    ride_book: "/(tabs)/ride_book",
    support_help: "/(tabs)/support_help",
    Cabcoin: "/(tabs)/Cabcoin",
    Referandearn: "/(tabs)/Referandearn",
    terms_condition: "/(tabs)/terms_condition",
    ride_history: "/(tabs)/ride_history",
    payments: "/(tabs)/Payments",
    settings: "/settings",
    profile: "/settings/profile",
  };
  // Location State
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState("Fetching location...");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      router.replace({ pathname: "/LoginScreen", params: { from: "index" } });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };



  // ✅ Get Current Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Google Maps Geocoding API
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&key=${GOOGLE_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          setAddress(data.results[0].formatted_address);
        } else {
          setAddress("Locating city...");
          let geocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
          if (geocode.length > 0) {
            setAddress(`${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`);
          }
        }
      } catch (e) {
        console.log("Geocode error", e);
        setAddress("Unknown location");
      }
    })();
  }, []);



  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [sidePanelVisible, setSidePanelVisible] = useState(false);

  // 🎞️ Animations
  const animOpacity = useRef(new Animated.Value(0)).current; // General fade
  const animQuickAction = useRef(new Animated.Value(0)).current; // Quick Action Fade
  const animMap = useRef(new Animated.Value(0)).current; // Map Fade
  const animLocation = useRef(new Animated.Value(0)).current; // Dynamic Island (Location) Scale
  const animHero = useRef(new Animated.Value(0)).current; // Dynamic Island (Hero) Scale

  useEffect(() => {
    Animated.parallel([
      // 1. General Fade (Content Wrapper)
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 2. Quick Action (Linear Fade)
      Animated.timing(animQuickAction, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      // 3. Map (Fade)
      Animated.timing(animMap, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // 4. Dynamic Island - Location (Pop up)
      Animated.spring(animLocation, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      // 5. Dynamic Island - Hero (Pop up with slight delay)
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(animHero, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleStartBooking = () => {
    if (maintenance.isBookingDisabled) {
      Alert.alert(
        maintenance.effectiveMode === 'active' ? "Service Unavailable" : "Booking Temporarily Disabled ⚠️",
        maintenance.message || "Booking is temporarily disabled due to maintenance.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isUpdateRequired) {
      Alert.alert(
        "Update Required ⚠️",
        "You must update the app to book a ride.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Update Now", onPress: () => openStore() }
        ]
      );
      return;
    }

    navigation.navigate("ride_book" as never, {
      mapLocation: address,
      mapCoords: location ? { lat: (location as any).latitude, lng: (location as any).longitude } : null,
      type: "pickup"
    } as never);
  };

  const QuickAction = ({ icon, label, routeKey }: { icon: any, label: string, routeKey: string }) => {
    const isRideBook = routeKey === "ride_book";
    const disabled = isRideBook && (isUpdateRequired || maintenance.isBookingDisabled || !isMapLoaded);

    return (
      <TouchableOpacity
        style={[styles.actionCard, disabled && { opacity: 0.5 }]}
        onPress={() => {
          if (disabled) {
            if (!isMapLoaded) {
              Alert.alert(
                "Please Wait",
                "Map is still loading. Please wait a moment.",
                [{ text: "OK" }]
              );
              return;
            }
            handleStartBooking(); // Reuse the alert logic
            return;
          }

          if (routeKey === 'ride_book') {
            handleStartBooking();
          } else if ((routeMap as any)[routeKey]) {
            router.push((routeMap as any)[routeKey]);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIconCircle, disabled && { backgroundColor: "#999" }]}>
          <Ionicons name={icon} size={24} color="#ffffffff" />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SidePanel
        isVisible={sidePanelVisible}
        onClose={() => setSidePanelVisible(false)}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Bar (RESTORED OLD STYLE) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (isUpdateRequired) {
                Alert.alert(
                  "Update Required ⚠️",
                  "You must update the app to access the menu.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Update Now", onPress: () => openStore() }
                  ]
                );
                return;
              }
              setSidePanelVisible(true);
            }}
            style={[styles.menuBtn, isUpdateRequired && { opacity: 0.5 }]}
          >
            <Ionicons name="menu-outline" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.logoBox}>
            <Image
              source={require("@/assets/images/og_logo.png")}
              style={styles.logo}
            />
          </View>

          <TouchableOpacity
            onPress={() => setProfileMenuVisible(true)}
            style={styles.profileBtn}
          >
            <Ionicons name="person" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>

          <ProfileMenu
            isVisible={profileMenuVisible}
            onClose={() => setProfileMenuVisible(false)}
            onLogout={handleLogout}
            position={{ top: 50, right: 20 }}
          />
        </View>
        <Text style={{ textAlign: 'center', fontSize: 10, color: '#aaa', marginTop: 2, marginBottom: 5 }}>v{require('../../package.json').version}</Text>

        {/* Content Wrapper */}
        <Animated.View style={{ opacity: animOpacity }}>

          {/* Maintenance Banner */}
          {maintenance.effectiveMode !== 'none' && (
            <View style={styles.maintenanceBanner}>
              <View style={styles.maintenanceLeft}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.maintenanceBannerText} numberOfLines={2}>
                  Booking disabled for maintenance starting {(() => {
                    if (!maintenance.active_from) return 'soon';
                    const d = new Date(maintenance.active_from.replace('Z', ''));
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
                    return isToday ? timeStr : `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${timeStr}`;
                  })()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(true)}>
                <Ionicons name="information-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Upcoming Outstation Banner */}
          {upcomingCount > 0 && nearestUpcoming && (
            <View style={styles.upcomingBanner}>
              <View style={styles.upcomingLeft}>
                <View style={styles.upcomingIconBg}>
                  <Ionicons name="time" size={20} color="#fff" />
                </View>
                <Text style={styles.upcomingText}>View {upcomingCount} Upcoming Trip</Text>
              </View>
              <TouchableOpacity
                style={styles.upcomingBtn}
                onPress={() => {
                  if (upcomingCount > 1) {
                    router.push({ pathname: "/BookingsScreen", params: { filter: 'Scheduled' } });
                  } else {
                    router.push({
                      pathname: "/RideDetailsScreen",
                      params: { bookingId: String(nearestUpcoming.request_id || nearestUpcoming.id), source: 'home_upcoming' }
                    });
                  }
                }}
              >
                <Text style={styles.upcomingBtnText}>VIEW</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Where to today?</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Quick Actions Grid (Linear Fade) */}
          <Animated.View style={[styles.quickGrid, { opacity: animQuickAction }]}>
            <QuickAction
              icon="car-sport"
              label="Ride"
              routeKey="ride_book"
            />
            <QuickAction
              icon="time-outline"
              label="History"
              routeKey="ride_history"
            />
            {/* <QuickAction
              icon="wallet-outline"
              label="Wallet"
              routeKey="Cabcoin"
            /> */}
            <QuickAction
              icon="help-buoy-outline"
              label="Support"
              routeKey="support_help"
            />
          </Animated.View>

          {/* Combined Map & Hero Section */}
          <View style={styles.combinedContainer}>

            {/* Map Layer (Background - Fade Animation) */}
            <Animated.View style={{ flex: 1, opacity: animMap }}>
              <TouchableOpacity
                style={styles.mapLayer}
                onPress={handleStartBooking}
                activeOpacity={1}
              >
                {location ? (
                  <>
                    <MapView
                      style={styles.map}
                      provider={PROVIDER_GOOGLE}
                      region={location}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                      onMapReady={() => setIsMapLoaded(true)}
                    >
                      <Marker coordinate={location} pinColor="black" />
                    </MapView>
                    {!isMapLoaded && (
                      <View style={styles.mapPreloader}>
                        <ActivityIndicator size="large" color="#000" />
                        <Text style={styles.mapPreloaderText}>Loading Map...</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.mapLoadingText}>Locating...</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Address Overlay (Dynamic Island Animation) */}
            <Animated.View
              style={[
                styles.topAddressOverlay,
                { transform: [{ scale: animLocation }] }
              ]}
            >
              <Ionicons name="location-sharp" size={16} color="#000" />
              <Text style={styles.addressText} numberOfLines={1}>
                {location ? address : "Fetching location..."}
              </Text>
            </Animated.View>

            {/* Hero Card Layer (Dynamic Island Animation) */}
            <Animated.View
              style={[
                styles.heroOverlay,
                { transform: [{ scale: animHero }] },
                !isMapLoaded && { opacity: 0.5 }
              ]}
            >
              <View style={styles.heroContent}>
                <ThemedText type="title" style={styles.heroTitle}>
                  Comfort & Class Ride
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Experience the premium standard of travel.
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.heroCTA, !isMapLoaded && { backgroundColor: "#666" }]}
                onPress={() => {
                  if (!isMapLoaded) {
                    Alert.alert(
                      "Please Wait",
                      "Map is still loading. Please wait a moment.",
                      [{ text: "OK" }]
                    );
                    return;
                  }
                  handleStartBooking();
                }}
                activeOpacity={0.8}
                disabled={!isMapLoaded}
              >
                <Ionicons name="arrow-forward" size={24} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Promotion Banner */}
          <TouchableOpacity
            style={styles.promoBanner}
            onPress={handleStartBooking}
            activeOpacity={0.9}
          >
            <Image
              source={require("@/assets/images/promo_banner.png")}
              style={styles.promoImage}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/* Bottom Image */}
          <View style={styles.bottomImageContainer}>
            <Image
              source={require("@/assets/images/cabnow2.png")}
              style={styles.bottomImage}
              contentFit="cover"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Maintenance Details Modal */}
      <Modal
        visible={showMaintenanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMaintenanceModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.mModalContent}>
            <View style={styles.mModalHeader}>
              <Text style={styles.mModalTitle}>Maintenance Details</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.mModalBody}>
              <Ionicons name="construct" size={48} color="#FF9800" style={{ alignSelf: 'center', marginBottom: 15 }} />
              <Text style={styles.mModalMessage}>{maintenance.message}</Text>

              <View style={styles.mTimeRow}>
                <View style={styles.mTimeBox}>
                  <Text style={styles.mTimeLabel}>Active From</Text>
                  <Text style={styles.mTimeValue}>
                    {maintenance.active_from ? new Date(maintenance.active_from.replace('Z', '')).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' }).toUpperCase() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.mTimeBox}>
                  <Text style={styles.mTimeLabel}>Active To</Text>
                  <Text style={styles.mTimeValue}>
                    {maintenance.active_to ? new Date(maintenance.active_to.replace('Z', '')).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' }).toUpperCase() : 'N/A'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mCloseBtn}
                onPress={() => setShowMaintenanceModal(false)}
              >
                <Text style={styles.mCloseBtnText}>Understood</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: BG_COLOR,
    paddingTop: 16,
  },

  // RESTORED TOP BAR STYLES
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderRadius: 50,
    borderBottomColor: "#e0e0e0",
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 22,
    backgroundColor: "rgba(6,6,6,1)",
  },
  logoBox: {
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  profileBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  // Greeting
  greetingContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 4,
    fontWeight: "500",
  },

  // Quick Action Grid
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionCard: {
    alignItems: "center",
    width: (width - 48) / 4,
  },
  actionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: ICON_BG,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    textAlign: "center",
  },

  // Combined Map & Hero Component
  combinedContainer: {
    marginHorizontal: 24,
    marginBottom: 30,
    borderRadius: 24,
    height: 350,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mapLayer: {
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapLoadingText: {
    marginTop: 8,
    color: "#666",
  },
  mapPreloader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapPreloaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Top Address Overlay
  topAddressOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    flex: 1,
  },

  // Hero Overlay (Floating on top of Map)
  heroOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 20,
    backgroundColor: "#111111b8", // Dark Transparent Card
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#aaa",
    fontSize: 12,
    lineHeight: 16,
  },
  heroCTA: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#333333de",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#444",
  },

  // RESTORED BOTTOM IMAGE STYLES
  bottomImageContainer: {
    width: "100%",
    height: 400,
    marginTop: 30,
  },
  bottomImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    filter: "grayscale(1)",
    opacity: 0.5,
  },

  // Promo Banner Styles
  promoBanner: {
    marginHorizontal: 24,
    borderRadius: 24,
    aspectRatio: 1,

    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    elevation: 5,
    borderColor: "#333333",
  },
  promoImage: {
    width: "100%",
    height: "100%",
  },

  // Upcoming Banner Styles
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    padding: 12,
    borderRadius: 52,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  upcomingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  upcomingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  upcomingBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20
  },
  upcomingBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center'
  },
  maintenanceBanner: {
    backgroundColor: '#FF9800',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  maintenanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  maintenanceBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
  },
  mModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mModalBody: {
    padding: 24,
  },
  mModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  mTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  mTimeBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  mTimeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
  },
  mTimeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  mCloseBtn: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mCloseBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
