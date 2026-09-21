import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserBookings } from '../hooks/useUserBookings';
import { useAuth } from './context/AuthContext';

export default function BookingsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const auth = useAuth();
    const user = auth?.user;
    const insets = useSafeAreaInsets();

    // Data Fetching
    const { bookings: allBookings, loading, refetch } = useUserBookings(user?.id);
    const [refreshing, setRefreshing] = useState(false);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>(
        (params.filter as 'All' | 'Scheduled' | 'Completed' | 'Cancelled') || 'All'
    );

    // Update tab if param changes (e.g. navigation from home)
    useEffect(() => {
        if (params.filter) {
            setActiveTab(params.filter as any);
        }
    }, [params.filter]);

    // Filter Logic
    const filteredBookings = useMemo(() => {
        if (!allBookings) return [];

        return allBookings.filter((booking: any) => {
            const status = booking.status?.toLowerCase() || '';
            const matchesSearch =
                booking.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.pickup_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.dropoff_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.drop_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (activeTab === 'All') return true;
            if (activeTab === 'Scheduled') {
                return status === 'scheduled' || status === 'upcoming' || status === 'searching' || status === 'payment';
            }
            if (activeTab === 'Completed') return status === 'completed';
            if (activeTab === 'Cancelled') return status === 'cancelled';

            return true;
        });
    }, [allBookings, searchQuery, activeTab]);

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handlePressBooking = (booking: any) => {
        router.push({
            pathname: "/RideDetailsScreen",
            params: {
                source: 'bookings',
                bookingId: String(booking.request_id || booking.id),
                scheduledAt: booking.ride_date || booking.scheduled_at
            }
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'upcoming':
            case 'scheduled':
            case 'searching':
                return '#2196F3'; // Blue
            case 'completed':
                return '#4CAF50'; // Green
            case 'cancelled':
                return '#F44336'; // Red
            case 'payment':
                return '#FF9800'; // Orange
            default:
                return '#757575'; // Grey
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePressBooking(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.vehicleRow}>
                    <View style={styles.iconBg}>
                        <MaterialCommunityIcons name="car" size={20} color="#333" />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.vehicleType}>{item.vehicle_type || "Cab"}</Text>
                        <Text style={styles.bookingCode}>{item.booking_code || `ID: ${item.id}`}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status?.toUpperCase() || "UNKNOWN"}
                    </Text>
                </View>
            </View>

            <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateText}>
                    {formatDate(item.ride_date || item.scheduled_at)}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.pickup_location || item.pickup_address}
                    </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.dropoff_location || item.drop_address}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.fareText}>₹{item.fare || "0"}</Text>
                <View style={styles.paymentMethod}>
                    <MaterialCommunityIcons name="cash" size={16} color="#666" />
                    <Text style={styles.paymentText}>{item.payment_method || "Cash"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffe7e7ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search by ID, Location..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.input}
                        placeholderTextColor="#999"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    data={['All', 'Scheduled', 'Completed', 'Cancelled']}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveTab(item as any)}
                            style={[
                                styles.tabItem,
                                activeTab === item && styles.activeTabItem
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === item && styles.activeTabText
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-text-outline" size={64} color="#ddd" />
                            <Text style={styles.emptyTitle}>No bookings found</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : `You have no ${activeTab.toLowerCase()} bookings`}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#000000ff',
        paddingTop: 10,
        marginHorizontal: 16,
        borderRadius: 52,
        marginBottom: 20,

    },
    backButton: {
        marginRight: 16,
        padding: 4,
        color: '#ffffffff',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffffff',
        textAlign: 'center',
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    tabsContainer: {
        backgroundColor: '#fff',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    activeTabItem: {
        backgroundColor: '#1a1a1a',
        borderColor: '#1a1a1a',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    vehicleType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        textTransform: 'capitalize',
        marginBottom: 2,
    },
    bookingCode: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    dateText: {
        fontSize: 13,
        color: '#444',
        marginLeft: 6,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 16,
    },
    routeContainer: {
        marginBottom: 16,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#e0e0e0',
        marginLeft: 4,
        marginVertical: 2,
    },
    addressText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
    },
    fareText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paymentText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 6,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
});
