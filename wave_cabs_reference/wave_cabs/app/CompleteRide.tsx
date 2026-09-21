// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Animated,
//   Dimensions,
//   Linking,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from "react-native";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { useAuth } from "./context/AuthContext";
// import { paymentAPI, rideAPI } from "./services/api";
// import { socket } from "./services/socket";

// const { width } = Dimensions.get("window");

// export default function CompleteRide() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const requestId = params.requestId || params.request_id;
//   const { user } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [booking, setBooking] = useState<any>(null);
//   const [ride, setRide] = useState<any>(null);
//   const [fare, setFare] = useState(0);
//   const [paymentMethod, setPaymentMethod] = useState("");
//   const [rideCompleted, setRideCompleted] = useState(false);

//   const autoUPITriggered = useRef(false);

//   // Animations
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const slideAnim = useRef(new Animated.Value(20)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         tension: 30,
//         friction: 8,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 500,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   // 1️⃣ Fetch booking details
//   const fetchBooking = async () => {
//     try {
//       const res = await rideAPI.getBookingDetails(requestId);
//       const data = res?.data;
//       if (!data) return;

//       setBooking(data);
//       setFare(Number(data.fare || data.offeredFare || 0));
//       setPaymentMethod((data.paymentMethod || "").toLowerCase());

//       return data.rideId;
//     } catch (err) {
//       console.log("❌ Booking fetch failed", err);
//     }
//   };

//   // 2️⃣ Fetch ride details
//   const fetchRideDetails = async (rideId) => {
//     if (!rideId) return;

//     try {
//       const res = await rideAPI.getRideDetails(rideId);
//       const data = res?.data;

//       setRide(data);
//       if (data.fare) setFare(Number(data.fare));
//       if (data.paymentMethod)
//         setPaymentMethod(data.paymentMethod.toLowerCase());
//     } catch (err) {
//       console.log("❌ Ride fetch failed", err);
//     }
//   };

//   // 3️⃣ Auto-load data
//   useEffect(() => {
//     const loadData = async () => {
//       const rideId = await fetchBooking();
//       if (rideId) await fetchRideDetails(rideId);
//       setLoading(false);
//     };

//     loadData();
//   }, [requestId]);

//   // 4️⃣ UPI/CASH logic
//   const isUPI =
//     paymentMethod.includes("upi") ||
//     paymentMethod.includes("phonepe") ||
//     paymentMethod.includes("gpay") ||
//     paymentMethod.includes("online");

//   const isCash = paymentMethod === "cash";

//   // 5️⃣ Auto PhonePe launch
//   const handleUPIPayment = async () => {
//     try {
//       const payload = {
//         amount: fare,
//         request_id: requestId,
//         rider_id: user?.id,
//       };

//       const res = await paymentAPI.processPayment(payload);

//       if (res?.redirectUrl) {
//         Linking.openURL(res.redirectUrl);
//       } else {
//         alert("Failed to open PhonePe.");
//       }
//     } catch (err) {
//       alert("Payment failed.");
//     }
//   };

//   useEffect(() => {
//     if (!loading && isUPI && !autoUPITriggered.current) {
//       autoUPITriggered.current = true;
//       handleUPIPayment();
//     }
//   }, [loading, isUPI]);

//   // 6️⃣ Socket listeners
//   useEffect(() => {
//     socket.emit("joinRiderRoom", { userId: user?.id });

//     socket.on("onlinePaymentConfirmed", (data) => {
//       if (String(data.request_id) === String(requestId)) {
//         setRideCompleted(true);
//       }
//     });

//     socket.on("fareCollectedByDriver", (data) => {
//       if (String(data.request_id) === String(requestId)) {
//         setRideCompleted(true);
//       }
//     });

//     return () => {
//       socket.removeAllListeners();
//     };
//   }, []);

//   // Payment method display icon
//   const getPaymentIcon = () => {
//     if (isUPI) return "account-balance-wallet";
//     if (isCash) return "payments";
//     return "credit-card";
//   };

//   if (loading)
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#000000" />
//         <Text style={styles.loadingText}>Loading invoice...</Text>
//       </View>
//     );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

//       <Animated.View
//         style={[
//           styles.content,
//           {
//             opacity: fadeAnim,
//             transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
//           }
//         ]}
//       >
//         {/* INVOICE HEADER */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>RIDE INVOICE</Text>
//           <Text style={styles.headerDate}>{new Date().toDateString()}</Text>
//         </View>

//         {/* PAPER INVOICE CARD */}
//         <View style={styles.invoiceCard}>

//           {/* Status Badge */}
//           <View style={[styles.statusBadge, rideCompleted ? styles.statusPaid : styles.statusPending]}>
//             <Text style={[styles.statusText, rideCompleted ? styles.textPaid : styles.textPending]}>
//               {rideCompleted ? "PAID" : "PAYMENT DUE"}
//             </Text>
//           </View>

//           {/* Amount Section */}
//           <View style={styles.amountSection}>
//             <Text style={styles.amountLabel}>Total Amount</Text>
//             <Text style={styles.amountValue}>₹{fare.toFixed(2)}</Text>
//           </View>

//           <View style={styles.dashedLine} />

//           {/* Ride Details (Pickup/Drop) */}
//           <View style={styles.locationsContainer}>
//             {booking && (
//               <>
//                 <View style={styles.locationItem}>
//                   <View style={[styles.dot, styles.pickupDot]} />
//                   <View>
//                     <Text style={styles.locLabel}>Pickup</Text>
//                     <Text style={styles.locText} numberOfLines={1}>{booking.pickupAddress || booking.fromLocation || "Pickup Location"}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.timelineLine} />

//                 <View style={styles.locationItem}>
//                   <View style={[styles.dot, styles.dropDot]} />
//                   <View>
//                     <Text style={styles.locLabel}>Drop-off</Text>
//                     <Text style={styles.locText} numberOfLines={1}>{booking.dropoffAddress || booking.toLocation || "Drop Location"}</Text>
//                   </View>
//                 </View>
//               </>
//             )}
//           </View>

//           <View style={styles.dashedLine} />

//           {/* Payment Details */}
//           <View style={styles.detailsRow}>
//             <Text style={styles.detailLabel}>Payment Method</Text>
//             <View style={styles.methodContainer}>
//               <Icon name={getPaymentIcon()} size={16} color="#333" />
//               <Text style={styles.detailValue}>{paymentMethod.toUpperCase()}</Text>
//             </View>
//           </View>

//           <View style={styles.detailsRow}>
//             <Text style={styles.detailLabel}>Ride ID</Text>
//             <Text style={styles.detailValueMono}>{booking?.rideId ? booking.rideId.slice(0, 8) : "N/A"}</Text>
//           </View>

//           {/* Footer Message */}
//           <View style={styles.footerMessage}>
//             <Icon name="verified-user" size={14} color="#666" />
//             <Text style={styles.footerText}>
//               {rideCompleted ? "Thank you for riding with us." : "Secure Payment Gateway"}
//             </Text>
//           </View>

//         </View>

//         {/* ACTION BUTTONS */}
//         <View style={styles.actionsContainer}>

//           {/* UPI Pay Button */}
//           {!rideCompleted && isUPI && (
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={handleUPIPayment}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.primaryButtonText}>Pay Now</Text>
//               <Icon name="arrow-forward" size={20} color="#fff" />
//             </TouchableOpacity>
//           )}

