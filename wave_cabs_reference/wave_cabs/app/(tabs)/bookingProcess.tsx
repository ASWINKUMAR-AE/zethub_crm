
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useAuth } from "../context/AuthContext";
import { useMaintenance } from "../context/MaintenanceContext";
import { packagesAPI, rideAPI, userAPI, voucherAPI } from "../services/api";
import { vehicalService, voucherSystemService } from "../services/cmsApi";


const GOOGLE_API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";
const { width, height } = Dimensions.get("window");

function normalizeAcType(ac_type: string): string {
  if (typeof ac_type !== "string") return "";
  const val = ac_type.trim().toLowerCase();
  if (val === "ac") return "AC";
  if (val === "non-ac" || val === "nonac" || val === "non ac") return "Non-AC";
  return ac_type;
}

function formatVoucherTitle(voucher: any) {
  if (!voucher) return "";
  const code = voucher.code || "";
  const discountType = voucher.discountType || voucher.discount_type;
  const discountValue = voucher.discountValue || voucher.discount_value; // Handle backend snake_case

  if (discountType === "PERCENT") {
    return `${parseInt(discountValue)}% OFF`;
  } else if (discountType === "FLAT") {
    return `₹${parseInt(discountValue)} OFF`;
  }
  return code;
}

// 🎨 Custom Map Style (Silver/Minimal)
const MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

