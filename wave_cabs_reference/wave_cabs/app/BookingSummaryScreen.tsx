import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './context/AuthContext';
import { useMaintenance } from './context/MaintenanceContext';
import { packagesAPI, rideAPI, voucherAPI } from './services/api';

const { width, height } = Dimensions.get('window');

// Helper to consistency normalize AC type
function normalizeAcType(ac_type: string): string {
    if (typeof ac_type !== "string") return "";
    const val = ac_type.trim().toLowerCase();
    if (val === "ac") return "AC";
    if (val === "non-ac" || val === "nonac" || val === "non ac") return "Non-AC";
    return ac_type;
}

export default function BookingSummaryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const auth = useAuth() as any;
    const user = auth?.user;
    const insets = useSafeAreaInsets();

    const {
        rideType, // e.g., "sedan"
        vehicleType, // e.g. "Sedan" (display name)
        seatInfo,
        scheduledAt, // "now" or "later"
        pickupAddress,
        dropAddress,
        distanceKm,
        durationMin,
        packageId,
        acType,
        paymentMethod,
        tripType, // "oneway" or "round"
        pickupDateTime, // Specific date/time string
        dropEstimatedDateTime
    } = params;

    // Helper to extract string from param
    const getParamStr = (param: string | string[] | undefined) => Array.isArray(param) ? param[0] : param;

    const pickupDateTimeStr = getParamStr(pickupDateTime);
    const dropEstimatedDateTimeStr = getParamStr(dropEstimatedDateTime);

    // Parse numeric params safely
    const distKm = parseFloat(getParamStr(distanceKm) as string) || 0;
    const durMin = parseFloat(getParamStr(durationMin) as string) || 0;
    const isRoundTrip = getParamStr(tripType) === 'round';

    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    const [fareDetails, setFareDetails] = useState({
        baseFare: 0,
        extraKmFare: 0,
        extraTimeFare: 0,
        totalFare: 0,
        tollCharges: 150, // Approx placeholder
        taxesFees: 0,
        convenienceFee: 50, // Approx placeholder
        nightCharge: 0,
        tripKm: 0,
        extraKm: 0,
        breakdown: [] as any[],
        discountAmount: 0,
        discountPercent: 0,
    });

    const [vouchers, setVouchers] = useState<any[]>([]);
    const [vouchersLoading, setVouchersLoading] = useState(false);
    const [appliedOffer, setAppliedOffer] = useState<any>(null);
    const [showOffersModal, setShowOffersModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState("");

    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const pRes = await packagesAPI.fetchAll();
            setPackages(pRes || []);

            // If couponCode passed from previous screen, fetch vouchers and try to auto-apply
            if (user?.id && rideType) {
                setVouchersLoading(true);
                const vRes = await voucherAPI.getAvailableVouchers(user.id, rideType as string);
                if (vRes?.vouchers) {
                    setVouchers(vRes.vouchers);
                    const initialCode = getParamStr(params.couponCode);
                    if (initialCode) {
                        const offer = vRes.vouchers.find((v: any) => v.code === initialCode);
                        if (offer) setAppliedOffer(offer);
                    }
                }
                setVouchersLoading(false);
            }
        } catch (error) {
            console.error("Error fetching dependencies:", error);
            // Alert.alert("Error", "Failed to load pricing details.");
        } finally {
            setLoading(false);
        }
    };

    function applyOffer(item: any) {
        if (item.minRideFare && fareDetails.totalFare < item.minRideFare) {
            Alert.alert("Invalid Offer", `This voucher is valid only for rides above ₹${item.minRideFare}`);
            return;
        }
        setAppliedOffer(item);
        setShowOffersModal(false);
    }

    function formatVoucherTitle(voucher: any) {
        if (voucher.discountPercent) {
            return `${voucher.discountPercent}% off`;
        }
        return voucher.description || "Special Offer";
    };

    useEffect(() => {
        if (packages.length > 0 && !loading) {
            calculateFare();
        } else if (!loading) {
            setCalculating(false);
        }
    }, [packages, distKm, durMin, tripType, packageId, rideType, acType, pickupDateTimeStr, loading]);

    const calculateFare = () => {
        setCalculating(true);
        if (!packages || packages.length === 0) {
            setCalculating(false);
            return;
        }

        let pkg = null;
        if (packageId) {
            pkg = packages.find((p: any) => p.id == packageId);
        }

        // Fallback: If no packageId passed
        if (!pkg && rideType) {
            const tripKm = isRoundTrip ? distKm * 2 : (distKm * 2) - 15;
            const matchingPkgs = packages
                .filter((p: any) =>
                    p.vehicle_type?.toLowerCase() === (rideType as string)?.toLowerCase() &&
                    p.type === "outstation" &&
                    normalizeAcType(p.ac_type) === normalizeAcType(acType as string)
                )
                .sort((a: any, b: any) => Number(a.kms) - Number(b.kms));

            if (matchingPkgs.length > 0) {
                const coveringPkg = matchingPkgs.find((p: any) => Number(p.kms) >= tripKm);
                pkg = coveringPkg || matchingPkgs[matchingPkgs.length - 1];
            }
        }

        if (pkg) {
            setSelectedPackage(pkg);

            const usefulPkgs = packages
                .filter((p: any) =>
                    p.vehicle_type?.toLowerCase() === (rideType as string)?.toLowerCase() &&
                    p.type === "outstation" &&
                    normalizeAcType(p.ac_type) === normalizeAcType(acType as string)
                )
                .sort((a: any, b: any) => Number(b.kms) - Number(a.kms)); // Descending

            // Consolidated Trip KM Calculation: isRoundTrip uses 2x distKm, OneWay uses (distKm + distKm-15)
            const totalTripKm = isRoundTrip ? (distKm * 2) : (distKm + Math.max(0, distKm - 15));

            // Find the best base package: the largest package where kms <= totalTripKm
            const basePkg = usefulPkgs.find((p: any) => Number(p.kms) <= totalTripKm) || usefulPkgs[usefulPkgs.length - 1];

            if (basePkg) {
                const bKm = Number(basePkg.kms);
                const bFare = Number(basePkg.basefare);
                const eRate = Number(basePkg.extra_rate_per_km);

                const eKm = Math.max(0, totalTripKm - bKm);
                const eKmFare = Math.round(eKm * eRate);

                // Calculate Extra Time (Waiting/Allowance)
                const totalDurationHr = durMin / 60;
                const eHr = Math.max(0, totalDurationHr - Number(basePkg.hr));
                const eMin = eHr * 60;
                const eTimeFare = eMin > 0 ? Math.round(eMin * Number(basePkg.waiting_charge)) : 0;

                const tFare = bFare + eKmFare + eTimeFare;

                let currentBreakdown: any[] = [];
                currentBreakdown.push({ type: 'header', label: 'Trip Fare', value: tFare });
                currentBreakdown.push({ type: 'row', label: `${bKm} km Package`, value: bFare });
                if (eKm > 0) {
                    currentBreakdown.push({ type: 'row', label: `Extra ${eKm.toFixed(1)} km`, value: eKmFare });
                }
                if (eTimeFare > 0) {
                    currentBreakdown.push({ type: 'row', label: 'Driver Allowance', value: eTimeFare });
                }

                // Night Charge Logic
                let nCharge = 0;
                if (pickupDateTimeStr) {
                    const d = new Date(pickupDateTimeStr);
                    const hour = d.getHours();
                    if (hour >= 22 || hour < 5) {
                        nCharge = Math.round(tFare * 0.30);
                    }
                }

                const taxAmount = tFare + nCharge;
                const tFees = Math.round(taxAmount * 0.05); // Updated to 5% GST as per client request
                const totalF = tFare + nCharge + tFees;

                setFareDetails({
                    baseFare: bFare,
                    extraKmFare: eKmFare,
                    extraTimeFare: eTimeFare,
                    tollCharges: 0,
                    convenienceFee: 0,
                    taxesFees: tFees,
                    nightCharge: nCharge,
                    totalFare: totalF,
                    tripKm: bKm,
                    extraKm: eKm,
                    breakdown: currentBreakdown,
                    discountAmount: 0,
                    discountPercent: 0,
                });
            }
        }
        setCalculating(false);
    };

    const [confirming, setConfirming] = useState(false);

    const { maintenance } = useMaintenance();

    const handleConfirmBooking = async () => {
        if (maintenance.mode !== 'none') {
            Alert.alert(
                "Booking Temporarily Disabled",
                maintenance.message || "Booking is disabled due to maintenance"
            );
            return;
        }

        if (!user?.id) {
            Alert.alert("Error", "User not logged in.");
            return;
        }
        if (calculating || !selectedPackage) {
            Alert.alert("Please Wait", "Still calculating fare details...");
            return;
        }

        const payload = {
            user_id: user.id,
            rideType: "outstation", // Enforce outstation
            vehicleType: Array.isArray(vehicleType) ? vehicleType[0] : vehicleType, // Safe string
            pickupAddress: Array.isArray(pickupAddress) ? pickupAddress[0] : pickupAddress,
            dropAddress: Array.isArray(dropAddress) ? dropAddress[0] : dropAddress,
            origin: typeof params.origin === 'string' ? JSON.parse(params.origin) : params.origin,
            destination: typeof params.destination === 'string' ? JSON.parse(params.destination) : params.destination,
            scheduledAt: (() => {
                if (!pickupDateTimeStr) return null;
                const d = new Date(pickupDateTimeStr);
                if (isNaN(d.getTime())) return pickupDateTimeStr;
                const pad = (n: number) => n.toString().padStart(2, '0');
                const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                console.log("Formatted scheduledAt (Local):", formatted);
                return formatted;
            })(),
            distanceKm: distKm,
            durationMin: durMin,
            packageId: selectedPackage.id,
            paymentMethod: Array.isArray(paymentMethod) ? paymentMethod[0] : paymentMethod,
            tripType, // Pass trip type
            acType: Array.isArray(acType) ? acType[0] : acType, // Pass AC type
            coupon_code: appliedOffer?.code || getParamStr(params.couponCode) || null,
            finalFare: fareDetails.totalFare, // Pass calculated total
            fareBreakdown: JSON.stringify({
                baseFare: fareDetails.baseFare,
                extraKmFare: fareDetails.extraKmFare,
                extraTimeFare: fareDetails.extraTimeFare,
                taxesFees: fareDetails.taxesFees,
                nightCharge: fareDetails.nightCharge,
                totalFare: fareDetails.totalFare,
                tripKm: fareDetails.tripKm,
                extraKm: fareDetails.extraKm,
                details: fareDetails.breakdown // Pass detailed row items
            })
        };

        console.log("Payload: " + payload.fareBreakdown);

        if (!payload.scheduledAt) {
            Alert.alert("Date Error", "Please select a valid pickup date and time.");
            return;
        }

        try {
            setConfirming(true);
            const response = await rideAPI.outstationConfirm(payload);
            console.log("✅ Outstation Booking Confirmed:", response);

            if (response && (response.status === 'success' || response.bookingId)) {
                const bookingStatus = response.status === 'success' ? 'upcoming' : response.status;
                router.replace({
                    pathname: "/RideDetailsScreen",
                    params: {
                        source: 'confirm',
                        bookingId: response.requestId || response.bookingId,
                        bookingCode: response.bookingCode,
                        requestId: response.requestId,
                        status: bookingStatus,
                        scheduledAt: response.scheduledAt || pickupDateTimeStr,
                        rideType: 'outstation',
                        vehicleType: payload.vehicleType,
                        distanceKm: payload.distanceKm,
                        durationMin: payload.durationMin,
                        pickupAddress: payload.pickupAddress,
                        dropAddress: payload.dropAddress,
                        fare: response.finalFare || fareDetails.totalFare,
                        discountPercent: response.discountPercent,
                        discountAmount: response.discountAmount,
                        appliedVoucherCode: response.appliedVoucherCode,
                        breakdown: response.fareBreakdown || JSON.stringify(response.breakdown || {
                            tripFare: fareDetails.baseFare + fareDetails.extraKmFare + fareDetails.extraTimeFare,
                            tollCharges: fareDetails.tollCharges,
                            convenienceFee: fareDetails.convenienceFee,
                            taxesFees: fareDetails.taxesFees
                        }),
                        paymentMethod: payload.paymentMethod
                    }
                });
            } else {
                throw new Error(response?.message || "Booking failed");
            }

        } catch (error: any) {
            console.error("❌ Outstation Confirm Error:", error);
            Alert.alert("Booking Failed", error.message || "Something went wrong.");
        } finally {
            setConfirming(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Booking</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Vehicle Row */}
                <View style={styles.card}>
                    <View style={styles.vehicleRow}>
                        <View style={styles.vehicleInfo}>
                            <View style={styles.vehicleIconWrapper}>
                                <MaterialCommunityIcons name="car-estate" size={32} color="#333" />
                            </View>
                            <View>
                                <Text style={styles.vehicleName}>{vehicleType || "Vehicle"} • {seatInfo || "4 Seater"}</Text>
                                <Text style={styles.vehicleType}>{rideType}</Text>
                            </View>
                        </View>
                        <View style={styles.schedulingInfo}>
                            <Ionicons name="calendar-outline" size={16} color="#4CAF50" style={{ marginBottom: 4 }} />
                            <Text style={styles.schedulingTime}>
                                {pickupDateTimeStr
                                    ? new Date(pickupDateTimeStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : "Today"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Timeline - Refined 3-Column Layout for Perfect Alignment */}
                <View style={[styles.card, styles.timelineCard]}>
                    <Text style={styles.cardTitle}>Route</Text>

                    {/* Pickup Row */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.timeText}>{pickupDateTimeStr ? new Date(pickupDateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={styles.dotPickup} />
                            <View style={styles.timelineLine} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.addressLabel}>PICKUP</Text>
                            <Text style={styles.addressText} numberOfLines={2}>{pickupAddress}</Text>
                        </View>
                    </View>

                    {/* Drop Row */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.timeText}>{dropEstimatedDateTimeStr ? new Date(dropEstimatedDateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={styles.dotDrop} />
                            {/* No line below drop */}
                        </View>
                        <View style={[styles.timelineRight, { borderBottomWidth: 0 }]}>
                            <Text style={styles.addressLabel}>DROP</Text>
                            <Text style={styles.addressText} numberOfLines={2}>{dropAddress}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment & Fare Breakdown */}
                <View style={styles.card}>
                    <View style={styles.totalFareContainer}>
                        <Text style={styles.totalFareLabel}>Total Fare</Text>
                        {calculating ? (
                            <ActivityIndicator color="#000" style={{ marginVertical: 8 }} />
                        ) : (
                            <Text style={styles.totalFareText}>₹{fareDetails.totalFare}</Text>
                        )}
                        <Text style={styles.includeText}>(Incl. taxes & fees)</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.paymentMethodRow}>
                        <View style={styles.paymentIconBg}>
                            <MaterialCommunityIcons name="cash" size={20} color="#333" />
                        </View>
                        <Text style={styles.paymentMethodText}>{paymentMethod || "Cash"} Payment</Text>
                        {/* Change button removed as requested */}
                    </View>

                    <View style={styles.breakdownContainer}>
                        <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
                            <TouchableOpacity onPress={() => setShowOffersModal(true)}>
                                <Text style={styles.applyOfferText}>
                                    {appliedOffer ? `Applied: ${appliedOffer.code}` : (getParamStr(params.couponCode) ? `Applied: ${getParamStr(params.couponCode)}` : "Apply Offers")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {calculating ? <ActivityIndicator size="small" color="#888" /> : (
                            <>
                                {fareDetails.breakdown?.map((item, index) => {
                                    if (item.type === 'header') {
                                        return (
                                            <View key={index} style={styles.breakdownHeaderRow}>
                                                <Text style={styles.breakdownHeaderLabel}>{item.label}</Text>
                                                {item.value !== undefined && (
                                                    <Text style={styles.breakdownHeaderValue}>₹{item.value}</Text>
                                                )}
                                            </View>
                                        );
                                    }
                                    return (
                                        <View key={index} style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>{item.label}</Text>
                                            <Text style={styles.breakdownValue}>₹{item.value}</Text>
                                        </View>
                                    );
                                })}

                                {fareDetails.nightCharge > 0 && (
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>Night Charge</Text>
                                        <Text style={styles.breakdownValue}>₹{fareDetails.nightCharge}</Text>
                                    </View>
                                )}

                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>GST (18%)</Text>
                                    <Text style={styles.breakdownValue}>₹{fareDetails.taxesFees}</Text>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.warningBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#D84315" />
                        <Text style={styles.warningText}>
                            Toll charges, parking fees, and state taxes are excluded and payable directly.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.confirmButton, (confirming || maintenance.mode !== 'none') && { opacity: 0.5 }]}
                    onPress={handleConfirmBooking}
                    disabled={confirming || maintenance.mode !== 'none'}
                >
                    {confirming ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>
            {/* Offers Modal */}
            <Modal
                visible={showOffersModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowOffersModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderModal}>
                            <Text style={styles.modalTitleModal}>Available Offers</Text>
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
                                const isValid = !item.minRideFare || fareDetails.totalFare >= item.minRideFare;
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
                                            <Text style={styles.offerTitle}>{formatVoucherTitle(item)}</Text>
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
                                            value={couponCodeInput}
                                            onChangeText={setCouponCodeInput}
                                            placeholderTextColor="#888888"
                                            autoCapitalize="characters"
                                        />
                                        <TouchableOpacity
                                            style={styles.couponApplyBtn}
                                            onPress={() => {
                                                if (couponCodeInput) {
                                                    setAppliedOffer({ code: couponCodeInput });
                                                    setShowOffersModal(false);
                                                }
                                            }}
                                        >
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
        backgroundColor: '#F8F9FA',
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
        paddingBottom: 100,
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
    vehicleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIconWrapper: {
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
    vehicleName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    vehicleType: {
        fontSize: 14,
        color: '#666',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    schedulingInfo: {
        alignItems: 'flex-end',
    },
    schedulingTime: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    applyOfferText: {
        fontSize: 12,
        color: '#1a1a1a',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    timelineCard: {
        paddingVertical: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 70, // Ensure space for line
    },
    // New 3-Column Layout Styles
    timelineLeft: {
        width: 60,
        alignItems: 'flex-end',
        marginRight: 10,
        paddingTop: 2, // Align text with dot
    },
    timelineCenter: {
        width: 20,
        alignItems: 'center',
        // No top padding, dot determines top
    },
    timelineRight: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        paddingBottom: 20,
        paddingRight: 8,
        // No top padding
    },
    timeText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
        lineHeight: 18,
    },
    dotPickup: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 2,
        marginTop: 4, // Visual adjust
    },
    dotDrop: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#F44336',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 2,
        marginTop: 4,
    },
    timelineLine: {
        width: 2,
        backgroundColor: '#e0e0e0',
        flex: 1, // Fill vertical space between dots
        marginVertical: -2, // Connects perfectly
    },
    addressLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
        marginTop: 4, // Align label with dot
    },
    addressText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        fontWeight: '500',
    },
    totalFareContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    totalFareText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    totalFareLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginBottom: 4,
    },
    includeText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FAFAFA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    paymentIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        flex: 1,
    },
    // changeButton removed
    breakdownContainer: {
        marginTop: 8,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    breakdownTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#555',
    },
    breakdownHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    breakdownHeaderLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textTransform: 'uppercase',
    },
    breakdownHeaderValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    subLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: -4,
        marginBottom: 8,
    },
    warningBox: {
        flexDirection: 'row',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        alignItems: 'flex-start',
    },
    warningText: {
        color: '#D84315',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    confirmButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Offers Modal Styles
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
    modalHeaderModal: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitleModal: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    closeButton: {
        padding: 4,
    },
    offerItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#eee",
    },
    offerItemApplied: {
        borderColor: "#000",
        backgroundColor: "#f9f9f9",
    },
    offerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    offerDetails: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },
    offerCode: {
        fontSize: 12,
        color: "#666",
    },
    appliedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    appliedText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 4,
    },
    applyButton: {
        backgroundColor: "#000",
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    applyButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    couponInputContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        marginTop: 10,
    },
    couponTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 10,
    },
    couponInputRow: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 12,
        overflow: "hidden",
    },
    couponInput: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: "#333",
    },
    couponApplyBtn: {
        backgroundColor: "#000",
        paddingHorizontal: 20,
        justifyContent: "center",
    },
    couponApplyText: {
        color: "#fff",
        fontWeight: "600",
    },
    noVouchersText: {
        textAlign: 'center',
        color: '#888',
        padding: 20
    }
});