//           {/* Cash Instruction */}
//           {!rideCompleted && isCash && (
//             <View style={styles.cashNotice}>
//               <Text style={styles.cashNoticeText}>Please pay ₹{fare} cash to the driver.</Text>
//             </View>
//           )}

//           {/* Success / Home Button */}
//           {rideCompleted && (
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() => router.replace("/(tabs)")}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.primaryButtonText}>Back to Home</Text>
//             </TouchableOpacity>
//           )}

//         </View>

//       </Animated.View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#fff",
//   },
//   loadingText: {
//     marginTop: 10,
//     color: "#666",
//     fontSize: 14,
//   },
//   content: {
//     flex: 1,
//     padding: 24,
//     justifyContent: "center",
//   },

//   // Header
//   header: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   headerTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     letterSpacing: 2,
//     color: "#333",
//     textTransform: "uppercase",
//   },
//   headerDate: {
//     fontSize: 12,
//     color: "#888",
//     marginTop: 4,
//   },

//   // Invoice Card
//   invoiceCard: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 24,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.1,
//     shadowRadius: 20,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: "#E5E5E5",
//   },

//   // Status Badge
//   statusBadge: {
//     alignSelf: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     marginBottom: 20,
//     borderWidth: 1,
//   },
//   statusPending: {
//     backgroundColor: "#FFF4F4",
//     borderColor: "#FFE0E0",
//   },
//   statusPaid: {
//     backgroundColor: "#F0FFF4",
//     borderColor: "#D0F5D6",
//   },
//   statusText: {
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: 0.5,
//   },
//   textPending: { color: "#D32F2F" },
//   textPaid: { color: "#2E7D32" },