export default function BookingProcess() {
  const route = useRoute();
  const params = (route.params || {}) as { pickupLatLng?: { lat: number; lng: number }, dropLatLng?: { lat: number; lng: number }, pickupText?: string, dropText?: string };
  const pickupLatLng = params.pickupLatLng;
  const dropLatLng = params.dropLatLng;
  const pickupText = params.pickupText;
  const dropText = params.dropText;

  const mapRef = useRef<MapView>(null); // 🗺️ Map Reference

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [fares, setFares] = useState<Record<string, number>>({});
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [acType, setAcType] = useState<string>("AC");
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showOffersModal, setShowOffersModal] = useState<boolean>(false);
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [tripType, setTripType] = useState<string>("oneway");
  const [bookingTime, setBookingTime] = useState<string>("now");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingBreakdown, setBookingBreakdown] = useState<any>(null); // State for backend fare breakdown

  // Schedule Ride State
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      // If cancelled and bookingTime is later, revert to now? Or keep as is?
      // Usually better to just close. If date wasn't picked, bookingTime should remain what it was or user flow handles it.
      // But we will set bookingTime to 'now' if they cancel the picker on the first open?
      // Let's just close.
      if (bookingTime === 'now') return;
      return;
    }
    const currentDate = selectedDate || scheduledDate;
    setShowDatePicker(false);
    setScheduledDate(currentDate);

    // On Android, show time picker after date
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    const currentDate = selectedDate || scheduledDate;
    setShowTimePicker(false);
    setScheduledDate(currentDate);
  };

  // CMS Configuration State
  const [cmsVehicles, setCmsVehicles] = useState<Set<string> | null>(null);
  const [cmsVouchersEnabled, setCmsVouchersEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchCMSConfig = async () => {
      try {
        // Fetch Voucher Status
        const voucherStatus = await voucherSystemService.getStatus();
        setCmsVouchersEnabled(voucherStatus);

        // Fetch enabled vehicles
        try {
          const vRes = await vehicalService.getVehicles();
          let vehiclesData = vRes.data;

          // Handle common API response wrappers
          if (vehiclesData && !Array.isArray(vehiclesData)) {
            if (Array.isArray(vehiclesData.data)) vehiclesData = vehiclesData.data;
            else if (Array.isArray(vehiclesData.vehicles)) vehiclesData = vehiclesData.vehicles;
          }

          if (vehiclesData && Array.isArray(vehiclesData)) {
            const enabled = new Set<string>();
            vehiclesData.forEach((v: any) => {
              // Handle both string array and object array with status/enabled flag
              if (typeof v === 'string') {
                enabled.add(v.toLowerCase());
              } else {
                const name = v.id || v.name || v.vehicle_type || v.type; // Prefer ID if available for exact match
                // Check multiple possible keys for status (1/true) including is_available
                const isEnabled =
                  v.enabled === 1 ||
                  v.status === 1 ||
                  v.isActive === 1 ||
                  v.is_available === 1 ||
                  v.enabled === true ||
                  v.status === true ||
                  v.is_available === true;

                if (name && isEnabled) {
                  enabled.add(name.toLowerCase());
                }
              }
            });
            setCmsVehicles(enabled);
          }
        } catch (e) {
          console.error("Error fetching CMS Config:", e);
        }
      } catch (e) {
        console.error("Error in generic CMS Config fetch:", e);
      }
    };
    fetchCMSConfig();
  }, []);

  const isLocalTrip = distanceKm < 20 && distanceKm > 0;
  const isOutstationTrip = distanceKm >= 20;
  const navigation = useNavigation() as any;

  useEffect(() => {
    const checkRiderStatus = async () => {
      try {
        const statusRes = await userAPI.getStatus();
        if (statusRes.status === "inRide") {
          navigation.replace("RiderRideTracker", {
            ...route.params,
            rideId: statusRes.rideId,
          });
        } else if (statusRes.status === "searchingRide") {
          navigation.replace("RidePendingScreen", {
            ...route.params,
            requestId: statusRes.requestId,
          });
        } else if (statusRes.status === "payment") {
          navigation.replace("CompleteRide", {
            request_id: statusRes.requestId,
            fare: statusRes.fare,
            payment_method: statusRes.payment_method,
          });
        }
      } catch (error) {
        console.warn("Error checking rider status:", error);
      }
    };
    checkRiderStatus();
  }, []);

  // ... (Package loading and logic - kept same)
  type Package = {
    vehicle_type: string;
    ac_type: string;
    type: string;
    kms: number | string;
    hr: number | string;
    basefare: number | string;
    extra_rate_per_km: number | string;
    waiting_charge: number | string;
    [key: string]: any;
  };
  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  React.useEffect(() => {
    async function fetchPackages() {
      try {
        setPackagesLoading(true);
        const response = await packagesAPI.fetchAll();
        setPackages(response || []);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setPackagesLoading(false);
      }
    }
    fetchPackages();
  }, []);

  const rideTypes = React.useMemo(() => {
    return [
      { id: "mini", name: "Mini", icon: "car", comingSoon: false },
      { id: "sedan", name: "Sedan", icon: "car-sports", comingSoon: false },
      { id: "suv", name: "SUV", icon: "car-estate", comingSoon: false },
      { id: "bike", name: "Bike", icon: "motorbike", comingSoon: false },
      { id: "auto", name: "Auto", icon: "rickshaw", comingSoon: true }
    ];
  }, []);

  const availableRideTypes = React.useMemo(() => {
    if (!pickupLatLng || !dropLatLng || !Array.isArray(packages)) return [];

    // Filter base rideTypes by CMS config if loaded
    let titleCasedRideTypes = rideTypes;
    if (cmsVehicles && cmsVehicles.size > 0) {
      // Force allow SUV, Bike, Auto to ensure they show up even if CMS is missing them
      titleCasedRideTypes = rideTypes.filter(r =>
        cmsVehicles.has(r.id.toLowerCase()) ||
        r.id === 'suv' ||
        r.id === 'bike' ||
        r.id === 'auto'
      );
    }

    if (isOutstationTrip) {
      return titleCasedRideTypes.filter(ride =>
        packages.some(pkg =>
          pkg.vehicle_type.toLowerCase() === ride.id && pkg.type === "outstation"
        )
      );
    } else {
      return titleCasedRideTypes.filter(ride => ["mini", "sedan", "bike", "auto"].includes(ride.id));
    }
  }, [pickupLatLng, dropLatLng, packages, isOutstationTrip, rideTypes, cmsVehicles]);

  React.useEffect(() => {
    if (Array.isArray(availableRideTypes) && availableRideTypes.length > 0) {
      setSelectedRide(availableRideTypes[0].id);
    }
  }, [availableRideTypes]);

  React.useEffect(() => {
    if (!pickupLatLng || !dropLatLng || !Array.isArray(packages)) return;
    let newFares: Record<string, number> = {};
    availableRideTypes.forEach((ride) => {
      let fare = 0;
      if (isOutstationTrip) {
        // 1. Calculate Total Trip Distance (Matching Summary Logic)
        const totalTripKm = tripType === "round" ? (distanceKm * 2) : (distanceKm + Math.max(0, distanceKm - 15));

        // 2. Select Packages: Descending order
        const usefulPkgs = packages
          .filter(p =>
            p.vehicle_type.toLowerCase() === ride.id.toLowerCase() &&
            p.type === "outstation" &&
            (p.ac_type ? normalizeAcType(p.ac_type) === acType : true)
          )
          .sort((a, b) => Number(b.kms) - Number(a.kms));

        // 3. Find Best Base Package
        if (usefulPkgs.length > 0) {
          const basePkg = usefulPkgs.find((p: any) => Number(p.kms) <= totalTripKm) || usefulPkgs[usefulPkgs.length - 1];

          if (basePkg) {
            const bKm = Number(basePkg.kms);
            const bFare = Number(basePkg.basefare);
            const eRate = Number(basePkg.extra_rate_per_km);

            const eKm = Math.max(0, totalTripKm - bKm);
            const eKmFare = Math.round(eKm * eRate);

            // 4. Calculate Extra Time (Waiting/Allowance)
            const totalDurationHr = durationMin / 60;
            const eHr = Math.max(0, totalDurationHr - Number(basePkg.hr));
            const eMin = eHr * 60;
            const eTimeFare = eMin > 0 ? Math.round(eMin * Number(basePkg.waiting_charge)) : 0;

            const tFare = bFare + eKmFare + eTimeFare;

            // 5. Taxes (5%) & Night Charge
            let nCharge = 0;
            if (bookingTime === 'now') {
              const hour = new Date().getHours();
              if (hour >= 22 || hour < 5) {
                nCharge = Math.round(tFare * 0.30);
              }
            }

            const taxAmount = tFare + nCharge;
            const tFees = Math.round(taxAmount * 0.05);

            fare = tFare + nCharge + tFees;
          }
        }
      } else {
        if (ride.id === "mini" || ride.id === "sedan" || ride.id === "suv") {
          let perKm = 20;

          if (ride.id === "suv") {
            perKm = acType === "AC" ? 30 : 28; // SUV Rates (Higher)
          } else {
            // Mini/Sedan
            perKm = acType === "AC" ? 22 : 20;
          }

          fare = Math.round(distanceKm * perKm);
        }

        if (ride.id === "bike") {
          fare = Math.round(20 + Math.max(0, distanceKm - 1.8) * 6.8 + durationMin * 0.5);
        }
        if (ride.id === "auto") fare = 0;
      }
      newFares[ride.id] = Math.round(fare);
    });
    setFares(newFares);
  }, [distanceKm, durationMin, acType, tripType, isOutstationTrip, packages, availableRideTypes, bookingTime]);

  const { selectedPackage, extraKmFare, extraTimeFare } = React.useMemo(() => {
    if (!isOutstationTrip || !selectedRide || !Array.isArray(packages)) {
      return { selectedPackage: null, extraKmFare: 0, extraTimeFare: 0 };
    }
    const totalTripKm = tripType === "round" ? (distanceKm * 2) : (distanceKm + Math.max(0, distanceKm - 15));
    const tripHr = durationMin / 60;
    const matchingPkgs = packages
      .filter(p =>
        p.vehicle_type.toLowerCase() === selectedRide.toLowerCase() &&
        p.type === "outstation" &&
        (p.ac_type ? normalizeAcType(p.ac_type) === acType : true)
      )
      .sort((a, b) => Number(b.kms) - Number(a.kms)); // Descending

    if (matchingPkgs.length === 0) return { selectedPackage: null, extraKmFare: 0, extraTimeFare: 0 };

    const basePkg = matchingPkgs.find((p: any) => Number(p.kms) <= totalTripKm) || matchingPkgs[matchingPkgs.length - 1];

    // Calculate Extras
    const bKm = Number(basePkg.kms);
    const eRate = Number(basePkg.extra_rate_per_km);
    const eKm = Math.max(0, totalTripKm - bKm);
    const extraKmFare = Math.round(eKm * eRate);

    const eHr = Math.max(0, tripHr - Number(basePkg.hr));
    const eMin = eHr * 60;
    const extraTimeFare = eMin > 0 ? Math.round(eMin * Number(basePkg.waiting_charge)) : 0;

    return { selectedPackage: basePkg, extraKmFare, extraTimeFare };
  }, [isOutstationTrip, selectedRide, acType, tripType, distanceKm, durationMin, packages]);

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: "cash" },
    { id: "upi", name: "UPI", icon: "cellphone" },
  ];

  function applyOffer(item: any) {
    if (item.minRideFare && finalFare < item.minRideFare) {
      Alert.alert("Invalid Offer", `This voucher is valid only for rides above ₹${item.minRideFare}`);
      return;
    }
    setAppliedOffer(item);
    setShowOffersModal(false);
  }

  const { user } = useAuth();
  const showAcToggle =
    selectedRide === "mini" || selectedRide === "sedan" || selectedRide === "suv";

  const showTripType = isOutstationTrip;
  const showBookingTime = isOutstationTrip && availableRideTypes.some(r => r.id === selectedRide);
  const finalFare = selectedRide ? fares[selectedRide] || 0 : 0;

  async function fetchRouteAndFare() {
    try {
      if (!pickupLatLng || !dropLatLng) throw new Error("Missing pickup or drop location");
      const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickupLatLng.lat},${pickupLatLng.lng}&destinations=${dropLatLng.lat},${dropLatLng.lng}&units=metric&key=${GOOGLE_API_KEY}`;
      const dmRes = await fetch(dmUrl);
      const dmData = await dmRes.json();
      const el = dmData.rows[0].elements[0];
      const distKm = el.distance.value / 1000;
      const durMin = el.duration.value / 60;
      setDistanceKm(distKm);
      setDurationMin(durMin);

      const rmUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupLatLng.lat},${pickupLatLng.lng}&destination=${dropLatLng.lat},${dropLatLng.lng}&key=${GOOGLE_API_KEY}`;
      const rmRes = await fetch(rmUrl);
      const rmData = await rmRes.json();
      const points = rmData.routes[0]?.overview_polyline?.points;
      if (points) {
        const decodedPoints = decodePolyline(points);
        setRouteCoords(decodedPoints);

        // 📍 FIT TO MAP coordinates
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates([
              { latitude: pickupLatLng.lat, longitude: pickupLatLng.lng },
              { latitude: dropLatLng.lat, longitude: dropLatLng.lng },
              ...decodedPoints
            ], {
              edgePadding: {
                top: 150,       // Clear top card
                right: 50,
                bottom: height * 0.5, // Clear bottom panel
                left: 50
              },
              animated: true
            });
          }
        }, 500);
      }
    } catch (e) {
      setError("Failed to fetch route/fare");
    }
    setLoading(false);
  }

  function decodePolyline(t: string) {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  React.useEffect(() => {
    if (pickupLatLng && dropLatLng) {
      setLoading(true);
      fetchRouteAndFare();
    }
  }, [pickupLatLng, dropLatLng]);

  const { maintenance } = useMaintenance();

  async function handleBooking(rideType: string) {
    if (maintenance.mode !== 'none') {
      Alert.alert(
        "Booking Temporarily Disabled",
        maintenance.message || "Booking is disabled due to maintenance"
      );
      return;
    }

    if (!pickupLatLng || !dropLatLng || !user?.id) {
      Alert.alert("Missing details", "Please select all required fields.");
      return;
    }

    // 🚀 Outstation Flow: Navigate to Summary Screen
    if (isOutstationTrip) {
      const scheduledTime = bookingTime === "now" ? new Date().toISOString() : scheduledDate.toISOString();
      const dropTime = new Date(new Date(scheduledTime).getTime() + durationMin * 60000).toISOString();

      const seats =
        rideType === "suv" ? "6 Seater" :
          rideType === "bike" ? "1 Seater" :
            rideType === "auto" ? "3 Seater" : "4 Seater";

      const vehicleDisplayName = rideType.charAt(0).toUpperCase() + rideType.slice(1);

      navigation.navigate("BookingSummaryScreen", {
        rideType: rideType,
        vehicleType: vehicleDisplayName,
        seatInfo: seats,
        scheduledAt: bookingTime,
        pickupAddress: pickupText,
        dropAddress: dropText,
        pickupDateTime: scheduledTime,
        dropEstimatedDateTime: dropTime,
        distanceKm: distanceKm.toString(), // Pass as string to ensure safe transit
        durationMin: durationMin.toString(),
        origin: JSON.stringify(pickupLatLng),
        destination: JSON.stringify(dropLatLng),
        packageId: selectedPackage?.id,
        acType: acType,
        paymentMethod: selectedPayment || "Cash",
        couponCode: appliedOffer?.code,
        tripType: tripType,
        // ❌ NO FARE PARAMS passed
      });
      return;
    }

    // 🚖 Local Flow (Existing Logic)
    const rideData = {
      pickup_location: pickupText,
      pickup_latitude: pickupLatLng.lat,
      pickup_longitude: pickupLatLng.lng,
      dropoff_location: dropText,
      dropoff_latitude: dropLatLng.lat,
      dropoff_longitude: dropLatLng.lng,
      ride_type: rideType,
      user_id: user.id,
      ride_date: new Date().toISOString(),
      fare: finalFare,
      payment_method: selectedPayment,
      distance: distanceKm,
      duration: durationMin,
      coupon_code: appliedOffer?.code || null,
      booked_for: user.id,
      package_id: null, // Local rides don't use package logic here usually? existing code used isOutstationTrip check.
      trip_type: tripType,
      ac_type: acType,
      booking_time: bookingTime
    };

    try {
      setIsBooking(true);
      const response = await rideAPI.bookRide(rideData);
      if (response?.success || response?.status === "success") {
        setBookingBreakdown(response);
        const requestId = response.request_id;
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          navigation.navigate("RidePendingScreen", {
            requestId: requestId,
            rideType: rideType,
            fromLocation: pickupText,
            toLocation: dropText,
            fare: response.finalFare || response.fare || finalFare,
            discountPercent: response.discountPercent,
            discountAmount: response.discountAmount,
            appliedVoucherCode: response.appliedVoucherCode,
            paymentMethod: response.payment_method || selectedPayment,
            pickupCoords: pickupLatLng,
            dropCoords: dropLatLng,
            package_id: rideData.package_id
          });
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Could not book ride. Please try again.";
      setError("Booking failed");
      Alert.alert("Booking Failed", errorMessage);
    } finally {
      setIsBooking(false);
    }
  }

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  useEffect(() => {
    if (selectedRide === "bike" || selectedRide === "auto") {
      setAcType("Non-AC"); // reset AC
    }
  }, [selectedRide]);

  // Update voucher fetch to depend on selectedRide
  React.useEffect(() => {
    const fetchVouchers = async () => {
      if (!user?.id || !selectedRide) {
        console.log("🚨 Missing user ID or selected ride:", { userId: user?.id, selectedRide });
        return;
      }
      try {
        setVouchersLoading(true);
        console.log("🔄 Fetching vouchers for:", { userId: user.id, selectedRide });
        const response = await voucherAPI.getAvailableVouchers(
          user.id,
          selectedRide // Use selectedRide directly
        );
        console.log("✅ Vouchers API Response:", response);
        if (response?.vouchers) {
          setVouchers(response.vouchers);
        } else {
          console.log("⚠️ No vouchers available:", response);
          setVouchers([]);
        }
      } catch (error) {
        console.error("❌ Error fetching vouchers:", error);
        setVouchers([]);
      } finally {
        setVouchersLoading(false);
      }
    };

    fetchVouchers();
  }, [user?.id, selectedRide]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#333333" />
        <Text style={styles.loadingText}>Calculating your ride...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🗺️ Map as BACKGROUND Layer */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        mapPadding={{
          top: 130, // Pushes map center down below the Top Card
          right: 20,
          bottom: height * 0.55, // ⚠️ CRITICAL: Pushes map center UP above Bottom Panel
          left: 20
        }}
        initialRegion={
          pickupLatLng
            ? {
              latitude: pickupLatLng.lat,
              longitude: pickupLatLng.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }
            : {
              latitude: 0,
              longitude: 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }
        }
      >
        {pickupLatLng && pickupLatLng.lat != null && pickupLatLng.lng != null && (
          <Marker
            coordinate={{
              latitude: pickupLatLng.lat,
              longitude: pickupLatLng.lng,
            }}
            title="Pickup"
            pinColor="#000"
          />
        )}
        {dropLatLng && dropLatLng.lat != null && dropLatLng.lng != null && (
          <Marker
            coordinate={{
              latitude: dropLatLng.lat,
              longitude: dropLatLng.lng,
            }}
            title="Drop"
            pinColor="#000"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#000"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* 📄 Content Overlay Layer */}
      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.topContainer} pointerEvents="box-none">
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          {/* Route Summary Card */}
          <View style={styles.routeSummaryCard}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.dotLine} />
              <View style={[styles.dot, styles.dropDot]} />
            </View>
            <View style={styles.locationTexts}>
              <Text style={styles.locationText} numberOfLines={1}>{pickupText}</Text>
              <View style={styles.divider} />
              <Text style={styles.locationText} numberOfLines={1}>{dropText}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Booking Panel */}
        <View style={styles.bottomPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bottomPanelContent}
          >
            <View style={styles.dragHandle} />

            <Text style={styles.distanceText}>
              {distanceKm.toFixed(1)} km · {Math.round(durationMin)} min
            </Text>

            {/* Vehicle Types in 2x2 Grid */}
            <View style={styles.gridContainer}>
              {packagesLoading ? (
                <ActivityIndicator size="small" color="#333333" />
              ) : Array.isArray(availableRideTypes) && availableRideTypes.length > 0 ? (
                <View style={styles.grid}>
                  {availableRideTypes.map((r: any) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.gridCard,
                        selectedRide === r.id && !r.comingSoon && styles.gridCardSelected,
                        r.comingSoon && styles.gridCardDisabled,
                      ]}
                      onPress={() => !r.comingSoon && setSelectedRide(r.id)}
                      activeOpacity={r.comingSoon ? 1 : 0.85}
                      disabled={r.comingSoon}
                    >
                      <View style={styles.gridCardContent}>
                        <View style={[
                          styles.iconContainer,
                          selectedRide === r.id && !r.comingSoon && styles.iconContainerSelected
                        ]}>
                          <MaterialCommunityIcons
                            name={r.icon as any}
                            size={32}
                            color={selectedRide === r.id && !r.comingSoon ? "#ffffff" : "#333333"}
                          />
                        </View>
                        <Text style={[
                          styles.gridCardTitle,
                          selectedRide === r.id && !r.comingSoon && styles.gridCardTitleSelected
                        ]}>
                          {r.name}
                        </Text>
                        <Text style={styles.gridCardSubtitle}>
                          {r.comingSoon ? "Coming Soon" : isLocalTrip ? "Local" : "Outstation"}
                        </Text>
                        <Text style={[
                          styles.gridCardFare,
                          selectedRide === r.id && !r.comingSoon && styles.gridCardFareSelected
                        ]}>
                          {r.comingSoon ? "-" : (fares[r.id] !== undefined && fares[r.id] > 0 ? `₹${fares[r.id]}` : "-")}
                        </Text>
                        {selectedRide === r.id && !r.comingSoon && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color="#333333" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRidesText}>
                  No ride types available for this route
                </Text>
              )}
            </View>

            {/* Configuration Options */}
            {(showAcToggle || showTripType || showBookingTime) && (
              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Trip Configuration</Text>

                {showAcToggle && (
                  <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>AC Type</Text>
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, acType === "AC" && styles.toggleButtonActive]}
                        onPress={() => setAcType("AC")}
                      >
                        <Text style={[styles.toggleText, acType === "AC" && styles.toggleTextActive]}>AC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, acType === "Non-AC" && styles.toggleButtonActive]}
                        onPress={() => setAcType("Non-AC")}
                      >
                        <Text style={[styles.toggleText, acType === "Non-AC" && styles.toggleTextActive]}>Non-AC</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {showTripType && (
                  <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>Trip Type</Text>
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, tripType === "oneway" && styles.toggleButtonActive]}
                        onPress={() => setTripType("oneway")}
                      >
                        <Text style={[styles.toggleText, tripType === "oneway" && styles.toggleTextActive]}>One Way</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, tripType === "round" && styles.toggleButtonActive]}
                        onPress={() => setTripType("round")}
                      >
                        <Text style={[styles.toggleText, tripType === "round" && styles.toggleTextActive]}>Round Trip</Text>

                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {showBookingTime && (
                  <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>Booking Time</Text>
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, bookingTime === "now" && styles.toggleButtonActive]}
                        onPress={() => setBookingTime("now")}
                      >
                        <Text style={[styles.toggleText, bookingTime === "now" && styles.toggleTextActive]}>Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, bookingTime === "later" && styles.toggleButtonActive]}
                        onPress={() => {
                          setBookingTime("later");
                          setShowDatePicker(true);
                        }}
                      >
                        <Text style={[styles.toggleText, bookingTime === "later" && styles.toggleTextActive]}>
                          {bookingTime === "later" ? scheduledDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Later"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Date Time Pickers */}
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={scheduledDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                testID="timePicker"
                value={scheduledDate}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={onTimeChange}
              />
            )}

            {/* Fare Breakdown */}
            <View style={styles.fareBreakdown}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
                {cmsVouchersEnabled && (
                  <TouchableOpacity onPress={() => setShowOffersModal(true)}>
                    <Text style={styles.applyOfferText}>
                      {appliedOffer ? `Applied: ${formatVoucherTitle(appliedOffer)}` : "Apply Offers"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLocalTrip && selectedRide === "bike" && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownText}>Bike Fare</Text>
                  <Text style={styles.breakdownAmount}>₹{fares["bike"]}</Text>
                </View>
              )}
              {isLocalTrip && (selectedRide === "mini" || selectedRide === "sedan") && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownText}>
                    {selectedRide.charAt(0).toUpperCase() + selectedRide.slice(1)} ({acType})
                  </Text>
                  <Text style={styles.breakdownAmount}>₹{fares[selectedRide]}</Text>
                </View>
              )}
              {isOutstationTrip && selectedRide && (
                <Text style={{ fontSize: 12, color: '#666', marginTop: 10, fontStyle: 'italic' }}>
                  Fare breakdown will be shown on the next screen.
                </Text>
              )}

              {/* Discount Section */}
              {(bookingBreakdown?.discountAmount > 0 || appliedOffer) && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.discountText}>
                    Discount {appliedOffer ? `(${appliedOffer.code})` : ""}
                    {bookingBreakdown?.discountPercent ? ` - ${bookingBreakdown.discountPercent}%` : (appliedOffer?.discountPercent ? ` - ${appliedOffer.discountPercent}%` : "")}
                  </Text>
                  {bookingBreakdown?.discountAmount > 0 && (
                    <Text style={styles.discountAmount}>
                      -₹{bookingBreakdown.discountAmount}
                    </Text>
                  )}
                </View>
              )}

              {/* Total Section */}
              <View style={styles.totalRow}>
                <Text style={styles.breakdownTotal}>Total Amount</Text>
                <Text style={styles.breakdownTotal}>
                  ₹{bookingBreakdown?.finalFare || finalFare}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPaymentModal(true)}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="card" size={20} color="#333333" />
                  <Text style={styles.actionButtonText}>
                    {paymentMethods.find((p: any) => p.id === selectedPayment)?.name}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#333333" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Book Button */}
            {selectedRide && (
              <TouchableOpacity
                style={[
                  styles.bookBtn,
                  (isBooking || maintenance.mode !== 'none') && styles.bookBtnDisabled
                ]}
                onPress={() => handleBooking(selectedRide)}
                disabled={isBooking || !pickupLatLng || !dropLatLng}
              >
                {isBooking ? (
                  <ActivityIndicator color="#ffffff" />
                ) : bookingSuccess ? (
                  <Ionicons name="checkmark" size={24} color="#ffffff" />
                ) : (
                  <View style={styles.bookBtnContent}>
                    <Text style={styles.bookBtnText}>
                      Book {selectedRide.charAt(0).toUpperCase() + selectedRide.slice(1)}
                    </Text>
                    <View style={styles.bookBtnPrice}>
                      <Text style={styles.bookBtnSubtext}>₹{finalFare}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={paymentMethods}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPayment === item.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setSelectedPayment(item.id);
                    setShowPaymentModal(false);
                  }}
                >
                  <View style={styles.paymentIcon}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color="#333333" />
                  </View>
                  <Text style={styles.paymentText}>{item.name}</Text>
                  {selectedPayment === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#333333" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Offers Modal */}
      <Modal
        visible={showOffersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOffersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Offers</Text>
              <TouchableOpacity
                onPress={() => setShowOffersModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vouchers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isValid = !item.minRideFare || finalFare >= item.minRideFare;
                return (
                  <TouchableOpacity
                    style={[
                      styles.offerItem,
                      appliedOffer?.id === item.id && styles.offerItemApplied,
                      !isValid && { opacity: 0.8 }
                    ]}
                    onPress={() => isValid && applyOffer(item)}
                    disabled={!isValid}
                  >
                    <View style={styles.offerIcon}>
                      <Ionicons name="pricetag" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.offerDetails}>
                      <Text style={styles.offerTitle}>
                        {formatVoucherTitle(item)}
                      </Text>
                      <Text style={styles.offerCode}>Use code: {item.code}</Text>
                    </View>
                    {appliedOffer?.id === item.id ? (
                      <View style={styles.appliedBadge}>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                        <Text style={styles.appliedText}>APPLIED</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.applyButton,
                          !isValid && { backgroundColor: "#ccc" }
                        ]}
                        onPress={() => isValid && applyOffer(item)}
                        disabled={!isValid}
                      >
                        <Text style={styles.applyButtonText}>
                          {isValid ? "APPLY" : `Min ₹${item.minRideFare}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                vouchersLoading ? (
                  <ActivityIndicator size="small" color="#333333" style={{ padding: 20 }} />
                ) : (
                  <Text style={styles.noVouchersText}>No vouchers available</Text>
                )
              }
              ListFooterComponent={
                <View style={styles.couponInputContainer}>
                  <Text style={styles.couponTitle}>Have a coupon code?</Text>
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="Enter code"
                      value={couponCode}
                      onChangeText={setCouponCode}
                      placeholderTextColor="#888888"
                    />
                    <TouchableOpacity style={styles.couponApplyBtn}>
                      <Text style={styles.couponApplyText}>APPLY</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#333",
    fontSize: 16,
  },
  errorText: {
    color: "#d32f2f",
    marginTop: 10,
  },

  // Overlay Container
  overlayContainer: {
    flex: 1,

    justifyContent: "space-between",
  },

  // Top Container (Back Button + Route Summary)
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  routeSummaryCard: {
    flexDirection: "row",
    marginTop: 120,
    marginRight: -6,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    marginHorizontal: 106,
    shadowRadius: 8,
    elevation: 5,
  },
  locationDot: {
    alignItems: "center",
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickupDot: {
    backgroundColor: "#000",
  },
  dropDot: {
    backgroundColor: "#000",
  },
  dotLine: {
    width: 2,
    height: 24,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
  locationTexts: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },

  // Bottom Panel
  bottomPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    maxHeight: height * 0.65, // Occupy max 65% of screen
  },
  bottomPanelContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontWeight: "500",
    textAlign: "center",
  },

  // Grid
  gridContainer: {
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardSelected: {
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
    transform: [{ scale: 1.02 }],
  },
  gridCardDisabled: {
    opacity: 0.5,
  },
  gridCardContent: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: "#000",
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  gridCardTitleSelected: {
    color: "#333",
  },
  gridCardSubtitle: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
  },
  gridCardFare: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  gridCardFareSelected: {
    color: "#333",
  },
  selectedIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  noRidesText: {
    textAlign: "center",
    color: "#666",
  },

  // Config Section
  configSection: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  optionGroup: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#000",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
  },

  // Fare Breakdown
  fareBreakdown: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  applyOfferText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  breakdownText: {
    fontSize: 13,
    color: "#555",
  },
  breakdownAmount: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  discountText: {
    fontSize: 13,
    color: "#4CAF50",
  },
  discountAmount: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  breakdownTextNoPackage: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },

  // Action Buttons
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  // Book Button
  bookBtn: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  bookBtnDisabled: {
    backgroundColor: "#888",
  },
  bookBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bookBtnPrice: {
    marginLeft: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookBtnSubtext: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modals (kept same styling mostly, updated colors if needed)
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedOption: {
    backgroundColor: "#f9f9f9",
  },
  paymentIcon: {
    width: 40,
    alignItems: "center",
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  offerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  offerItemApplied: {
    borderColor: "#4CAF50",
    backgroundColor: "#e8f5e9",
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  offerDetails: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  offerCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  appliedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  noVouchersText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  couponInputContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  couponApplyBtn: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  couponApplyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
