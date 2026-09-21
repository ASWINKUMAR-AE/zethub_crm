import { ThemedText } from "@/components/ThemedText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserBookings } from "../../hooks/useUserBookings";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
// Sample data for nearby drivers
const NEARBY_DRIVERS = [
  { id: 1, latitude: 37.78825, longitude: -122.4324, type: "car" },
  { id: 2, latitude: 37.78925, longitude: -122.4344, type: "car" },
  { id: 3, latitude: 37.78625, longitude: -122.4304, type: "auto" },
  { id: 4, latitude: 37.78525, longitude: -122.4354, type: "bike" },
];

// Sample ride options
const RIDE_OPTIONS = [
  { id: "car", name: "Car", icon: "car-sport", price: "₹14/km", time: "5 min" },
  {
    id: "auto",
    name: "Auto",
    icon: "rickshaw",
    price: "₹11/km",
    time: "7 min",
  },
  { id: "bike", name: "Bike", icon: "bicycle", price: "₹8/km", time: "3 min" },
  { id: "pool", name: "Pool", icon: "people", price: "₹10/km", time: "8 min" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  useEffect(() => {
    const checkRiderStatus = async () => {
      try {
        const statusRes = await userAPI.getStatus();
        // statusRes.status could be: "in_ride", "searching", "idle", etc.
        if (statusRes.status === "inRide") {
          navigation.replace("RiderRideTracker", {
            ...params, // pass existing params
            rideId: statusRes.rideId,
            // add any other params from statusRes if needed
          });
        } else if (statusRes.status === "searchingRide") {
          navigation.replace("RidePendingScreen", {
            ...params, // pass existing params
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
  const { user } = useAuth(); // Keep user context for data access

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
    // Added searching to be safe, though usually scheduled.
    return type === 'outstation' && ['scheduled', 'upcoming', 'searching', 'accepted', 'confirmedandnotstarted'].includes(status);
  }).sort((a: any, b: any) => {
    // Sort by date ASC
    const d1 = new Date(a.scheduled_at || a.ride_date).getTime();
    const d2 = new Date(b.scheduled_at || b.ride_date).getTime();
    return d1 - d2;
  });

  const upcomingCount = upcomingOutstation.length;
  const nearestUpcoming = upcomingOutstation[0];

  const [selectedRide, setSelectedRide] = useState("car");
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [mapReady, setMapReady] = useState(false);
  const mapRef = React.useRef(null);


  // For web map
  useEffect(() => {
    if (Platform.OS === "web") {
      const initializeWebMap = () => {
        if (mapRef.current && window.google && window.google.maps) {
          try {
            const map = new window.google.maps.Map(mapRef.current, {
              center: { lat: region.latitude, lng: region.longitude },
              zoom: 14,
              styles: mapStyle,
            });

            if (window.google.maps.Marker && window.google.maps.SymbolPath) {
              new window.google.maps.Marker({
                position: { lat: region.latitude, lng: region.longitude },
                map: map,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#0078FF",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                },
              });

              NEARBY_DRIVERS.forEach((driver) => {
                new window.google.maps.Marker({
                  position: { lat: driver.latitude, lng: driver.longitude },
                  map: map,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#FFD700",
                    fillOpacity: 0.8,
                    strokeColor: "#333",
                    strokeWeight: 2,
                  },
                });
              });
            }
          } catch (error) {
            console.error("Error initializing Google Maps:", error);
          }
        }

        setMapReady(true);
      };

      const loadGoogleMapsScript = () => {
        if (!document.getElementById("google-maps-script")) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src =
            "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places";
          script.async = true;
          script.defer = true;
          script.onload = initializeWebMap;
          document.head.appendChild(script);
        } else {
          initializeWebMap();
        }
      };

      loadGoogleMapsScript();
    }
  }, [Platform.OS]);

  const renderMap = () => {
    return (
      <View style={[styles.map, styles.mapPlaceholder]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.mapPlaceholderText}>
          This is map view place
        </ThemedText>
        <Ionicons name="map-outline" size={48} color="#555" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderMap()}

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.searchBar}>
            <Ionicons
              name="location"
              size={20}
              color="#aaa"
              style={styles.locationIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.favoritesButton}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>

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
                onPress={() => router.push({
                  pathname: "/RideDetailsScreen",
                  params: { bookingId: String(nearestUpcoming.request_id || nearestUpcoming.id), source: 'home_upcoming' }
                })}
              >
                <Text style={styles.upcomingBtnText}>VIEW</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />

          <ThemedText type="subtitle" style={styles.rideOptionsTitle}>
            Choose your ride
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rideOptionsContainer}
          >
            {RIDE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.rideOption,
                  selectedRide === option.id && styles.selectedRideOption,
                ]}
                onPress={() => setSelectedRide(option.id)}
              >
                {option.id === "auto" ? (
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={selectedRide === option.id ? "#fff" : "#aaa"}
                  />
                ) : (
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={selectedRide === option.id ? "#fff" : "#aaa"}
                  />
                )}
                <ThemedText
                  style={[
                    styles.rideOptionName,
                    selectedRide === option.id && styles.selectedRideText,
                  ]}
                >
                  {option.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.rideOptionPrice,
                    selectedRide === option.id && styles.selectedRideText,
                  ]}
                >
                  {option.price}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.rideOptionTime,
                    selectedRide === option.id && styles.selectedRideText,
                  ]}
                >
                  {option.time}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.bookButton}>
            <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  mapPlaceholderText: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  topBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191919",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#232323",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 0,
  },
  favoritesButton: {
    padding: 4,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#191919",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#232323",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#333",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  rideOptionsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  rideOptionsContainer: {
    paddingVertical: 8,
  },
  rideOption: {
    backgroundColor: "#232323",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedRideOption: {
    backgroundColor: "#333",
    borderColor: "#FFD700",
  },
  rideOptionName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  rideOptionPrice: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  rideOptionTime: {
    color: "#6ee7b7",
    fontSize: 12,
    marginTop: 4,
  },
  selectedRideText: {
    color: "#fff",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 20,
  },
  bookButtonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 120, 255, 0.3)",
    borderWidth: 1,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0078FF",
  },
  driverMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20
  },
  // Upcoming Banner Styles
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#333'
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
    fontSize: 14,
    fontWeight: '600'
  },
  upcomingBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  upcomingBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12
  }
});

// Custom map style to match the dark theme
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
];
function loadGoogleMapsScript() {
  throw new Error("Function not implemented.");
}