//   // Amount
//   amountSection: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   amountLabel: {
//     fontSize: 13,
//     color: "#888",
//     marginBottom: 4,
//   },
//   amountValue: {
//     fontSize: 36,
//     fontWeight: "800",
//     color: "#000",
//   },

//   // Divider
//   dashedLine: {
//     height: 1,
//     borderWidth: 1,
//     borderColor: "#E5E5E5",
//     borderStyle: "dashed",
//     borderRadius: 1,
//     marginVertical: 20,
//   },

//   // Locations
//   locationsContainer: {
//     paddingHorizontal: 8,
//   },
//   locationItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   timelineLine: {
//     height: 24,
//     width: 1,
//     backgroundColor: "#E0E0E0",
//     marginLeft: 5, // Center with dot (10px width / 2)
//   },
//   dot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 12,
//     backgroundColor: "#000",
//   },
//   pickupDot: {
//     backgroundColor: "#000",
//   },
//   dropDot: {
//     backgroundColor: "#666",
//   },
//   locLabel: {
//     fontSize: 10,
//     color: "#888",
//     fontWeight: "600",
//     textTransform: "uppercase",
//   },
//   locText: {
//     fontSize: 14,
//     color: "#333",
//     fontWeight: "500",
//   },

//   // Details
//   detailsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: "#666",
//   },
//   methodContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   detailValue: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#000",
//   },
//   detailValueMono: {
//     fontSize: 13,
//     fontFamily: "monospace",
//     color: "#333",
//     backgroundColor: "#F5F5F5",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },

//   // Footer Message
//   footerMessage: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 10,
//     gap: 6,
//   },
//   footerText: {
//     fontSize: 12,
//     color: "#888",
//   },

//   // Actions
//   actionsContainer: {
//     marginTop: 32,
//     paddingHorizontal: 20,
//   },
//   primaryButton: {
//     backgroundColor: "#000",
//     borderRadius: 14,
//     paddingVertical: 18,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//     elevation: 8,
//   },
//   primaryButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   cashNotice: {
//     backgroundColor: "#F5F5F5",
//     padding: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//   },
//   cashNoticeText: {
//     color: "#333",
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });


import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Dimensions,
  Linking,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "./context/AuthContext";
import { paymentAPI, rideAPI } from "./services/api";
import { socket } from "./services/socket";

const { width } = Dimensions.get("window");

