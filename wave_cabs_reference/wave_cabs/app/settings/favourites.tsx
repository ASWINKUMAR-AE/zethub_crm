import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { locationAPI } from "../services/api";

// Configure notifications globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRIMARY_COLOR = "#111827";
const ACCENT_COLOR = "#000";
const BG_COLOR = "#f5f7fa";
const CARD_BG = "#fff";
const BORDER_COLOR = "#e5e7eb";

// API Save Helper
async function saveFavoriteLocationToDB({
  name,
  phone,
  latitude,
  longitude,
  locName,
  timestamp,
}: {
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  locName: string;
  timestamp: number;
}) {
  try {
    const result = await locationAPI.saveFavoriteLocation({
      name,
      phone,
      latitude,
      longitude,
      locName,
      timestamp,
    });
    console.log("✅ Saved to DB:", result);
    return result;
  } catch (error) {
    console.error("❌ Error saving to DB:", error);
    throw error;
  }
}

export default function LocationScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const { name, phone } = useLocalSearchParams() as {
    name?: string;
    phone?: string;
    user_id?: string;
  };

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [locations, setLocations] = useState<
    { latitude: number; longitude: number; timestamp: number; name: string }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [region, setRegion] = useState<Region | null>(null);
  const [watchId, setWatchId] = useState<Location.LocationSubscription | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;

    (async () => {
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== "granted") {
        console.log("Notification permission not granted");
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        Alert.alert("Permission denied", "Location permission was denied.");
        setLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);

        const { latitude, longitude } = location.coords;
        const initialRegion: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(initialRegion);

        // Start watching location updates
        locationSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setUserLocation(newLocation);
          }
        );

        setWatchId(locationSub);
        setLoading(false);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to get location.");
        setLoading(false);
      }
    })();

    const notificationSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const locationData = response.notification.request.content.data.locationData as {
          latitude: number;
          longitude: number;
        };
        if (locationData) {
          animateToLocation(locationData);
        }
      }
    );

    return () => {
      notificationSub.remove();
      if (locationSub) locationSub.remove();
    };
  }, []);

  const getPlaceName = async (latitude: number, longitude: number) => {
    try {
      const placemarks = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (placemarks.length > 0) {
        const place = placemarks[0];
        return (
          [place.name, place.street, place.city, place.region, place.country]
            .filter(Boolean)
            .join(", ") || "Unknown Location"
        );
      }
      return "Unknown Location";
    } catch {
      return "Unknown Location";
    }
  };

  const animateToLocation = (loc: { latitude: number; longitude: number }) => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      1000
    );
  };

  const handleAddLocation = async () => {
    setAdding(true);
    try {
      if (!userLocation) throw new Error("No location available");

      const { latitude, longitude } = userLocation.coords;
      const timestamp = userLocation.timestamp;
      const locName = await getPlaceName(latitude, longitude);

      const newLoc = { latitude, longitude, timestamp, name: locName };

      console.log(
        `Added Favourite Location:\nUser: ${name}\nPhone: ${phone}\nLoc: ${locName}\nLat: ${latitude}\nLng: ${longitude}`
      );

      await saveFavoriteLocationToDB({
        name: name || "",
        phone: phone || "",
        latitude,
        longitude,
        locName,
        timestamp,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Location Saved!",
          body: `${locName} added to your favourites.`,
          sound: "default",
          data: { locationData: newLoc },
        },
        trigger: null,
      });

      setLocations((prev) => {
        const newLocations = [...prev, newLoc];
        const newIndex = newLocations.length - 1;
        setCurrentIndex(newIndex);
        animateToLocation(newLoc);
        setRegion({
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
        return newLocations;
      });
    } catch (err) {
      console.error("Error adding location:", err);
      Alert.alert("Error", "Failed to add current location.");
    } finally {
      setAdding(false);
    }
  };

  const handleViewLocation = (index: number) => {
    const loc = locations[index];
    if (!loc) return;
    setCurrentIndex(index);
    animateToLocation(loc);
    setRegion({
      latitude: loc.latitude,
      longitude: loc.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  const handleDeleteLocation = (index: number) => {
    Alert.alert("Delete Location", "Are you sure you want to delete this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLocations((prev) => {
            const updated = [...prev];
            updated.splice(index, 1);
            setCurrentIndex(-1);
            return updated;
          });
        },
      },
    ]);
  };

  if (loading || !region) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={{ marginTop: 10, color: PRIMARY_COLOR }}>Fetching your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourites</Text>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          region={region}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          mapType="standard"
        >
          {locations.map((loc, idx) => (
            <Marker
              key={idx}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              pinColor={idx === currentIndex ? ACCENT_COLOR : "#18181b"}
              title={loc.name || `Location ${idx + 1}`}
              description={`Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}`}
            />
          ))}
        </MapView>

        <TouchableOpacity style={styles.fab} onPress={handleAddLocation} disabled={adding}>
          {adding ? <ActivityIndicator color={CARD_BG} /> : <Ionicons name="add" size={28} color={CARD_BG} />}
        </TouchableOpacity>
      </View>

      {/* Location List */}
      <ScrollView style={{ flex: 1, backgroundColor: BG_COLOR }} contentContainerStyle={styles.contentContainer}>
        {locations.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="location-outline" size={44} color={ACCENT_COLOR} />
            <Text style={styles.description}>Tap the + button to add your current location as a favourite.</Text>
          </View>
        ) : (
          <View style={styles.locationListContainer}>
            {locations.map((loc, idx) => (
              <View key={idx} style={[styles.locationItem, currentIndex === idx && styles.locationItemActive]}>
                <TouchableOpacity onPress={() => handleViewLocation(idx)}>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={20}
                      color={currentIndex === idx ? ACCENT_COLOR : PRIMARY_COLOR}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationTitle}>{loc.name || `Location ${idx + 1}`}</Text>
                      <Text style={styles.locationCoor}>
                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      </Text>
                    </View>
                    <Text style={styles.timeLabel}>
                      {new Date(loc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={styles.timestamp}>Added: {new Date(loc.timestamp).toLocaleString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteLocation(idx)}>
                  <Ionicons name="trash-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingTop: Platform.OS === "ios" ? 54 : 30,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    elevation: 2,
    zIndex: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  mapWrap: {
    height: 300,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  map: { flex: 1 },
  fab: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: ACCENT_COLOR,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  contentContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  description: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    textAlign: "center",
    fontSize: 16,
  },
  locationListContainer: { marginTop: 12 },
  locationItem: {
    backgroundColor: CARD_BG,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    position: "relative",
  },
  locationItemActive: { borderColor: ACCENT_COLOR },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  locationTitle: { fontSize: 16, fontWeight: "500", color: PRIMARY_COLOR },
  locationCoor: { color: "#6b7280", fontSize: 14 },
  timeLabel: { color: "#6b7280", fontSize: 12 },
  timestamp: { fontSize: 12, color: "#6b7280" },
  deleteButton: {
    position: "absolute",
    bottom: 10,
    right: 12,
    backgroundColor: "#e5e7eb",
    padding: 4,
    borderRadius: 20,
  },
});
