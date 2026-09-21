import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { userAPI } from '../services/api'; // adjust path as needed

const GOOGLE_API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";


export default function SelectOnMapScreen() {
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params || {};
  const [region, setRegion] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceable, setServiceable] = useState(true);
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  // --- Add these constants at the top ---
const MADURAI_LAT = 9.9252;
const MADURAI_LNG = 78.1198;
const MADURAI_RADIUS = 30000; // 30km in meters

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in metres
  return d;
}

  // // --- Back navigation: always go to bookingProcess, not index ---
  // useEffect(() => {
  //   const onBackPress = () => {
  //     Alert.alert(
  //       "Exit Location Selection",
  //       "Are you sure you want to go back to booking?",
  //       [
  //         { text: "Cancel", style: "cancel" },
  //         { text: "Yes", style: "destructive", onPress: () => navigation.navigate("bookingProcess") },
  //       ]
  //     );
  //     return true;
  //   };
  //   // Add event listener for hardware back
  //   const subscription = navigation.addListener?.("beforeRemove", (e: any) => {
  //     e.preventDefault();
  //     onBackPress();
  //   });
  //   return () => {
  //     if (subscription && subscription.remove) subscription.remove();
  //   };
  // }, [navigation]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Start animation when address changes
    if (address && address !== "Fetching address...") {
      animateAddressBox();
    }
     
  }, [address, animateAddressBox]);

  const animateAddressBox = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    pulseAnim.setValue(1);

    // Parallel animations
    Animated.parallel([
      // Fade in + slide up
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Pulse effect
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(coords);
    setLoading(false);
  };

  const onRegionChangeComplete = async (newRegion) => {
    setRegion(newRegion);
    const distance = getDistance(MADURAI_LAT, MADURAI_LNG, newRegion.latitude, newRegion.longitude);
    setServiceable(distance <= MADURAI_RADIUS);
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newRegion.latitude},${newRegion.longitude}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(geocodeUrl);
      const data = await res.json();
      const addr = data?.results?.[0]?.formatted_address || "Fetching address...";
      setAddress(addr);
    } catch (error) {
      console.warn("Reverse geocoding failed", error);
    }
  };
  const handleConfirm = () => {
    navigation.navigate("ride_book", {
      mapCoords: {
        lat: region.latitude,
        lng: region.longitude,
      },
      mapLocation: address,
      type,
    });
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Exit Location Selection",
            "Are you sure you want to go back to booking?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Yes", style: "destructive", onPress: () => navigation.navigate("ride_book") },
            ]
          );
        }} style={styles.backButton}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select {type === "pickup" ? "Pickup" : "Drop"} Location</Text>
      </View>

      {/* Center Marker with Label */}
      <View style={styles.markerFixed}>
        <View style={styles.markerContainer}>
          <Text style={styles.markerLabel}>
            {type === "pickup" ? "PICKUP LOCATION" : "DROP LOCATION"}
          </Text>
          <View style={styles.markerCircle}>
            <View style={styles.markerInnerCircle} />
          </View>
        </View>
      </View>

      {/* Animated Address box */}
      <Animated.View 
        style={[
          styles.addressBox,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: pulseAnim }
            ]
          }
        ]}
      >
        <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
      </Animated.View>

{!serviceable && (
  <View style={{
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff3f3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcccc'
  }}>
    <Text style={{color: '#d32f2f', fontWeight: 'bold', fontSize: 16}}>
      We are not Serviceable
    </Text>
  </View>
)}

<TouchableOpacity
  style={[
    styles.confirmBtn,
    !serviceable && { backgroundColor: '#ccc', borderColor: '#ccc' }
  ]}
  onPress={handleConfirm}
  disabled={!serviceable}
>
  <Text style={[
    styles.confirmBtnText,
    !serviceable && { color: '#888' }
  ]}>
    Confirm {type === "pickup" ? "Pickup" : "Drop"} Location
  </Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#000",
    fontSize: 16,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56,
    backgroundColor: "#000",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 30,
    zIndex: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "transparent",
    marginLeft: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: "#fff",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: -20,
  },
  markerFixed: {
    left: "50%",
    top: "50%",
    marginLeft: -24,
    marginTop: -48,
    position: "absolute",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.51)",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  markerInnerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  addressBox: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderTopLeftRadius: 26,
    borderWidth: 1,
    borderColor: "transparent",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addressText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  confirmBtn: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#020202ce",
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: "center",
    borderWidth: 2,

    shadowColor: "#151414d6",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnText: {
    color: "#ffffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});