export default function CompleteRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = params.requestId || params.request_id;

  // Voucher Logic
  const { fare_before_discount, coupon_code } = params;

  // Safely parse default_dis_com if it comes as a string
  let paramDefaultDisCom = null;
  try {
    if (params.default_dis_com && typeof params.default_dis_com === 'string') {
      paramDefaultDisCom = JSON.parse(params.default_dis_com);
    } else {
      paramDefaultDisCom = params.default_dis_com;
    }
  } catch (e) {
    console.log('Error parsing default_dis_com', e);
  }

  const paramFareBefore = fare_before_discount != null && fare_before_discount !== "null" ? Number(fare_before_discount) : null;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [ride, setRide] = useState<any>(null);
  const [fare, setFare] = useState(0);
  const [fareBeforeDiscount, setFareBeforeDiscount] = useState<number | null>(paramFareBefore);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [rideCompleted, setRideCompleted] = useState(false);
  const [defaultDisCom, setDefaultDisCom] = useState(paramDefaultDisCom);

  const hasVoucher = (fareBeforeDiscount !== null || coupon_code != null) || (defaultDisCom && defaultDisCom.discount > 0);

  const autoUPITriggered = useRef(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Ref for polling interval (Must be declared at top level)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    // Parse and set default discount from params if available
    if (params?.default_dis_com) {
      try {
        const parsed = typeof params.default_dis_com === 'string' ? JSON.parse(params.default_dis_com) : params.default_dis_com;
        if (parsed) setDefaultDisCom(parsed);
      } catch (e) { }
    }
  }, []);

  // 1️⃣ Fetch booking details
  const fetchBooking = async () => {
    try {
      const res = await rideAPI.getBookingDetails(requestId);
      const data = res?.data;
      if (!data) return;

      setBooking(data);
      setFare(Number(data.fare || data.offeredFare || 0));
      if (data.fare_before_discount || data.original_fare) {
        setFareBeforeDiscount(Number(data.fare_before_discount || data.original_fare));
      }
      setPaymentMethod((data.paymentMethod || "").toLowerCase());

      // Set default discount if present in booking data
      if (data.default_dis_com) {
        setDefaultDisCom(data.default_dis_com);
      }

      return data.rideId;
    } catch (err) {
      console.log("❌ Booking fetch failed", err);
    }
  };

  // 2️⃣ Fetch ride details
  const fetchRideDetails = async (rideId) => {
    if (!rideId) return;

    try {
      const res = await rideAPI.getRideDetails(rideId);
      // Log response to debug structure
      console.log('Fetch Ride Response:', JSON.stringify(res).slice(0, 100));
      const data = res?.data || res; // Fallback if res is the data itself

      if (data) {
        setRide(data);
        if (data.fare) setFare(Number(data.fare));
        if (data.fare_before_discount || data.original_fare) {
          setFareBeforeDiscount(Number(data.fare_before_discount || data.original_fare));
        }
        if (data.payment_method || data.paymentMethod)
          setPaymentMethod((data.payment_method || data.paymentMethod).toLowerCase());

        // Explicitly set default discount object
        if (data.default_dis_com) {
          setDefaultDisCom(data.default_dis_com);
        }
      }
    } catch (err) {
      console.log("❌ Ride fetch failed", err);
    }
  };

  // 3️⃣ Auto-load data
  useEffect(() => {
    const loadData = async () => {
      const fetchedRideId = await fetchBooking();
      const targetRideId = params.rideId || fetchedRideId;
      if (targetRideId) await fetchRideDetails(targetRideId);
      setLoading(false);
    };

    loadData();
  }, [requestId]);

  // 4️⃣ UPI/CASH logic
  const isUPI =
    paymentMethod.includes("upi") ||
    paymentMethod.includes("phonepe") ||
    paymentMethod.includes("gpay") ||
    paymentMethod.includes("online");

  const isCash = paymentMethod === "cash";

  // 5️⃣ Auto PhonePe launch
  const handleUPIPayment = async () => {
    try {
      const payload = {
        amount: fare,
        request_id: requestId,
        rider_id: user?.id,
      };

      const res = await paymentAPI.processPayment(payload);

      if (res?.redirectUrl) {
        Linking.openURL(res.redirectUrl);
      } else {
        alert("Failed to open PhonePe.");
      }
    } catch (err) {
      alert("Payment failed.");
    }
  };

  useEffect(() => {
    if (!loading && isUPI && !autoUPITriggered.current) {
      autoUPITriggered.current = true;
      handleUPIPayment();
    }
  }, [loading, isUPI]);

  // 6️⃣ Socket & Polling & Resume Logic
  useEffect(() => {
    if (!requestId) return;

    let isMounted = true;
    // Clearing any previous interval if exists (cleanup safety)
    if (intervalRef.current) clearInterval(intervalRef.current);

    // ✅ Centralized Payment Verification
    const verifyPaymentStatus = async () => {
      try {
        const targetRideId = booking?.rideId || ride?.rideId || params.rideId;

        if (!targetRideId) {
          // Only log if data has finished loading and we still don't have an ID
          if (!loading) {
            console.log("❌ No ride ID found to verify payment status (Load complete)");
          }
          return;
        }

        // We can use getRideDetails to check status 'completed' -> 'paid' usually implies completed or specific payment status
        const res = await rideAPI.getRideDetails(targetRideId); // or use requestId to search
        // Note: API might vary slightly, but assuming getRideDetails returns status
        // If the ride status is 'completed' and 'payment_status' is 'paid' (backend specific)

        // Alternative: If your API has a specific check-payment endpoint, use that.
        // For now, consistent with other screens, we check ride details.

        const r = res?.data || res;
        console.log("Payment Status Check:", r);

        if (r) {
          // Adjust logic based on exact backend fields for "PAID"
          // Example: status === 'completed' might mean paid in some systems, 
          // or payment_status === 'paid'.
          // Let's assume if it is "completed" it is done.

          if (r.status === "completed" || r.payment_status === "paid" || r.is_paid === 1 || r.is_paid === true) {
            if (isMounted) setRideCompleted(true);
          }

          // Always update ride data to ensure we have latest breakdown/waiting charges
          if (isMounted) {
            setRide(r);
            // Also update fare details if they changed (e.g. waiting charge increased)
            if (r.fare) setFare(Number(r.fare));
            if (r.fare_before_discount) setFareBeforeDiscount(Number(r.fare_before_discount));
            if (r.default_dis_com) setDefaultDisCom(r.default_dis_com);
          }
        }
      } catch (e) {
        // console.warn("Payment check failed", e);
      }
    };

    // 🔌 Socket Handlers
    const handlePaymentConfirmed = (data: any) => {
      console.log("Socket: Payment Confirmed", data);
      if (
        String(data.request_id) === String(requestId) ||
        String(data.rideId) === String(booking?.rideId)
      ) {
        if (isMounted) setRideCompleted(true);
      }
    };

    // 🚀 Setup
    const setup = () => {
      if (user?.id) {
        socket.emit("joinRiderRoom", { userId: user.id });
      }

      socket.on("onlinePaymentConfirmed", handlePaymentConfirmed);
      socket.on("fareCollectedByDriver", handlePaymentConfirmed);
    };

    setup();

    // 🔄 Poll every 4 seconds (Fallback)
    intervalRef.current = setInterval(verifyPaymentStatus, 4000);

    // 📱 App Resume Check (Critical for UPI)
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        console.log("App Resumed - Verifying Payment Status...");
        verifyPaymentStatus();
        // Re-connect socket if needed
        if (!socket.connected) socket.connect();
        if (user?.id) socket.emit("joinRiderRoom", { userId: user.id });
      }
    });

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();

      socket.off("onlinePaymentConfirmed", handlePaymentConfirmed);
      socket.off("fareCollectedByDriver", handlePaymentConfirmed);
    };
  }, [requestId, user?.id, booking?.rideId, loading]);

  // Payment method display icon
  const getPaymentIcon = () => {
    if (isUPI) return "account-balance-wallet";
    if (isCash) return "payments";
    return "credit-card";
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
          }
        ]}
      >
        {/* INVOICE HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RIDE INVOICE</Text>
          <Text style={styles.headerDate}>{new Date().toDateString()}</Text>
        </View>

        {/* PAPER INVOICE CARD */}
        <View style={styles.invoiceCard}>

          {/* Status Badge */}
          <View style={[styles.statusBadge, rideCompleted ? styles.statusPaid : styles.statusPending]}>
            <Text style={[styles.statusText, rideCompleted ? styles.textPaid : styles.textPending]}>
              {rideCompleted ? "PAID" : "PAYMENT DUE"}
            </Text>
          </View>

          {/* Fare Breakdown */}
          <View style={styles.breakdownContainer}>
            {(() => {
              // Unified Data Access (Params vs Booking Data vs Ride Data for Re-opening)
              const resolveNum = (...vals: any[]) => {
                for (const v of vals) {
                  if (v !== undefined && v !== null && v !== "") return Number(v);
                }
                return 0;
              };

              const waitingFare = resolveNum(ride?.waitingFare, ride?.waiting_fare, booking?.waitingFare, params.waitingFare);
              const extraWaitingAmount = resolveNum(ride?.extraWaitingAmount, ride?.extra_waiting_amount, booking?.extraWaitingAmount, params.extraWaitingAmount);
              const waitingMinute = resolveNum(ride?.waitingMinute, ride?.waiting_minute, booking?.waitingMinute, params.waitingMinute);
              const extraWaitingMinutes = resolveNum(ride?.extraWaitingMinutes, ride?.extra_waiting_minutes, booking?.extraWaitingMinutes, params.extraWaitingMinutes);

              const currentCouponRaw = ride?.coupon_code ?? booking?.coupon_code ?? coupon_code;
              const currentCoupon = currentCouponRaw === "null" ? null : currentCouponRaw;

              let paramDefaultDisCom = null;
              // Check both snake_case (legacy/api) and camelCase (sometimes transformed)
              const rawParamDisCom = params.default_dis_com || params.defaultDisCom;

              if (rawParamDisCom) {
                try {
                  paramDefaultDisCom = typeof rawParamDisCom === 'string' ? JSON.parse(rawParamDisCom) : rawParamDisCom;
                } catch (e) {
                  console.log("Failed to parse param discount", e);
                }
              }

              const unifiedDefaultDisCom = ride?.default_dis_com ?? booking?.default_dis_com ?? defaultDisCom ?? paramDefaultDisCom;

              const totalExtras = waitingFare + extraWaitingAmount;

              console.log("DEBUG RENDER FINAL:", {
                waitingFare,
                extraWaitingAmount,
                totalExtras,
                fareBeforeDiscount,
                unifiedDefaultDisCom,
                paramDefaultDisCom,
                rawParamDisCom,
                rideExists: !!ride
              });

              return (
                <>
                  {fareBeforeDiscount !== null && (
                    <>
                      {/* 1. Pure Trip Fare (Total - Waiting - Extra) */}
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Trip Fare</Text>
                        <Text style={styles.breakdownValue}>
                          ₹{(fareBeforeDiscount - totalExtras).toFixed(2)}
                        </Text>
                      </View>

                      {/* 2. Waiting Charges */}
                      {waitingFare > 0 && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>
                            Waiting Charges {waitingMinute > 0 ? `(${waitingMinute} min)` : ''}
                          </Text>
                          <Text style={styles.breakdownValue}>
                            ₹{waitingFare.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      {/* 3. Extra Time Charges */}
                      {extraWaitingAmount > 0 && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>
                            Extra Timing Charges {extraWaitingMinutes > 0 ? `(${extraWaitingMinutes} min)` : ''}
                          </Text>
                          <Text style={styles.breakdownValue}>
                            ₹{extraWaitingAmount.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      {/* 4. Subtotal (Trip + Waiting + Extra) */}
                      {(waitingFare > 0 || extraWaitingAmount > 0) && (
                        <View style={[styles.breakdownRow, { marginTop: 8, marginBottom: 8 }]}>
                          <Text style={[styles.breakdownLabel, { fontWeight: '600', color: '#333' }]}>Total Fare</Text>
                          <Text style={[styles.breakdownValue, { fontWeight: '600', color: '#333' }]}>
                            ₹{fareBeforeDiscount.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      {/* 5. Discount */}
                      {hasVoucher && (fareBeforeDiscount > fare) && (
                        <View style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: '#4CAF50' }]}>
                            {unifiedDefaultDisCom?.is_default_applied
                              ? "Z Cabs discount"
                              : `Coupon Applied${currentCoupon ? ` (${currentCoupon})` : ''}`}
                          </Text>
                          <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>
                            -₹{(fareBeforeDiscount - fare).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              );
            })()
            }

            <View style={[styles.dashedLine, { marginVertical: 12 }]} />
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            {hasVoucher && fareBeforeDiscount !== null ? (
              // If we showed breakdown, we just show the big total. 
              // If we didn't show breakdown (e.g. legacy), we keep strike.
              // For now, let's just show the Total clearly since breakdown is above.
              <Text style={styles.amountValue}>₹{fare.toFixed(2)}</Text>
            ) : (
              <Text style={styles.amountValue}>₹{fare.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.dashedLine} />

          {/* Ride Details (Pickup/Drop) */}
          <View style={styles.locationsContainer}>
            {booking && (
              <>
                <View style={styles.locationItem}>
                  <View style={[styles.dot, styles.pickupDot]} />
                  <View>
                    <Text style={styles.locLabel}>Pickup</Text>
                    <Text style={styles.locText} numberOfLines={1}>{booking.pickupAddress || booking.fromLocation || "Pickup Location"}</Text>
                  </View>
                </View>

                <View style={styles.timelineLine} />

                <View style={styles.locationItem}>
                  <View style={[styles.dot, styles.dropDot]} />
                  <View>
                    <Text style={styles.locLabel}>Drop-off</Text>
                    <Text style={styles.locText} numberOfLines={1}>{booking.dropoffAddress || booking.toLocation || "Drop Location"}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.dashedLine} />

          {/* Payment Details */}
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <View style={styles.methodContainer}>
              <Icon name={getPaymentIcon()} size={16} color="#333" />
              <Text style={styles.detailValue}>{paymentMethod.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Ride ID</Text>
            <Text style={styles.detailValueMono}>{(booking?.rideId || ride?.rideId) ? String(booking?.rideId || ride?.rideId).slice(0, 8) : "N/A"}</Text>
          </View>

          {/* Footer Message */}
          <View style={styles.footerMessage}>
            <Icon name="verified-user" size={14} color="#666" />
            <Text style={styles.footerText}>
              {rideCompleted ? "Thank you for riding with us." : "Secure Payment Gateway"}
            </Text>
          </View>

        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsContainer}>

          {/* UPI Pay Button */}
          {!rideCompleted && isUPI && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUPIPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Pay Now</Text>
              <Icon name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Cash Instruction */}
          {!rideCompleted && isCash && (
            <View style={styles.cashNotice}>
              <Text style={styles.cashNoticeText}>Please pay ₹{fare} cash to the driver.</Text>
            </View>
          )}

          {/* Success / Home Button */}
          {rideCompleted && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          )}

        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#333",
    textTransform: "uppercase",
  },
  headerDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  // Invoice Card
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  // Status Badge
  statusBadge: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: "#FFF4F4",
    borderColor: "#FFE0E0",
  },
  statusPaid: {
    backgroundColor: "#F0FFF4",
    borderColor: "#D0F5D6",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textPending: { color: "#D32F2F" },
  textPaid: { color: "#2E7D32" },

  // Amount
  amountSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#000",
  },
  strikeAmount: {
    fontSize: 20,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 4,
    fontWeight: "500",
  },

  // Divider
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    borderRadius: 1,
    marginVertical: 20,
  },

  // Locations
  locationsContainer: {
    paddingHorizontal: 8,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineLine: {
    height: 24,
    width: 1,
    backgroundColor: "#E0E0E0",
    marginLeft: 5, // Center with dot (10px width / 2)
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    backgroundColor: "#000",
  },
  pickupDot: {
    backgroundColor: "#000",
  },
  dropDot: {
    backgroundColor: "#666",
  },
  locLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  locText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  // Details
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  methodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  detailValueMono: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#333",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Footer Message
  footerMessage: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#888",
  },

  // Actions
  actionsContainer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cashNotice: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cashNoticeText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  // Breakdown
  breakdownContainer: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#555",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});