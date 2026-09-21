import { useNavigation, useRoute } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { AppState, DevSettings } from "react-native";

import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MessageScreen from "../(tabs)/MessageScreen";

const DP_BASE_URL = "https://server.wavecabs.com/uploads/dp/";

import MapViewDirections from "react-native-maps-directions";
import Icon from "react-native-vector-icons/MaterialIcons";
import { rideAPI, userAPI } from "../services/api";
import { socket } from "../services/socket";

// Grayscale theme colors (consistent with RidePendingScreen)
const PRIMARY_COLOR = "#222";
const BG_COLOR = "#F9FAFB";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "#E5E7EB";
const ACCENT_COLOR = "#6B7280";
const INACTIVE_COLOR = "#D1D5DB";
const GOOGLE_MAPS_API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";

const RiderRideTracker = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [rideData, setRideData] = useState({
    rideId: null,
    pickupAddress: "",
    dropAddress: "",
    expectedOTP: "",
    vehicleDetails: null,
    driverId: null,
    riderId: null,
    pickupLatLng: null,
    dropLatLng: null,
    bookingStatus: null, // confirmedAndNotStarted / confirmedAndStarted / cancelled
    requestId: null,
    vehicleType: null, // bike, car, auto
    tripType: null,
  });

  // Use a ref to keep track of rideData inside stable callbacks/effects
  const rideDataRef = useRef(rideData);
  useEffect(() => {
    rideDataRef.current = rideData;
  }, [rideData]);

  const [driverLoc, setDriverLoc] = useState(null);
  const [driverRotation, setDriverRotation] = useState(0);
  const [isReturnJourney, setIsReturnJourney] = useState(false);
  const [returnOrigin, setReturnOrigin] = useState(null);
  const hasNavigatedRef = useRef(false);
  const mapRef = useRef(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const appState = useRef(AppState.currentState);

  // Message modal states
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesListRef = useRef(null);

  // Helper to calculate bearing
  const calculateBearing = (startLat, startLng, destLat, destLng) => {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
      Math.cos(startLatRad) * Math.sin(destLatRad) -
      Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  // Animation refs for driver marker and buttons
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [remainingMinutes, setRemainingMinutes] = useState(null);

  /** 🛠 Merge params into state */
  const mergeParams = (params) => {
    setRideData((prev) => ({ ...prev, ...params }));
  };

  const fetchReturnRoute = () => {
    // Sets the origin for the return route to the current driver location
    // This effectively "fetches" the new route via MapViewDirections when state updates
    if (driverLoc) {
      setReturnOrigin(driverLoc);
    } else if (rideData.dropLatLng) {
      setReturnOrigin({ latitude: rideData.dropLatLng.lat, longitude: rideData.dropLatLng.lng });
    }
  };

  const startReturnJourneyMode = () => {
    setIsReturnJourney(true);
    fetchReturnRoute();
  };

  /** 🚀 Check status (used on mount & resume) */
  const checkGlobalStatus = async () => {
    try {
      console.log("Checking Global Rider Status...");
      const statusRes = await userAPI.getStatus();
      console.log("Global Status:", statusRes);

      // 1. If payment pending (Completed), force navigation immediately
      if (statusRes.status === "payment" || (statusRes.status === "inRide" && statusRes.bookingStatus === "payment_pending")) {
        console.log("Ride completed detected by Global Check - Navigating to CompleteRide");

        // Avoid double navigation
        if (hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;

        navigation.replace("CompleteRide", {
          request_id: statusRes.requestId || statusRes.request_id,
          fare: statusRes.fare,
          payment_method: statusRes.payment_method,
        });
        return;
      }

      // 2. If no ride, go Home (e.g. cancelled while backgrounded)
      if (statusRes.status === "notInRide") {
        console.log("No active ride - Navigating Home");
        navigation.replace("HomeScreen");
        return;
      }

      // 3. If searching, go to Pending
      if (statusRes.status === "searchingRide") {
        navigation.replace("RidePendingScreen", { requestId: statusRes.requestId });
        return;
      }
    } catch (error) {
      console.warn("Error checking global rider status:", error);
    }
  };

  /** 🚀 On mount, check ride status */
  useEffect(() => {
    // Initial Load
    const init = async () => {
      // Full logic for first load (fetching details etc)
      await checkGlobalStatus(); // Checks status and navigates if needed on start

      // ... rest of detailed fetch can stay or depend on sync ...
      // actually, for this fix, let's reuse the logic from the previous `init` 
      // but via checkGlobalStatus for the navigation critical parts.

      // To populate the UI on first load if we stay on this screen:
      try {
        const statusRes = await userAPI.getStatus();
        if (statusRes.status === "inRide") {
          let rideIdToFetch = statusRes.rideId || (route.params?.rideId);
          if (rideIdToFetch) {
            const rideDetails = await rideAPI.getRideDetails(rideIdToFetch);
            // ... populate state ...
            const normalizedDetails = {
              rideId: rideDetails.rideId,
              pickupAddress: rideDetails.pickup_location,
              dropAddress: rideDetails.dropoff_location,
              expectedOTP: rideDetails.otp,
              vehicleDetails: {
                driverName: rideDetails.driver_name || "",
                driverPhone: rideDetails.driver_phone || "",
                vehicleNumber: rideDetails.vehicle_number || "",
              },
              driverId: rideDetails.driver_id,
              riderId: rideDetails.user_id,
              pickupLatLng: {
                lat: rideDetails.pickup_latitude,
                lng: rideDetails.pickup_longitude,
              },
              dropLatLng: {
                lat: rideDetails.dropoff_latitude,
                lng: rideDetails.dropoff_longitude,
              },
              bookingStatus: rideDetails.status,
              requestId: rideDetails.request_id,
              requestId: rideDetails.request_id,
              vehicleType: (rideDetails.vehicle_type || rideDetails.vehicleType || "car").toString(),
              tripType: rideDetails.trip_type || rideDetails.tripType,
            };
            console.log("� RIDE DETAILS DEBUG:", JSON.stringify(rideDetails, null, 2));
            mergeParams(normalizedDetails);
          }
        }
      } catch (e) { console.warn("Detail fetch error", e); }
    };
    init();
  }, []);

  /** ❌ Cancel ride */
  const handleCancelRide = async () => {
    setCancelModalVisible(false);
    try {
      const requestId =
        rideData.requestId ||
        (route.params && route.params.requestId) ||
        undefined;
      if (!requestId) {
        Alert.alert("Error", "Request ID not found. Cannot cancel ride.");
        return;
      }
      const res = await rideAPI.cancelRide(requestId);
      if (res.success) {
        mergeParams({ bookingStatus: "cancelled" });
        if (socket.connected) {
          socket.emit("rideCancelledByRider", {
            rideId: rideData.rideId,
            driverId: rideData.driverId,
          });
        }
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Ride Cancelled",
            body: "Your booking has been cancelled.",
            sound: "default",
          },
          trigger: null,
        });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Failed", res.message || "Cancellation failed.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  /** 🔗 Centralized Socket and Polling Management */
  useEffect(() => {
    // Only proceed if we have a riderId
    if (!rideData.riderId) return;

    // 1. Define Handlers (Stable functions via Refs or defined inside effect)

    const handleDriverLoc = (data) => {
      const coords = { latitude: data.lat, longitude: data.lng };
      setDriverLoc(coords);

      // Use Ref for latest data access without effect dependency
      const currentData = rideDataRef.current;
      const currentStarted = currentData.bookingStatus === "confirmedAndStarted";

      const target = currentStarted && currentData.dropLatLng
        ? { latitude: currentData.dropLatLng.lat, longitude: currentData.dropLatLng.lng }
        : (currentData.pickupLatLng ? { latitude: currentData.pickupLatLng.lat, longitude: currentData.pickupLatLng.lng } : null);

      if (target) {
        // Calculate bearing from Driver to Target
        const heading = calculateBearing(coords.latitude, coords.longitude, target.latitude, target.longitude);
        setDriverRotation(heading);
      }

      if (mapRef.current && target) {
        // Optional: Debounce this or make it smoother
        mapRef.current.fitToCoordinates([coords, target], {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    };

    const handleRideStarted = () => {
      console.log("Socket: rideStarted received");
      mergeParams({ bookingStatus: "confirmedAndStarted" });
    };

    const handleRideCompleted = (data) => {
      console.log("Socket: rideCompletedInitiated received", JSON.stringify(data));
      if (hasNavigatedRef.current) return;

      // Extract data defensively handling various casings
      const finalRequestId = data.request_id || data.requestId || data.requestID || data.id;
      const finalFare = data.fare || data.amount || data.totalAmount;
      const finalPaymentMethod = data.payment_method || data.paymentMethod || "cash";

      if (!finalRequestId) {
        console.error("Socket: Missing Request ID in completion event", data);
        // Optionally fetch details if ID missing? For now logging is improved.
        return;
      }

      hasNavigatedRef.current = true;

      // Use consistent navigation method
      navigation.replace("CompleteRide", {
        request_id: finalRequestId,
        fare: finalFare,
        payment_method: finalPaymentMethod,
        // Pass all breakdown keys
        offered_fare: data.offered_fare,
        fare_before_discount: data.fare_before_discount,
        coupon_code: data.coupon_code,
        waitingMinute: data.waitingMinute,
        waitingFare: data.waitingFare,
        extraWaitingMinutes: data.extraWaitingMinutes,
        extraWaitingAmount: data.extraWaitingAmount,
        finalFare: data.finalFare,
        discount_percent: data.discount_percent,
        default_dis_com: data.default_dis_com ? JSON.stringify(data.default_dis_com) : null, // <--- Serialized for safety
      });
    };

    const handleRideCancelled = () => {
      mergeParams({ bookingStatus: "cancelled" });
      Alert.alert("Ride Cancelled", "Driver has cancelled your ride.");
      navigation.replace("HomeScreen"); // specific tab or screen name for consistency
    };

    // 2. Setup Socket listeners ONCE
    const setupSocket = () => {
      if (!socket.connected) socket.connect();
      socket.emit("joinRiderRoom", { userId: rideData.riderId });
      console.log("Socket: Joining Rider Room", rideData.riderId);

      socket.off("driverLocationUpdate", handleDriverLoc);
      socket.on("driverLocationUpdate", handleDriverLoc);

      socket.off("rideStarted", handleRideStarted);
      socket.on("rideStarted", handleRideStarted);

      socket.off("rideCompletedInitiated", handleRideCompleted);
      socket.on("rideCompletedInitiated", handleRideCompleted);

      socket.off("rideCancelledByDriver", handleRideCancelled);
      socket.on("rideCancelledByDriver", handleRideCancelled);

      const handleRideStatusUpdated = (data) => {
        console.log("Socket: rideStatusUpdated received", data);
        if (data.status === "outstationReturnJourney") {
          mergeParams({ bookingStatus: "outstationReturnJourney" });
        }
      };

      socket.off("rideStatusUpdated", handleRideStatusUpdated);
      socket.on("rideStatusUpdated", handleRideStatusUpdated);

      const handleReturnJourneyStarted = (payload) => {
        console.log("Socket: outstationReturnJourneyStarted received", payload);
        if (payload.rideId == rideData.rideId) { // Loose equality for string/number match
          mergeParams({ bookingStatus: "outstationReturnJourney" });
          startReturnJourneyMode();
        }
      };

      socket.off("outstationReturnJourneyStarted", handleReturnJourneyStarted);
      socket.on("outstationReturnJourneyStarted", handleReturnJourneyStarted);
    };

    setupSocket();

    // 5. Robust Fallback API Polling & Sync Function
    const syncRideStatus = async () => {
      // ... (Existing Polling Logic)
      // We can keep this for in-screen updates
      const currentData = rideDataRef.current;
      const rId = currentData.rideId;
      if (!rId) return;

      try {
        const details = await rideAPI.getRideDetails(rId);

        // Sync Started Status
        if (details.status === "confirmedAndStarted" && currentData.bookingStatus !== "confirmedAndStarted") {
          mergeParams({ bookingStatus: "confirmedAndStarted" });
        }

        // Sync Completed Status (Check for payment pending or completed)
        if (details.status === "completed" || details.status === "payment_pending") {
          if (!hasNavigatedRef.current) {
            console.log("Polling: Detected Ride Completed/Payment Pending", details);
            const pRequestId = details.request_id || details.requestId || details.id;
            const pFare = details.fare;
            const pPaymentMethod = details.payment_method || details.paymentMethod;

            if (pRequestId) {
              hasNavigatedRef.current = true;
              navigation.replace("CompleteRide", {
                request_id: pRequestId,
                fare: pFare,
                payment_method: pPaymentMethod,
                default_dis_com: (details.default_dis_com || details.defaultDisCom) ? JSON.stringify(details.default_dis_com || details.defaultDisCom) : null,
              });
            }
          }
        }
        // Sync Cancelled
        if (details.status === "cancelled" && currentData.bookingStatus !== "cancelled") {
          // ... handle cancel
        }
      } catch (e) { }
    };

    // Runs every 5 seconds
    const pollingInterval = setInterval(syncRideStatus, 5000);

    // 3. Handle App State Changes (Re-join room & SYNC on foreground)
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground! Performing Full Global Status Check.");

        // 1. Reconnect Socket
        if (!socket.connected) socket.connect();
        socket.emit("joinRiderRoom", { userId: rideData.riderId });

        // 2. CHECK GLOBAL STATUS (This handles the "Complete Ride" navigation)
        checkGlobalStatus();

        // 3. Also sync current ride details if we stay here
        syncRideStatus();
      }
      appState.current = nextAppState;
    });

    // 4. Handle Socket Reconnection specifically
    const onConnect = () => {
      console.log("Socket: Reconnected. Re-joining room.");
      socket.emit("joinRiderRoom", { userId: rideData.riderId });
      // Also sync on reconnect
      syncRideStatus();
    };
    socket.on("connect", onConnect);

    // 6. Cleanup on Unmount (or riderId change)
    return () => {
      console.log("Unmounting RiderRideTracker... cleaning up listeners.");
      subscription.remove();
      clearInterval(pollingInterval);

      socket.off("driverLocationUpdate", handleDriverLoc);
      socket.off("rideStarted", handleRideStarted);
      socket.off("rideCompletedInitiated", handleRideCompleted);
      socket.off("rideCancelledByDriver", handleRideCancelled);
      socket.off("connect", onConnect);

      socket.emit("leaveRiderRoom", { userId: rideData.riderId });
    };
  }, [rideData.riderId]); // Only Re-run if riderId changes (rare)

  // Derive rideStarted from bookingStatus
  const rideStarted = rideData.bookingStatus === "confirmedAndStarted" || rideData.bookingStatus === "outstationReturnJourney";
  const isRoundTrip = rideData.tripType === "round";
  // Sync local isReturnJourney state with bookingStatus if needed (for initial load)
  useEffect(() => {
    if (rideData.bookingStatus === "outstationReturnJourney" && !isReturnJourney) {
      startReturnJourneyMode();
    }
  }, [rideData.bookingStatus]);

  // Fetch driver details if missing
  useEffect(() => {
    if (
      rideData.driverId &&
      (!rideData.vehicleDetails ||
        !rideData.vehicleDetails.driverName ||
        !rideData.vehicleDetails.driverPhone ||
        !rideData.vehicleDetails.vehicleNumber)
    ) {
      let cancelled = false;
      const fetchDriverDetails = async () => {
        try {
          const driverDetails = await userAPI.getDriverDetails(rideData.driverId);
          if (!cancelled) {
            mergeParams({
              vehicleDetails: {
                driverName: driverDetails.name || "",
                driverPhone: driverDetails.phone_number || "",
                vehicleNumber: driverDetails.vehicle_number || "",
                vehicleModel: driverDetails.vehicle_model || "",
                dpUrl: driverDetails.dp_url || "",
              },
              vehicleType: (driverDetails.vehicle_type || driverDetails.vehicleType || rideData.vehicleType || "car").toString(),
            });
            console.log(driverDetails);
          }
        } catch (err) {
          console.warn("Failed to fetch driver details", err);
        }
      };

      fetchDriverDetails();
      return () => { cancelled = true; };
    }
  }, [rideData.driverId]);
  console.log("Driver details:", rideData.vehicleDetails);
  /** 📞 Call driver */
  const handleCall = async () => {
    try {
      if (!rideData.vehicleDetails?.driverPhone) {
        Alert.alert("Unable to Call", "Driver phone number not available yet. Please try again in a moment.");
        console.warn("Driver phone not available:", rideData.vehicleDetails);
        return;
      }
      const phoneNumber = rideData.vehicleDetails.driverPhone;
      const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (canOpen) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert("Error", "Unable to make calls from this device.");
      }
    } catch (error) {
      console.error("Call error:", error);
      Alert.alert("Error", "Failed to initiate call. Please try again.");
    }
  };

  /** 💬 Open message modal (removed navigation to separate screen) */
  const handleMessage = () => {
    setMessageModalVisible((prev) => !prev); // ⬅ toggle open/close
  };


  /** Send message */
  const sendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isSelf: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // TODO: Emit real message via socket
    // socket.emit("sendChatMessage", {
    //   rideId: rideData.rideId,
    //   message: inputText.trim(),
    //   to: rideData.driverId,
    // });
  }, [inputText, rideData.rideId, rideData.driverId]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messageModalVisible) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, messageModalVisible]);

  // Driver marker pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Button press animation
  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!rideData.rideId) return;

    const fetchPackageTime = async () => {
      try {
        const res = await rideAPI.getPackageTime(rideData.rideId);
        if (res?.remainingMinutes !== undefined) {
          setRemainingMinutes(res.remainingMinutes);
        }
      } catch (err) {
        console.log("Failed to fetch package time", err);
      }
    };

    fetchPackageTime();

    const interval = setInterval(async () => {
      try {
        const res = await rideAPI.getPackageTime(rideData.rideId);
        if (res?.remainingMinutes !== undefined) {
          setRemainingMinutes(res.remainingMinutes);
        }
      } catch { }
    }, 60000);

    return () => clearInterval(interval);
  }, [rideData.rideId]);

  /** 🔄 Refresh Page */
  const handleRefresh = () => {
    try {
      // Use DevSettings to reload the app in development mode
      DevSettings.reload();
    } catch (err) {
      console.error("Failed to reload app:", err);
    }
  };

  if (!rideData.pickupLatLng) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  const pickup = { latitude: rideData.pickupLatLng.lat, longitude: rideData.pickupLatLng.lng };
  const drop = rideData.dropLatLng
    ? { latitude: rideData.dropLatLng.lat, longitude: rideData.dropLatLng.lng }
    : null;

  // Add MapViewDirections to render route between pickup and drop locations
  const renderRoute = () => {
    if (isReturnJourney && rideData.pickupLatLng) {
      // Return Journey Route: Driver (Live) -> Pickup
      // Use driverLoc if available, otherwise drop location as fallback
      const returnStart = driverLoc || (rideData.dropLatLng ? { latitude: rideData.dropLatLng.lat, longitude: rideData.dropLatLng.lng } : null);

      if (returnStart) {
        return (
          <MapViewDirections
            origin={returnStart}
            destination={{
              latitude: rideData.pickupLatLng.lat,
              longitude: rideData.pickupLatLng.lng,
            }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="blue"
            onError={(errorMessage) => console.error("MapViewDirections error:", errorMessage)}
          />
        );
      }
    } else if (rideData.pickupLatLng && rideData.dropLatLng) {
      return (
        <MapViewDirections
          origin={{
            latitude: rideData.pickupLatLng.lat,
            longitude: rideData.pickupLatLng.lng,
          }}
          destination={{
            latitude: rideData.dropLatLng.lat,
            longitude: rideData.dropLatLng.lng,
          }}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={3}
          strokeColor="blue"
          onError={(errorMessage) => console.error("MapViewDirections error:", errorMessage)}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <Text style={styles.heading}>
          {isReturnJourney
            ? "Return Journey in Progress"
            : (isRoundTrip && rideStarted)
              ? "Onward Journey in Progress"
              : (rideStarted ? "En Route to Destination" : "Ride Confirmed")}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Icon name="refresh" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {driverLoc && (
          <Marker coordinate={driverLoc} title="Driver" anchor={{ x: 0.5, y: 0.5 }}>
            <Animated.View
              style={{
                transform: [

                  { rotate: `${driverRotation}deg` } // Apply rotation
                ],
              }}
            >
              <View style={styles.driverMarkerContainer}>
                <Image
                  source={
                    rideData.vehicleType?.toLowerCase() === "bike"
                      ? require("../../assets/images/bike.png")
                      : rideData.vehicleType?.toLowerCase() === "auto"
                        ? require("../../assets/images/auto_marker.png")
                        : require("../../assets/images/car.png")
                  }
                  style={{ width: 32, height: 32, resizeMode: "contain" }}
                />
                {/* Debug View - Remove later */}
                {/* <View style={{ position: 'absolute', bottom: -20, backgroundColor: 'white', padding: 2 }}>
                  <Text style={{ fontSize: 10 }}>{rideData.vehicleType}</Text>
                </View> */}
              </View>
            </Animated.View>
          </Marker>
        )}
        {!rideStarted && pickup && (
          <Marker coordinate={pickup} title="Pickup Point">
            <View style={styles.pickupMarker}>
              <View style={styles.markerPin} />
            </View>
          </Marker>
        )}
        {rideStarted && rideData.dropAddress && (
          <Marker coordinate={drop} title="Drop Point">
            <View style={styles.dropMarker}>
              <View style={styles.markerPin} />
            </View>
          </Marker>
        )}
        {driverLoc && (
          <MapViewDirections
            origin={driverLoc}
            destination={isReturnJourney ? pickup : (rideStarted ? drop : pickup)}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor={rideStarted ? ACCENT_COLOR : PRIMARY_COLOR}
          />
        )}
        {/* Render pickup and drop markers */}
        {rideData.pickupLatLng && (
          <Marker
            coordinate={{
              latitude: rideData.pickupLatLng.lat,
              longitude: rideData.pickupLatLng.lng,
            }}
            title="Pickup Location"
          />
        )}
        {rideData.dropLatLng && (
          <Marker
            coordinate={{
              latitude: rideData.dropLatLng.lat,
              longitude: rideData.dropLatLng.lng,
            }}
            title="Drop Location"
          />
        )}

        {/* Render route */}
        {renderRoute()}
      </MapView>

      {/* Bottom Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.timeText}>
            {isReturnJourney
              ? "Driver is returning to pickup location"
              : (rideStarted ? "Arriving in 5 mins" : "Captain is arriving")}
          </Text>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.rideStatus}>
              <Text style={styles.rideStatusText}>
                {rideStarted ? "ON THE WAY" : "CONFIRMED"}
              </Text>
            </View>
            {isReturnJourney && (
              <Text style={{ fontSize: 10, color: PRIMARY_COLOR, fontWeight: "700", marginTop: 4 }}>
                Phase 2 of 2: Returning
              </Text>
            )}
          </View>
        </View>


        <View style={styles.driverInfo}>
          <View style={[styles.avatar, { overflow: 'hidden' }]}>
            {(rideData.vehicleDetails?.dpUrl || rideData.vehicleDetails?.dp_url) ? (
              <Image
                source={{ uri: `${DP_BASE_URL}${rideData.vehicleDetails.dpUrl || rideData.vehicleDetails.dp_url}` }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Icon name="person" size={30} color={ACCENT_COLOR} />
            )}
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{rideData.vehicleDetails?.driverName || "Driver"}</Text>
            <Text style={styles.vehicleNumber}>
              {(rideData.vehicleDetails?.vehicleModel || rideData.vehicleDetails?.vehicle_model) ? `${rideData.vehicleDetails.vehicleModel || rideData.vehicleDetails.vehicle_model} • ` : ''}
              {rideData.vehicleDetails?.vehicleNumber || ""}
            </Text>
            <Text style={styles.rating}>4.9 ★</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, styles.callButton]}
              onPress={handleCall}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Icon name="call" size={20} color={CARD_BG} />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.messageButton]}
              onPress={handleMessage}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Icon name="message" size={20} color={CARD_BG} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.verticalLine} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{rideData.pickupAddress}</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <View style={[styles.dot, styles.dropDot]} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>DROP</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{rideData.dropAddress}</Text>
            </View>
          </View>
        </View>

        {remainingMinutes !== null && (
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>
              Package Time Left: {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
            </Text>

            {remainingMinutes <= 0 && (
              <Text style={styles.timerWarning}>
                Package time exceeded. Extra waiting charges may apply.
              </Text>
            )}
          </View>
        )}

        {!rideStarted && (
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Share this OTP with driver</Text>
            <Text style={styles.otp}>{rideData.expectedOTP}</Text>
          </View>
        )}

        {!rideStarted && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCancelModalVisible(true)}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Ride?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to cancel this ride? A cancellation fee may apply.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setCancelModalVisible(false)}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
              >
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <Text style={styles.modalButtonCancelText}>No, Continue Ride</Text>
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCancelRide}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
              >
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Chat Modal (bottom sheet style, map stays visible behind dim) */}
      {/* Message Chat Modal (bottom sheet style, map stays visible behind dim) */}
      {/* Chat Popup Modal */}
      <Modal
        visible={messageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.messageModalOverlay}>

          {/* BACKDROP — tap to close */}
          <TouchableOpacity
            style={styles.messageBackdrop}
            activeOpacity={1}
            onPress={() => setMessageModalVisible(false)}
          />

          {/* POPUP CONTENT */}
          <View style={styles.messageModalContent}>

            {/* CLOSE BUTTON (X) */}
            <TouchableOpacity
              style={styles.chatCloseBtn}
              onPress={() => setMessageModalVisible(false)}
            >
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>

            {/* CHAT UI */}
            <MessageScreen
              rideId={rideData.rideId}
              selfId={rideData.riderId}
              receiverId={rideData.driverId}
              selfRole="rider"
              inPopup={true}
              onClose={() => setMessageModalVisible(false)}
            />

          </View>
        </View>
      </Modal>


    </View>
  );
};

export default RiderRideTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    borderRadius: 32,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG_COLOR,
  },
  loadingText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: CARD_BG,
  },
  driverMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CARD_BG,
  },
  driverMarkerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    borderWidth: 3,
    borderColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  dropMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT_COLOR,
    borderWidth: 3,
    borderColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  messageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  messageBackdrop: {
    flex: 1,
  },

  messageModalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "82%",
    paddingTop: 35,       // space for close button
    overflow: "hidden",
  },

  chatCloseBtn: {
    position: "absolute",
    top: 10,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },

  markerPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CARD_BG,
  },
  card: {
    backgroundColor: CARD_BG,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  rideStatus: {
    backgroundColor: INACTIVE_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rideStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: INACTIVE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  vehicleNumber: {
    fontSize: 14,
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  callButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  messageButton: {
    backgroundColor: ACCENT_COLOR,
  },
  divider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginVertical: 16,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  locationIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupDot: {
    backgroundColor: PRIMARY_COLOR,
  },
  dropDot: {
    backgroundColor: ACCENT_COLOR,
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: INACTIVE_COLOR,
    marginVertical: 2,
    marginLeft: 5,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: PRIMARY_COLOR,
  },
  otpContainer: {
    backgroundColor: "#dbd8d8ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  otpLabel: {
    fontSize: 14,
    color: "black",
    marginBottom: 8,
  },
  otp: {
    fontSize: 32,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  cancelButton: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: ACCENT_COLOR,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  modalButtonCancel: {
    backgroundColor: INACTIVE_COLOR,
  },
  modalButtonConfirm: {
    backgroundColor: PRIMARY_COLOR,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: CARD_BG,
  },

  /* Message Modal Styles */
  messageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  messageBackdrop: {
    flex: 1,
  },

  chatCloseBtn: {
    position: "absolute",
    top: 10,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  messageModalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingTop: 10,
  },
  grabber: {
    width: 40,
    height: 5,
    backgroundColor: INACTIVE_COLOR,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  messageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  messageModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  messageBubbleContainer: {
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  selfBubbleContainer: {
    alignItems: "flex-end",
  },
  otherBubbleContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  selfBubble: {
    backgroundColor: PRIMARY_COLOR,
  },
  otherBubble: {
    backgroundColor: INACTIVE_COLOR,
  },
  messageText: {
    fontSize: 15,
  },
  messageInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
    alignItems: "center",
  },
  messageInput: {
    flex: 1,
    backgroundColor: BG_COLOR,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  sendButton: {
    padding: 8,
  },
  timerBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  timerWarning: {
    fontSize: 12,
    color: "#d9534f",
    marginTop: 4,
  },
});