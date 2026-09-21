import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from './context/AuthContext';
import { socket } from './services/socket';

const { width } = Dimensions.get('window');
const DP_BASE_URL = "https://server.wavecabs.com/uploads/dp/";

import { rideAPI } from './services/api';

export default function RideDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const auth = useContext(AuthContext) as any;
    const user = auth?.user;
    const insets = useSafeAreaInsets();

    // Extract params safely
    const { bookingId, source } = params;
    const isConfirmFlow = source === 'confirm';
    const isFromBookings = source === 'bookings';
    const isStartupInRide = source === 'startup_inRide';

    // State for fetched details
    const [bookingDetails, setBookingDetails] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(!!bookingId); // Loading if bookingId is present initially
    const [isCancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [remainingMinutes, setRemainingMinutes] = useState(null);

    // CONFIRM FLOW STATE
    type StatusStage = 'confirmed' | 'searching' | 'assigned' | 'confirmedAndNotStarted' | 'confirmedAndInPickupLocation' | 'confirmedAndStarted';
    // Initialize assigned for startup_inRide to immediately show UI, others wait
    const [statusStage, setStatusStage] = useState<StatusStage>(isStartupInRide ? 'assigned' : 'confirmed');
    const [liveRidePayload, setLiveRidePayload] = useState<any>(null);

    // Check if we already have a driver from initial details (fallback)
    useEffect(() => {
        if (!bookingDetails) return;

        const hasDriver = !!(bookingDetails.driverName || bookingDetails.driver_id);
        const status = (bookingDetails.status || '').toLowerCase();
        console.log("RideDetails Effect: Checking status:", status);

        const isActiveStatus = ['accepted', 'confirmedandnotstarted', 'inride', 'ongoing'].includes(status);

        if (status === 'searching' || status === 'requested' || status === 'pending') {
            setStatusStage('searching');
        } else if (hasDriver || isActiveStatus) {
            setStatusStage('assigned');
        }
    }, [bookingDetails]);

    // Socket Logic - Listen for updates for ALL sources
    useEffect(() => {
        if (!user?.id) return;

        const userId = user.id;

        const joinRoom = () => {
            console.log("RideDetails Socket: Joining Rider Room", userId);
            if (!socket.connected) socket.connect();
            socket.emit("joinRiderRoom", { userId });
        };

        joinRoom();

        const handleRideSearching = (data: any) => {
            console.log("RideDetails Socket: Searching event:", data);
            setStatusStage('searching');
        };

        const handleRideAccepted = (data: any) => {
            console.log("RideDetails Socket: Ride accepted event:", data);
            if (!data?.rideId) return;

            setLiveRidePayload(data);
            setStatusStage('assigned');
        };

        socket.on("connect", joinRoom);
        socket.on("rideSearching", handleRideSearching);
        socket.on("rideAccepted", handleRideAccepted);

        return () => {
            socket.off("rideAccepted", handleRideAccepted);
            socket.off("rideSearching", handleRideSearching);
            socket.off("connect", joinRoom);
        };
    }, [isConfirmFlow, user]);

    // Fetch details if bookingId is present
    useEffect(() => {
        if (bookingId) {
            const fetchDetails = async () => {
                try {
                    setLoading(true);
                    const response = await rideAPI.getBookingById(bookingId as string);
                    console.log("📄 Booking Details Fetched:", response);
                    if (response && response.success) {
                        if (response.booking) setBookingDetails(response.booking);
                        else if (response.data) setBookingDetails(response.data);
                    }
                } catch (error) {
                    console.error("Error fetching booking details:", error);
                    Alert.alert("Error", "Failed to load booking details");
                } finally {
                    setLoading(false);
                }
            };

            fetchDetails();
        } else {
            setLoading(false);
        }
    }, [bookingId]);

    // Package Time Logic
    useEffect(() => {
        const rId = bookingDetails?.ride_id || bookingDetails?.rideId || params.rideId;
        if (!rId) return;

        const fetchPackageTime = async () => {
            try {
                const res = await rideAPI.getPackageTime(rId);
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
                const res = await rideAPI.getPackageTime(rId);
                if (res?.remainingMinutes !== undefined) {
                    setRemainingMinutes(res.remainingMinutes);
                }
            } catch { }
        }, 60000);

        return () => clearInterval(interval);
    }, [bookingDetails, params.rideId]);

    // Combine params and fetched data. Fetched data takes precedence but fallback to params.
    const data = { ...params, ...(bookingDetails || {}) };

    // Derived Driver Data (Merge API details and Live Payload)
    const driverData = liveRidePayload ? {
        driver_name: liveRidePayload.driverName,
        driver_phone: liveRidePayload.driverPhone,
        vehicle_number: liveRidePayload.vehicleNumber,
        vehicle_model: liveRidePayload.vehicleModel,
        dpUrl: liveRidePayload.dpUrl,
        // live payload might differ, adjust if needed
    } : bookingDetails;

    // Mappings
    const finalBookingCode = data.booking_code || data.bookingCode || data.bookingId || data.id || bookingId;
    const finalStatus = data.status || "Upcoming"; // Status not in 'data', assume active
    const finalVehicleType = data.vehicle_type || data.vehicleType || data.rideType || "Vehicle";
    const finalDistance = parseFloat((data.distance_km || data.distanceKm || data.distance || '0').toString());
    const finalDuration = parseFloat((data.duration_min || data.durationMin || data.duration || '0').toString());
    const finalPickup = data.pickup_address || data.pickupAddress || data.fromLocation || "";
    const finalDrop = data.drop_address || data.dropAddress || data.toLocation || "";
    const finalFare = parseFloat((data.fare || data.totalFare || '0').toString());
    const finalPaymentMethod = data.payment_method || data.paymentMethod || data.paymentMethod || "Cash";
    const finalScheduledAt = data.scheduled_at || data.scheduledAt || data.ride_date || data.rideDate;

    // Display Status Override for Confirmation Flow
    let displayStatusTitle = "Booking Confirmed";
    let displayStatusSubtitle = "Your ride is scheduled.";

    const statusKey = (statusStage === 'searching' || finalStatus?.toLowerCase() === 'searching' || finalStatus?.toLowerCase() === 'requested')
        ? 'searching'
        : statusStage;

    if (statusKey === 'searching') {
        displayStatusTitle = "Waiting for Driver";
        displayStatusSubtitle = "We are assigning a driver for your ride...";
    } else if (statusKey === 'assigned') {
        displayStatusTitle = "Driver Assigned";
        displayStatusSubtitle = "Driver is en route.";
    }

    // Parse breakdown if it comes as string (Expo Router sometimes flattens objects)
    let fareBreakdown: any = {};
    if (bookingDetails) {
        // API structure
        fareBreakdown = {
            tripFare: data.trip_fare,
            tollCharges: data.toll_charges,
            convenienceFee: data.convenience_fee,
            taxesFees: data.taxes_fees
        };
    } else if (typeof data.breakdown === 'string') {
        try {
            fareBreakdown = JSON.parse(data.breakdown);
        } catch (e) { fareBreakdown = {}; }
    } else if (typeof data.breakdown === 'object') {
        fareBreakdown = data.breakdown || {};
    }

    const parseLocalDateTime = (dt: string) => {
        if (!dt) return null;
        const cleaned = dt.replace(/\.000Z$/, '').replace(/Z$/, '');
        const d = new Date(cleaned);
        return isNaN(d.getTime()) ? null : d;
    };

    const formattedDate = finalScheduledAt
        ? (() => {
            const d = parseLocalDateTime(finalScheduledAt as string);
            return d
                ? d.toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
                : "Date not available";
        })()
        : "Date not available";


    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10 }}>Loading details...</Text>
            </View>
        )
    }

    // Track Ride Navigation Logic
    const handleTrackRide = () => {
        if (liveRidePayload) {
            const trackerParams = {
                rideId: liveRidePayload.rideId,
                pickupLatLng: JSON.stringify(liveRidePayload.pickupLatLng ?? {}),
                pickupAddress: liveRidePayload.pickupAddress ?? '',
                dropLatLng: JSON.stringify(liveRidePayload.dropoffLatLng ?? {}),
                dropAddress: liveRidePayload.dropoffAddress ?? '',
                expectedOTP: liveRidePayload.otp ?? '0000',
                driverId: liveRidePayload.driverId,
                riderId: user?.id,
                vehicleDetails: JSON.stringify(liveRidePayload.vehicleDetails ?? {}),
                requestId: liveRidePayload.requestId || bookingId,
            };
            console.log("Navigating to Tracker with Live Params:", trackerParams);
            router.push({ pathname: "/(tabs)/RiderRideTracker", params: trackerParams as any });
        } else {
            console.log("Navigating to Tracker with Basic ID:", bookingId);
            const rideId = bookingDetails?.ride_id || bookingDetails?.rideId || data.rideId;
            router.push({ pathname: "/(tabs)/RiderRideTracker", params: { rideId: rideId || bookingId } });
        }
    };

    const shouldShowTrackButton =
        ['inride', 'scheduled', 'upcoming', 'accepted', 'ongoing', 'arrived', 'confirmedandinpickuplocation', 'confirmedandnotstarted', 'confirmedandstarted', 'outstationreturnjourney'].includes((finalStatus || '').toLowerCase()) &&
        (statusStage === 'confirmedAndNotStarted' || statusStage === 'confirmedAndInPickupLocation' || statusStage === 'confirmedAndStarted' || statusStage === 'assigned');

    console.log("🔘 Track Button Debug:", { isConfirmFlow, isFromBookings, isStartupInRide, statusStage, finalStatus, shouldShowTrackButton });

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Status Badge */}
                <View style={[styles.card, styles.statusCard]}>
                    <MaterialCommunityIcons
                        name={statusStage === 'assigned' ? "check-circle" : "clock-outline"}
                        size={40}
                        color={statusStage === 'assigned' ? "#4CAF50" : "#FFC107"}
                    />
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusTitle}>{displayStatusTitle}</Text>
                        <Text style={styles.statusSubtitle}>{displayStatusSubtitle}</Text>
                    </View>
                </View>

                {/* Vehicle & Booking Info */}
                <View style={styles.card}>
                    <View style={styles.vehicleHeader}>
                        <View style={styles.vehicleIcon}>
                            <MaterialCommunityIcons name="car-estate" size={28} color="#333" />
                        </View>
                        <View style={styles.vehicleDetails}>
                            <Text style={styles.vehicleName}>{finalVehicleType}</Text>
                            <Text style={styles.bookingCode}>ID: {finalBookingCode}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: finalStatus === 'Completed' ? '#E8F5E9' : '#E3F2FD' }]}>
                            <Text style={[styles.badgeText, { color: finalStatus === 'Completed' ? '#2E7D32' : '#1565C0' }]}>{finalStatus}</Text>
                        </View>
                    </View>
                    <View style={styles.tripMetaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="speedometer-outline" size={16} color="#666" />
                            <Text style={styles.tripMetaText}>{finalDistance.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.tripMetaText}>{Math.round(finalDuration)} min</Text>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.tripMetaText}>{formattedDate.split(',')[0]}</Text>
                        </View>
                    </View>
                </View>

                {/* Route Timeline */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Route</Text>
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <View style={styles.dotPickup} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.timelineLabel}>Pickup</Text>
                            <Text style={styles.timelineDate}>{formattedDate}</Text>
                            <Text style={styles.timelineAddress} numberOfLines={2}>{finalPickup}</Text>
                        </View>
                    </View>
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <View style={styles.dotDrop} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.timelineLabel}>Drop</Text>
                            <Text style={styles.timelineAddress} numberOfLines={2}>{finalDrop}</Text>
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

                {/* Driver Details (Only if available) */}
                {driverData && (driverData.driver_name || driverData.driverName) && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Driver Details</Text>
                        <View style={styles.driverRow}>
                            <View style={styles.driverIconBg}>
                                {(driverData.dpUrl || driverData.dp_url) ? (
                                    <Image
                                        source={{ uri: `${DP_BASE_URL}${driverData.dpUrl || driverData.dp_url}` }}
                                        style={styles.driverImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="person" size={24} color="#666" />
                                )}
                            </View>
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverName}>{driverData.driver_name || driverData.driverName}</Text>
                                <Text style={styles.driverVehicle}>
                                    {(driverData.vehicle_model || driverData.vehicleModel) ? `${driverData.vehicle_model || driverData.vehicleModel} • ` : ''}
                                    {driverData.vehicle_number || driverData.vehicleNumber || "Vehicle No. N/A"}
                                </Text>
                            </View>
                            {(driverData.driver_phone || driverData.driverPhone) && (
                                <TouchableOpacity
                                    style={styles.callButton}
                                    onPress={() => Alert.alert("Call", `Dialing ${driverData.driver_phone || driverData.driverPhone}`)}
                                >
                                    <Ionicons name="call" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Fare Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment</Text>
                    <View style={styles.totalFareRow}>
                        <View>
                            <Text style={styles.totalFareLabel}>Total Fare</Text>
                            <Text style={styles.includeText}>(Incl. taxes)</Text>
                        </View>
                        <Text style={styles.totalFareAmount}>₹{finalFare}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.paymentMethodRow}>
                        <View style={styles.paymentIconBg}>
                            <MaterialCommunityIcons name="cash" size={20} color="#333" />
                        </View>
                        <Text style={styles.paymentMethodText}>{finalPaymentMethod} Payment</Text>
                    </View>

                    {/* Voucher / Discount Section */}
                    {(data.appliedVoucherCode || data.discountAmount > 0) && (
                        <View style={styles.voucherSection}>
                            <View style={styles.divider} />
                            <View style={styles.breakdownRow}>
                                <View style={styles.voucherInfo}>
                                    <Ionicons name="pricetag" size={16} color="#4CAF50" />
                                    <Text style={styles.voucherCodeText}>
                                        Voucher {data.appliedVoucherCode ? `(${data.appliedVoucherCode})` : 'Applied'}
                                        {data.discountPercent ? ` - ${data.discountPercent}% OFF` : ''}
                                    </Text>
                                </View>
                                <Text style={styles.discountAmountText}>-₹{data.discountAmount}</Text>
                            </View>
                        </View>
                    )}

                    {(fareBreakdown.tripFare !== undefined || fareBreakdown.tollCharges > 0 || fareBreakdown.details) && (
                        <View style={styles.breakdownContainer}>
                            <View style={styles.divider} />
                            {fareBreakdown.tripFare !== undefined && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Trip Fare</Text>
                                    <Text style={styles.breakdownValue}>₹{fareBreakdown.tripFare}</Text>
                                </View>
                            )}
                            {fareBreakdown.tollCharges > 0 && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Toll Charges</Text>
                                    <Text style={styles.breakdownValue}>₹{fareBreakdown.tollCharges}</Text>
                                </View>
                            )}
                            {fareBreakdown.convenienceFee > 0 && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Convenience Fee</Text>
                                    <Text style={styles.breakdownValue}>₹{fareBreakdown.convenienceFee}</Text>
                                </View>
                            )}
                            {fareBreakdown.taxesFees > 0 && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Taxes & Fees</Text>
                                    <Text style={styles.breakdownValue}>₹{fareBreakdown.taxesFees}</Text>
                                </View>
                            )}
                            {/* If detailed breakdown is available (stacked packages) */}
                            {Array.isArray(fareBreakdown.details) && fareBreakdown.details.map((item: any, idx: number) => (
                                <View key={idx} style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                                    <Text style={styles.breakdownValue}>₹{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Info Message */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={22} color="#1565C0" style={{ marginRight: 10 }} />
                    <Text style={styles.infoText}>
                        Cab and driver details regarding your ride will be shared 15-20 minutes prior to your scheduled pickup time.
                    </Text>
                </View>

            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
                {shouldShowTrackButton && (
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={handleTrackRide}
                    >
                        <Ionicons name="map-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.trackButtonText}>Track Ride</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelButton} onPress={() => setCancelModalVisible(true)}>
                    <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                </TouchableOpacity>
            </View>

            {/* Cancel Modal */}
            <Modal
                transparent
                visible={isCancelModalVisible}
                animationType="fade"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="warning" size={32} color="#000" />
                        </View>
                        <Text style={styles.modalTitle}>Cancel Ride?</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to cancel this ride request?
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setCancelModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>No, Keep</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={async () => {
                                    setCancelModalVisible(false);
                                    try {
                                        setCancelling(true);
                                        const idToCancel = data.requestId || bookingId || finalBookingCode;
                                        if (!idToCancel) {
                                            Alert.alert("Error", "Missing Booking ID");
                                            setCancelling(false);
                                            return;
                                        }
                                        const res = await rideAPI.cancelRide(idToCancel as string);
                                        if (res.success) {
                                            router.replace("/(tabs)");
                                        } else {
                                            Alert.alert("Failed", res.message || "Could not cancel ride");
                                        }
                                    } catch (error) {
                                        console.error("Cancel Error:", error);
                                        Alert.alert("Error", "Something went wrong.");
                                    } finally {
                                        setCancelling(false);
                                    }
                                }}
                            >
                                <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#000',
        paddingTop: 10,
        marginHorizontal: 16,
        borderRadius: 52,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sendButton: {
        padding: 8,
    },
    timerBox: {
        marginTop: 10,
        marginBottom: 10,
        padding: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        alignItems: "center",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginHorizontal: 16, // Use margin to match cards if needed, but this is inside ScrollView so maybe not needed if it handles padding. 
        // Wait, other cards have marginBottom 16.
        // Let's match the card style if possible OR allow it to be a standalone box.
        // The user styling: backgroundColor: "#f2f2f2".
        // I should stick to user styling but adjust for this screen.
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50', // Dynamic based on status? maintained green for now
    },
    statusTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statusSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    vehicleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    vehicleDetails: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    bookingCode: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tripMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tripMetaText: {
        fontSize: 13,
        color: '#444',
        fontWeight: '600',
    },
    verticalLine: {
        width: 1,
        height: 16,
        backgroundColor: '#eee',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    timelineItem: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
    dotPickup: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        marginTop: 6,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    dotDrop: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F44336',
        marginTop: 6,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 24,
    },
    timelineLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    timelineDate: {
        fontSize: 13,
        color: '#1a1a1a',
        fontWeight: '600',
        marginBottom: 4,
    },
    timelineAddress: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    // Driver
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverImage: {
        width: '100%',
        height: '100%',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 14,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    driverVehicle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    // Payment
    totalFareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalFareLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    includeText: {
        fontSize: 11,
        color: '#888',
    },
    totalFareAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    breakdownContainer: {
        marginTop: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    breakdownLabel: {
        fontSize: 13,
        color: '#666',
    },
    breakdownValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'flex-start',
        borderLeftWidth: 4,
        borderLeftColor: '#1565C0',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#0D47A1',
        lineHeight: 20,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    trackButton: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    trackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFEBEE',
        backgroundColor: '#FFEBEE',
    },
    cancelButtonText: {
        color: '#D32F2F',
        fontSize: 15,
        fontWeight: '700',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        width: "85%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFEBEE',
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: '#1a1a1a' },
    modalText: { color: '#666', textAlign: "center", marginBottom: 24, fontSize: 15, lineHeight: 22 },
    modalButtons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalCancelText: { fontWeight: "600", color: '#333' },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#D32F2F',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalConfirmText: { color: '#fff', fontWeight: "700" },
    voucherSection: {
        marginTop: 4,
    },
    voucherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    voucherCodeText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '700',
    },
    discountAmountText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '700',
    },
    timerBox: {
        marginTop: 10,
        marginBottom: 10,
        padding: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        alignItems: "center",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginHorizontal: 16,
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
