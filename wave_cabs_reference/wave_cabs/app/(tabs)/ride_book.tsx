import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { userAPI } from '../services/api'; // adjust path as needed

const { width } = Dimensions.get('window');
const GOOGLE_API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";

type RootStackParamList = {
  RideBookScreen: undefined;
  SelectOnMapScreen: { type: string };
  bookingProcess: {
    pickupText: string;
    pickupLatLng: { lat: number; lng: number } | null;
    dropText: string;
    dropLatLng: { lat: number; lng: number } | null;
    bookedFor: string | { name: string; phone: string };
  };
};

export default function RideBookScreen() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropLocation, setDropLocation] = useState("");
  const [dropCoords, setDropCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forWhoModalVisible, setForWhoModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState("For Me");
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [activeInput, setActiveInput] = useState(null);
  const [pickupHistory, setPickupHistory] = useState<string[]>([]);
  const [dropHistory, setDropHistory] = useState<string[]>([]);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [mapLoading, setMapLoading] = useState(true); // New state for map loader
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const mapRef = useRef(null);

  // Animation values
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(300)).current;

  // Remove savedPersons array completely

  // Add a state to track if the pickup is set by GPS
  const [pickupSetByGPS, setPickupSetByGPS] = useState(false);

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      })
    ]).start();

    fetchCurrentLocation();
    setPickupHistory(["Home", "Work", "Airport"]);
    setDropHistory(["Office", "Client Site", "Restaurant"]);
  }, []);

  useEffect(() => {
    if (
      route?.params?.mapLocation !== undefined &&
      route?.params?.mapCoords !== undefined &&
      route?.params?.type !== undefined
    ) {
      const { mapLocation, mapCoords, type } = route.params;

      if (type === "pickup") {
        setPickupLocation(mapLocation);
        setPickupCoords({ lat: mapCoords.lat, lng: mapCoords.lng });
        updateMapRegion({ lat: mapCoords.lat, lng: mapCoords.lng });
      } else if (type === "drop") {
        setDropLocation(mapLocation);
        setDropCoords({ lat: mapCoords.lat, lng: mapCoords.lng });
        updateMapRegion({ lat: mapCoords.lat, lng: mapCoords.lng });
      }

      navigation.setParams({ mapLocation: undefined, mapCoords: undefined, type: undefined });
    }
  }, [route]);

  useEffect(() => {
    if (pickupCoords && dropCoords) {
      // Ensure both pickupCoords and dropCoords are valid before fitting markers
      if (pickupCoords.lat && pickupCoords.lng && dropCoords.lat && dropCoords.lng) {
        mapRef.current?.fitToCoordinates(
          [
            {
              latitude: pickupCoords.lat,
              longitude: pickupCoords.lng,
            },
            {
              latitude: dropCoords.lat,
              longitude: dropCoords.lng,
            }
          ],
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      } else {
        console.error("Invalid coordinates for pickup or drop location.");
      }
    } else if (pickupCoords) {
      updateMapRegion(pickupCoords);
    }
  }, [pickupCoords, dropCoords]);

  const updateMapRegion = (coords) => {
    setMapRegion({
      latitude: coords.lat,
      longitude: coords.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const fetchCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
    setPickupCoords(coords);
    updateMapRegion(coords);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(geocodeUrl);
    const data = await res.json();
    const address = data?.results?.[0]?.formatted_address;
    setPickupLocation(address || "");
    setPickupSetByGPS(true); // <-- set this flag
  };

  useEffect(() => {
    if (forWhoModalVisible) {
      fetchContacts();
    }
  }, [forWhoModalVisible]);

  useEffect(() => {
    if (!contactSearch) {
      setFilteredContacts(deviceContacts);
    } else {
      setFilteredContacts(
        deviceContacts.filter((contact) =>
          (contact.name || "")
            .toLowerCase()
            .includes(contactSearch.toLowerCase()) ||
          (contact.phoneNumbers?.[0]?.number || "")
            .replace(/\s/g, "")
            .includes(contactSearch.replace(/\s/g, ""))
        )
      );
    }
  }, [contactSearch, deviceContacts]);

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        const filtered = data.filter(
          (c) => Array.isArray(c.phoneNumbers) && c.phoneNumbers.length > 0
        );
        setDeviceContacts(filtered);
        setFilteredContacts(filtered);
      } else {
        setDeviceContacts([]);
        setFilteredContacts([]);
      }
    } catch (e) {
      alert("Could not load contacts");
      setDeviceContacts([]);
      setFilteredContacts([]);
    }
    setContactsLoading(false);
  };

  const handleDropChange = async (text) => {
    setDropLocation(text);
    setActiveInput("drop");
    if (text.length < 4) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Remove location and radius restriction from API call
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}&components=country:in`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.warn("Error fetching drop suggestions", e);
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handlePickupChange = async (text) => {
    setPickupLocation(text);
    setActiveInput("pickup");
    setPickupSetByGPS(false);
    if (text.length < 4) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Remove location and radius restriction from API call
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}&components=country:in`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.warn("Error fetching pickup suggestions", e);
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleSuggestionSelect = async (item) => {
    setSuggestions([]);
    Keyboard.dismiss();
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(detailUrl);
    const data = await res.json();
    const location = data?.result?.geometry?.location;
    if (!location) return alert("Could not retrieve location coordinates");

    if (activeInput === "pickup") {
      setPickupLocation(item.description);
      setPickupCoords(location);
    } else {
      setDropLocation(item.description);
      setDropCoords(location);
    }
  };

  const openMapSelection = (type) => {
    setActiveInput(type);
    navigation.navigate("SelectOnMapScreen", { type });
  };

  const renderSuggestionItem = ({ item }) => {
    const [title, ...subtitleParts] = item.description.split(",");
    const subtitle = subtitleParts.join(",").trim();

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionSelect(item)}
      >
        <Ionicons name="location-outline" size={20} color="#000" />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.suggestionSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const confirmBooking = () => {
    if (!pickupLocation || !dropLocation) {
      alert("Please select both pickup and drop locations");
      return;
    }

    navigation.navigate("bookingProcess", {
      pickupText: pickupLocation, // real address, not "Current location"
      pickupLatLng: pickupCoords,
      dropText: dropLocation,
      dropLatLng: dropCoords,
      bookedFor:
        selectedPerson === "Custom"
          ? { name: customName, phone: customPhone }
          : selectedPerson,
    });
  };

  const [contactPickerVisible, setContactPickerVisible] = useState(false);

  const openContactPicker = () => {
    setContactPickerVisible(true);
    setContactSearch("");
    fetchContacts();
  };

  const closeContactPicker = () => {
    setContactPickerVisible(false);
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={styles.personOption}
      onPress={() => {
        setCustomName(item.name || "");
        setCustomPhone(item.phoneNumbers?.[0]?.number || "");
        setSelectedPerson("Custom");
        setContactPickerVisible(false);
        setForWhoModalVisible(false);
      }}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : "?"}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name || "No Name"}</Text>
        <Text style={styles.contactPhone}>
          {item.phoneNumbers?.[0]?.number || "No phone"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#000" />
    </TouchableOpacity>
  );

  // Reset drop location and coords on screen exit
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setDropLocation("");
        setDropCoords(null);
        setSuggestions([]);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, {
        transform: [{ translateY: headerAnim }],
        opacity: fadeAnim
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Book Your Ride
        </Text>
        <View style={{ width: 24 }} /> {/* Spacer for balance */}
      </Animated.View>

      <Animated.View style={[styles.contentContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideUpAnim }]
      }]}>
        {/* Location Input Card with Map Preview */}
        <View style={styles.locationCard}>
          {/* Map Preview */}
          {mapRegion ? (
            <TouchableOpacity style={styles.mapPreview} activeOpacity={0.9}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={mapRegion}
                onMapReady={() => setMapLoading(false)}
              >
                {pickupCoords && <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} title="Pickup" pinColor="#000" />}
                {dropCoords && <Marker coordinate={{ latitude: dropCoords.lat, longitude: dropCoords.lng }} title="Drop" pinColor="#555" />}
              </MapView>

              {/* Loader overlay */}
              {mapLoading && (
                <View style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <ActivityIndicator size="large" color="#000" />
                  <Text style={{ marginTop: 8, fontSize: 14 }}>Loading map...</Text>
                </View>
              )}

              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>Tap to change location</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#000" />
          )}

          <View style={styles.locationInputContainer}>
            <View style={styles.iconColumn}>
              <View style={styles.pickupIcon}>
                <Ionicons name="location" size={16} color="#fff" />
              </View>
              <View style={styles.verticalLine} />
              <View style={styles.dropIcon}>
                <Ionicons name="flag" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.inputsColumn}>
              <TextInput
                style={[styles.input, styles.pickupInput]}
                value={pickupLocation}
                onFocus={() => setActiveInput("pickup")}
                onChangeText={(text) => {
                  setActiveInput("pickup");
                  handlePickupChange(text);
                }}
                placeholder="Current location"
                placeholderTextColor="#888"
              />
              <View style={styles.divider} />
              <TextInput
                style={[styles.input, styles.dropInput]}
                value={dropLocation}
                onFocus={() => setActiveInput("drop")}
                onChangeText={(text) => {
                  setActiveInput("drop");
                  handleDropChange(text);
                }}
                placeholder="Where to?"
                placeholderTextColor="#888"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.selectMapBtn}
            onPress={() => openMapSelection(activeInput || "pickup")}
          >
            <Ionicons name="map-outline" size={20} color="#ffffffff" />
            <Text style={styles.selectMapBtnText}>Select on map</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginVertical: 10 }} color="#000" size="large" />}

        {/* Show suggestions when typing in any field - positioned at top with dropdown scroll */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={renderSuggestionItem}
              style={{ maxHeight: 200 }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Remove recent history sections completely */}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.forWhoBtn}
            onPress={() => setForWhoModalVisible(true)}
          >
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
            <Text style={styles.forWhoBtnText}>
              {selectedPerson === "Custom" ? customName : selectedPerson}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bookBtn, (!pickupLocation || !dropLocation) && styles.bookBtnDisabled]}
            onPress={confirmBooking}
            disabled={!pickupLocation || !dropLocation}
          >
            <Text style={styles.bookBtnText}>Confirm Ride</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* --------- For Who Modal --------- */}
      <Modal visible={forWhoModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who is this ride for?</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setForWhoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select</Text>
              <TouchableOpacity
                style={styles.personOption}
                onPress={() => {
                  setSelectedPerson("For Me");
                  setForWhoModalVisible(false);
                }}
              >
                <View style={styles.avatarSmall}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
                <Text style={styles.personItem}>For Me</Text>
                {selectedPerson === "For Me" && <Ionicons name="checkmark-circle" size={20} color="#000" />}
              </TouchableOpacity>

              {/* Remove saved persons section completely */}
            </View>

            {/*    <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pick a Contact</Text>
              <TouchableOpacity
                style={styles.contactPickerButton}
                onPress={openContactPicker}
              >
                <Ionicons name="people-outline" size={22} color="#000" />
                <Text style={styles.contactPickerButtonText}>
                  Choose from contacts
                </Text>
              </TouchableOpacity>
            </View>*/}

            {/*  <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Booking</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                value={customName}
                onChangeText={setCustomName}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone"
                value={customPhone}
                keyboardType="phone-pad"
                onChangeText={setCustomPhone}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.saveCustomBtn}
                onPress={() => {
                  if (customName && customPhone) {
                    setSelectedPerson("Custom");
                    setForWhoModalVisible(false);
                  } else {
                    alert("Please enter both name and phone number");
                  }
                }}
              >
                <Text style={styles.saveCustomBtnText}>Save Custom</Text>
              </TouchableOpacity>
            </View>*/}

          </View>
        </View>
      </Modal>

      {/* --------- Contact Picker Modal --------- */}
      <Modal visible={contactPickerVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a Contact</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeContactPicker}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contact by name or phone"
                placeholderTextColor="#888"
                value={contactSearch}
                onChangeText={setContactSearch}
              />
            </View>

            {contactsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContactItem}
                style={{ maxHeight: 400 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>No contacts found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginTop: 30,
    paddingHorizontal: 20,
    marginHorizontal: 30,
    borderRadius: 50,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    color: "#fff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  mapPreview: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 52,
    marginBottom: 10,
    padding: 8,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  locationInputContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iconColumn: {
    width: 40,
    alignItems: "center",
    marginRight: 10,
  },
  pickupIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#000",
    marginVertical: 4,
    opacity: 0.5,
  },
  dropIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  inputsColumn: {
    flex: 1,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000",
  },
  pickupInput: {
    marginBottom: 6,
  },
  dropInput: {
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
  selectMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 10,
    backgroundColor: '#000000ff',
    borderRadius: 22,
    alignSelf: 'flex-start',
  },
  selectMapBtnText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ffffffff",
    fontWeight: "500",
  },
  suggestionsContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    margin: 5,

    backgroundColor: "#ffffffed",
    borderRadius: 28,
    paddingVertical: 6,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1.20,
    shadowRadius: 8,
    elevation: 6,

    maxHeight: 160,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    zIndex: 9999,
  },

  suggestionsList: {
    flex: 1,
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,

    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  suggestionTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  suggestionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111",
  },

  suggestionSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 30,
    paddingTop: 15,
  },
  forWhoBtn: {
    width: 170,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  forWhoBtnText: {
    fontSize: 16,
    color: "#000",
    marginRight: 8,
  },
  bookBtn: {
    backgroundColor: "#000",
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bookBtnDisabled: {
    backgroundColor: "#ccc",
  },
  bookBtnText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 20,
    color: "#000",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#000",
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  personOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  personItem: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#000",
  },
  contactPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  contactPickerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
  modalInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
    marginBottom: 12,
  },
  saveCustomBtn: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveCustomBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: "#000",
  },
  contactPhone: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});