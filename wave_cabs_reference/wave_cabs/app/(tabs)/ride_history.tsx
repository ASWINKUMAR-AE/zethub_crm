import { ThemedText } from "@/components/ThemedText";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import {
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import { AuthContext } from "../context/AuthContext";
import { rideAPI } from "../services/api";

// ------------------ TYPES ------------------ //

type DurationFilter = "all" | "day" | "week" | "month" | "year";

interface Ride {
  id: string;
  date: string;
  pickup: string;
  dropoff: string;
  amount: string;
  status: string;
  rideType: string;
  driver: string;
  rating: number;
}

interface FilterOption {
  id: string;
  label: string;
  icon: string;
  iconType: "ionicons" | "material" | "fontawesome";
}

// ------------------ THEME ------------------ //

const THEME = {
  PRIMARY_COLOR: "#000",
  BG_COLOR: "#f8fafd",
  CARD_BG: "#fff",
  BORDER_COLOR: "#dcdcdc",
  ICON_BG: "#efefef",
  SUCCESS: "#4CAF50",
  ERROR: "#f44336",
  WARNING: "#FFC107",
  TEXT_PRIMARY: "#1a1a1a",
  TEXT_SECONDARY: "#555",
  TEXT_TERTIARY: "#999",
};

// ------------------ MAIN SCREEN ------------------ //

function RideHistoryScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // VEHICLE FILTER
  const [selectedVehicle, setSelectedVehicle] = useState("all");

  // DURATION FILTER
  const [selectedDuration, setSelectedDuration] =
    useState<DurationFilter>("all");

  // DROPDOWN
  const [showDropdown, setShowDropdown] = useState(false);
  const animated = useRef(new Animated.Value(0)).current;

  const durationOptions = [
    { id: "all", label: "All" },
    { id: "day", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
  ];

  const vehicleFilters: FilterOption[] = [
    { id: "all", label: "All", icon: "list", iconType: "ionicons" },
    { id: "car", label: "Car", icon: "car-sport", iconType: "ionicons" },
    { id: "auto", label: "Auto", icon: "rickshaw", iconType: "material" },
    { id: "bike", label: "Bike", icon: "bicycle", iconType: "ionicons" },
    { id: "premium", label: "Premium", icon: "diamond", iconType: "fontawesome" },
  ];

  // ------------------ FETCH DATA ------------------ //

  const fetchRides = async () => {
    try {
      setIsLoading(true);

      const res = await rideAPI.getRideHistory(user?.id || user?._id);
      const rides = res?.data || [];

      const mapped = rides.map((r: any) => ({
        id: r.id,
        date: r.created_at,
        pickup: r.pickup_location,
        dropoff: r.dropoff_location,
        amount: r.fare ? `₹${r.fare}` : "₹0",
        status: r.status,
        rideType: (r.vehicle_type || "car").toLowerCase(),
        driver: r.driver_name || "",
        rating: r.rating || 5,
      }));

      setRideHistory(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRides();
    }, [])
  );

  // ------------------ FILTER LOGIC ------------------ //

  const filterByDuration = (rides: Ride[]) => {
    if (selectedDuration === "all") return rides;

    const now = new Date();

    return rides.filter((ride) => {
      const d = new Date(ride.date);
      const diffDays =
        (now.getTime() - d.getTime()) / (1000 * 3600 * 24);

      switch (selectedDuration) {
        case "day":
          return d.toDateString() === now.toDateString();
        case "week":
          return diffDays <= 7;
        case "month":
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        case "year":
          return d.getFullYear() === now.getFullYear();
      }
    });
  };

  const finalRides = filterByDuration(
    selectedVehicle === "all"
      ? rideHistory
      : rideHistory.filter((r) => r.rideType === selectedVehicle)
  );

  // ------------------ DROPDOWN ANIMATION ------------------ //

  const toggleDropdown = () => {
    if (!showDropdown) {
      setShowDropdown(true);
      Animated.timing(animated, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animated, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setShowDropdown(false));
    }
  };

  const dropdownStyle = {
    opacity: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: animated.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  // ------------------ ICON RENDERING ------------------ //

  const renderVehicleIcon = (item: FilterOption, active: boolean) => {
    const color = active ? "#fff" : "#000";
    const size = 16;

    switch (item.iconType) {
      case "ionicons":
        return <Ionicons name={item.icon} size={size} color={color} />;
      case "material":
        return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
      case "fontawesome":
        return <FontAwesome5 name={item.icon} size={size} color={color} />;
    }
  };

  // ------------------ RIDE ITEM UI ------------------ //

  const renderRideItem = ({ item }: { item: Ride }) => (
    <View style={styles.rideItem}>

      {/* DATE + AMOUNT */}
      <View style={styles.rideHeader}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <ThemedText style={styles.dateText}>
            {new Date(item.date).toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.amountBox}>
          <ThemedText style={styles.amount}>{item.amount}</ThemedText>
        </View>
      </View>

      {/* PICKUP & DROPOFF */}
      <View style={styles.routeRow}>
        {/* ICONS */}
        <View style={styles.routeIcons}>
          <View style={styles.pickDot} />
          <View style={styles.line} />
          <View style={styles.dropDot} />
        </View>

        {/* TEXTS */}
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.pickupText} numberOfLines={1}>
            {item.pickup}
          </ThemedText>
          <ThemedText style={styles.dropText} numberOfLines={1}>
            {item.dropoff}
          </ThemedText>
        </View>

        {/* VEHICLE ICON */}
        <View style={styles.vehicleIconBox}>
          {renderVehicleIcon(
            vehicleFilters.find((v) => v.id === item.rideType) ||
              vehicleFilters[0],
            false
          )}
        </View>
      </View>

      {/* STATUS */}
      <View style={styles.statusRow}>
        <Ionicons
          name={
            item.status === "completed"
              ? "checkmark-circle"
              : item.status === "cancelled"
              ? "close-circle"
              : "time"
          }
          size={16}
          color={
            item.status === "completed"
              ? THEME.SUCCESS
              : item.status === "cancelled"
              ? THEME.ERROR
              : THEME.WARNING
          }
        />

        <ThemedText
          style={[
            styles.statusText,
            {
              color:
                item.status === "completed"
                  ? THEME.SUCCESS
                  : item.status === "cancelled"
                  ? THEME.ERROR
                  : THEME.WARNING,
            },
          ]}
        >
          {item.status.replace(/_/g, " ")}
        </ThemedText>
      </View>

    </View>
  );

  // ------------------ RENDER UI ------------------ //

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>Your Rides</ThemedText>

        <TouchableOpacity onPress={toggleDropdown}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* OVERLAY */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* DROPDOWN */}
      {showDropdown && (
        <Animated.View style={[styles.dropdown, dropdownStyle]}>
          {durationOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                setSelectedDuration(opt.id as DurationFilter);
                toggleDropdown();
              }}
              style={[
                styles.dropdownItem,
                selectedDuration === opt.id && { color: "#00000095" },
              ]}
            >
              <ThemedText
                style={[
                  styles.dropdownText,
                  selectedDuration === opt.id && { color: "#000000ff" ,fontWeight: "700",   },
                ]}
              >
                {opt.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* VEHICLE FILTER */}
      <FlatList
        horizontal
        data={vehicleFilters}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, marginTop: 10 }}
        renderItem={({ item }) => {
          const active = selectedVehicle === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.vehicleBtn,
                active && { backgroundColor: "#000" },
              ]}
              onPress={() => setSelectedVehicle(item.id)}
            >
              {renderVehicleIcon(item, active)}
              <ThemedText
                style={[
                  styles.vehicleText,
                  active && { color: "#fff" },
                ]}
              >
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          );
        }}
      />

      {/* RIDE LIST */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={finalRides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <Ionicons name="car-sport-outline" size={70} color="#999" />
              <ThemedText>No rides found</ThemedText>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

export default RideHistoryScreen;

// ------------------ STYLES ------------------ //

const styles = StyleSheet.create({
  header: {
    width: "94%",
    alignSelf: "center",
    backgroundColor: "#000",
    marginTop: 40,
    borderRadius: 50,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  dropdown: {
    position: "absolute",
    right: 25,
    top: 100,
    width: 170,
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 30,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 38,
    
  },

  dropdownText: {
    color: "#000000be",
    fontSize: 14,
  },

  vehicleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efefef",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 30,
    height:50,
    marginRight: 10,
    borderRadius: 30,
  },

  vehicleText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#000",
  },

  rideItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 14,
  },

  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dateText: {
    fontSize: 13,
    color: "#666",
  },

  amountBox: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
  },

  routeRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 10,
  },

  routeIcons: {
    width: 20,
    alignItems: "center",
    marginRight: 10,
  },

  pickDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.SUCCESS,
  },

  line: {
    width: 2,
    height: 28,
    backgroundColor: "#ccc",
    marginVertical: 4,
    borderRadius: 2,
  },

  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.ERROR,
  },

  pickupText: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_PRIMARY,
  },

  dropText: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_PRIMARY,
    marginTop: 4,
  },

  vehicleIconBox: {
    width: 36,
    height: 36,
    backgroundColor: "#eee",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
});
