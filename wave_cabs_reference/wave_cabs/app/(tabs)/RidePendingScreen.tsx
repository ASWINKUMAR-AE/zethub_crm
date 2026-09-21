import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Modal,
  Image as RNImage,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from "../context/AuthContext";
import { rideAPI, userAPI } from '../services/api';
import { socket } from '../services/socket';

// Theme
const PRIMARY_COLOR = "#222";
const BG_COLOR = "#ffffffff";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "#E5E7EB";
const ACCENT_COLOR = "#6B7280";
const INACTIVE_COLOR = "#D1D5DB";

// Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const RidePendingScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { requestId: initialRequestId } = params || {};
  const { user } = useContext(AuthContext) as any;
  const userId = user?.id;

  const [requestId, setRequestId] = useState(initialRequestId || undefined);
  const [rideDetails, setRideDetails] = useState<any>(undefined);
  const [liveRide, setLiveRide] = useState<any>(null); // ❤️ NEW: real-time ride data
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const orbitDotScale = useRef(new Animated.Value(1)).current;



  // State refs for access inside stable listeners
  const requestIdRef = useRef(requestId);
  const userIdRef = useRef(userId);

  useEffect(() => {
    requestIdRef.current = requestId;
  }, [requestId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Sync requestId from params if available
  useEffect(() => {
    if (initialRequestId && !requestId) {
      console.log("Updating requestId from params:", initialRequestId);
      setRequestId(initialRequestId);
    }
  }, [initialRequestId]);

  /** 🚀 Core Logic to Transition to Ride Tracker */
  const navigateToTracker = (rideId: any, details: any = {}) => {
    console.log("🚀 Navigating to Tracker for Ride:", rideId);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: 'RiderRideTracker',
          params: {
            rideId: rideId,
            // Spread details but provide defaults
            pickupLatLng: details.pickupLatLng ?? {},
            pickupAddress: details.pickupAddress ?? '',
            dropLatLng: details.dropoffLatLng ?? {},
            dropAddress: details.dropoffAddress ?? '',
            expectedOTP: details.otp ?? '0000',
            driverId: details.driverId,
            riderId: userIdRef.current,
            vehicleDetails: details.vehicleDetails ?? {},
            requestId: requestIdRef.current,
          },
        }],
      })
    );
  };

  /** 🔍 Check Status (Polling + Resume + Mount) */
  const checkStatus = async () => {
    try {
      const currentReqId = requestIdRef.current;
      console.log("Checking Status for Req:", currentReqId);

      const statusRes = await userAPI.getStatus();
      console.log("Rider status check:", statusRes);

      // 1. Ride Started/Accepted
      if (statusRes.status === "inRide" && statusRes.rideId) {
        // We need ride details to pass to params, let's fetch them quickly only if needed
        // OR just navigate and let Tracker fetch them (Tracker has robust init logic now!)
        // Let's trust Tracker's Init logic to fetch if params are missing, 
        // but passing at least rideId is crucial.
        navigateToTracker(statusRes.rideId, {});
        return;
      }

      // 2. Booking Cancelled/Other
      if (statusRes.status === "notInRide") {
        // Only redirect if we thought we were searching
        // But be careful of race conditions on very first render
        console.log("Status is notInRide - Redirecting Home");
        router.replace("/(tabs)");
        return;
      }

      // 3. Still Searching - Update ID if changed
      if (statusRes.status === "searchingRide") {
        if (statusRes.requestId && currentReqId && statusRes.requestId !== currentReqId) {
          console.log("Request ID mismatch, updating:", statusRes.requestId);
          setRequestId(statusRes.requestId);
        }
      }
    } catch (err) {
      console.warn("Status check error:", err);
    }
  };

  /** 🔄 Polling & App State Listener */
  useEffect(() => {
    // Run Immediately
    checkStatus();

    // Poll every 5s
    const interval = setInterval(checkStatus, 5000);

    // Listen for App Resume
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        console.log("App Resumed - Checking Status");
        checkStatus();
        // Re-emit socket join just in case
        if (userIdRef.current) {
          if (!socket.connected) socket.connect();
          socket.emit("joinRiderRoom", { userId: userIdRef.current });
        }
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  /** 🔌 Socket Listener (Event Based Instant Update) */
  useEffect(() => {
    if (!userId) return;

    const joinRoom = () => {
      console.log("Socket: Joining Rider Room", userId);
      socket.emit("joinRiderRoom", { userId });
    };

    if (!socket.connected) socket.connect();
    joinRoom();

    const handleRideAccepted = async (data: any) => {
      console.log("Socket: Ride accepted event:", data);
      if (!data?.rideId) return;

      // Navigate immediately with the data we have
      navigateToTracker(data.rideId, data);
    };

    socket.on("connect", joinRoom);
    socket.off("rideAccepted"); // Clean previous if any (unlikely in useEffect but good practice)
    socket.on("rideAccepted", handleRideAccepted);

    return () => {
      socket.off("rideAccepted", handleRideAccepted);
      socket.off("connect", joinRoom);
    };
  }, [userId]); // Only updates if userId changes

  // Fetch initial booking details via requestId (Visuals only)
  useEffect(() => {
    const fetchRide = async () => {
      if (!requestId) return;

      try {
        console.log("Fetching visual booking details for:", requestId);
        const details = await rideAPI.getBookingDetails(requestId);

        if (details) {
          setRideDetails(details);
        }
      } catch (err) {
        console.warn("Booking visual fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRide();
  }, [requestId]);

  // UI ANIMATIONS
  useEffect(() => {
    Animated.loop(
      Animated.spring(pulseAnim, {
        toValue: 1.2,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim1, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim2, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          delay: 1250,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbitDotScale, {
          toValue: 1.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbitDotScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // NEW MERGED PAYMENT METHOD
  const payMethod = (
    liveRide?.paymentMethod ||
    rideDetails?.data?.paymentMethod
  )?.toLowerCase();

  const finalFare = liveRide?.fare || rideDetails?.data?.fare || 0;

  if (isLoading)
    return (
      <View style={styles.container}>
        <ThemedText style={styles.loadingText}>
          Loading ride details...
        </ThemedText>
      </View>
    );

  return (
    <View style={styles.container}>
      <RNImage
        source={require("../../assets/images/08.jpg")}
        style={styles.bottomBg}
        resizeMode="cover"
      />

      {/******** LOADING ANIMATION ********/}
      <View style={styles.loaderContainer}>
        <Animated.View style={[
          styles.ripple,
          { transform: [{ scale: rippleAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }] },
          { opacity: rippleAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }
        ]} />
        <Animated.View style={[
          styles.ripple,
          { transform: [{ scale: rippleAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }] },
          { opacity: rippleAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }
        ]} />
        <Animated.View style={[
          styles.loaderCircle,
          { transform: [{ scale: pulseAnim }] }
        ]} />
        <ThemedText style={styles.loaderText}>Finding Your Driver</ThemedText>
      </View>

      {/******** RIDE DETAILS ********/}
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.rideType}>
            {rideDetails?.data?.rideType} Ride
          </ThemedText>
          <ThemedText style={styles.rideStatus}>
            Matching you with a driver...
          </ThemedText>
        </View>

        {/******** PICKUP & DROP ********/}
        <View style={styles.routeCard}>
          <View style={styles.routeStop}>
            <View style={[styles.stopIcon, styles.pickupIcon]} />
            <ThemedText style={styles.locationText}>
              {rideDetails?.data?.fromLocation}
            </ThemedText>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeStop}>
            <View style={[styles.stopIcon, styles.dropoffIcon]} />
            <ThemedText style={styles.locationText}>
              {rideDetails?.data?.toLocation}
            </ThemedText>
          </View>
        </View>

        {/******** FARE + PAYMENT METHOD ********/}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Icon name="attach-money" size={20} color={PRIMARY_COLOR} />
            <ThemedText style={styles.detailLabel}>
              Estimated Fare
            </ThemedText>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText style={styles.detailValue}>
                ₹{finalFare}
              </ThemedText>
              {(params.discountAmount && Number(params.discountAmount) > 0) && (
                <ThemedText style={styles.discountText}>
                  (₹{params.discountAmount} off{params.couponCode ? ` with ${params.couponCode}` : ''})
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Icon
              name={payMethod === "cash" ? "money" : "credit-card"}
              size={20}
              color={PRIMARY_COLOR}
            />
            <ThemedText style={styles.detailLabel}>
              Payment Method
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {liveRide?.paymentMethod || rideDetails?.data?.paymentMethod}
            </ThemedText>
          </View>
        </View>

        {/******** CANCEL BUTTON ********/}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setCancelModalVisible(true)}
          >
            <Icon name="close" size={20} color={CARD_BG} />
            <ThemedText style={styles.primaryButtonText}>
              Cancel Ride
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/******** CANCEL MODAL ********/}
      <Modal
        transparent
        visible={isCancelModalVisible}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Icon name="warning" size={32} color={PRIMARY_COLOR} />
            </View>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Cancel Ride?
            </ThemedText>
            <ThemedText style={styles.modalText}>
              Are you sure you want to cancel this ride request?
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <ThemedText style={styles.modalCancelText}>
                  No, Continue
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={async () => {
                  setCancelModalVisible(false);
                  try {
                    const res = await rideAPI.cancelRide(requestId);
                    if (res.success) {
                      router.replace("/(tabs)");
                    } else {
                      Alert.alert("Failed", res.message);
                    }
                  } catch {
                    Alert.alert("Error", "Something went wrong.");
                  }
                }}
              >
                <ThemedText style={styles.modalConfirmText}>
                  Yes, Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default RidePendingScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  bottomBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 190,
  },
  loaderContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  loaderCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    position: "absolute",
  },
  ripple: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: INACTIVE_COLOR,
    position: "absolute",
  },
  loaderText: {
    marginTop: 100,
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  rideType: {
    fontSize: 20,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  rideStatus: {
    fontSize: 14,
    color: ACCENT_COLOR,
  },
  routeCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 16,
  },
  routeStop: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pickupIcon: { backgroundColor: PRIMARY_COLOR },
  dropoffIcon: { backgroundColor: ACCENT_COLOR },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: INACTIVE_COLOR,
    marginLeft: 5,
  },
  locationText: { fontSize: 14, color: PRIMARY_COLOR, flex: 1 },
  detailsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 16,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  detailLabel: { marginLeft: 10, marginRight: "auto", color: ACCENT_COLOR },
  detailValue: { color: PRIMARY_COLOR, fontWeight: "600" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: "60%",
    justifyContent: "center",
  },
  primaryButtonText: { color: CARD_BG, marginLeft: 8, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: CARD_BG,
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: INACTIVE_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  modalText: { color: ACCENT_COLOR, textAlign: "center", marginBottom: 20 },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: INACTIVE_COLOR,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  modalCancelText: { textAlign: "center", fontWeight: "600", color: PRIMARY_COLOR },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  modalConfirmText: { textAlign: "center", color: CARD_BG, fontWeight: "600" },
  loadingText: { textAlign: "center", marginTop: 20, color: PRIMARY_COLOR },
  discountText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
  },
});
