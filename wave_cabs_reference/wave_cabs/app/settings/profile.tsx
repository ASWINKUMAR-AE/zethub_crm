import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// removed DateTimePicker import
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";

const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f4f7fc";
const CARD_BG = "#fff";
const CARD_BORDER = "#e5eaf2";
const SECONDARY_COLOR = "#f5f5f5";
const ACCENT_COLOR = "#000000ff";
const SUBTEXT = "#888";

const DEFAULT_AVATARS = [
  "https://cdn-icons-png.flaticon.com/512/847/847969.png",
  "https://cdn-icons-png.flaticon.com/512/4333/4333609.png",
  "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
  "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
  "https://cdn-icons-png.flaticon.com/512/921/921071.png",
  "https://cdn-icons-png.flaticon.com/512/706/706830.png",
  "https://cdn-icons-png.flaticon.com/512/4333/4333607.png",
  "https://cdn-icons-png.flaticon.com/512/4202/4202831.png",
  "https://cdn-icons-png.flaticon.com/512/4140/4140037.png",
  "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
  "https://cdn-icons-png.flaticon.com/512/4333/4333602.png",
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male", icon: "male" },
  { label: "Female", value: "female", icon: "female" },
  { label: "Other", value: "other", icon: "transgender" },
];

const Profile = () => {
  const navigation = useNavigation();
  const auth = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    dob: "",
    member_since: "",
    emergency_contact: "",
    email: "",
    created_at: "",
    dp: DEFAULT_AVATARS[0],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  function formatToLocalDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days: (number | null)[] = [];

    // Add empty slots for the first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchProfile = async () => {
    setIsLoading(true);
    setAvatarLoading(true);
    try {
      // Load cached profile picture first for instant display
      const cachedDp = await AsyncStorage.getItem("cached_profile_dp");
      console.log("📸 Cached DP loaded:", cachedDp);
      if (cachedDp) {
        setForm(prev => ({ ...prev, dp: cachedDp }));
        setAvatarLoading(false);
        console.log("✅ Profile picture loaded from cache");
      }

      const data = await userAPI.getProfile();
      console.log("📥 Profile data fetched from server:", data.dp);

      let formattedDob = "";
      if (data.dob) {
        const date = new Date(data.dob);
        if (!isNaN(date)) {
          formattedDob = formatToLocalDate(data.dob);
        }
      }

      // Preserve cached DP if server returns undefined, otherwise use server value or default
      let profileDp;
      if (data.dp) {
        // Server has a profile picture, use it
        profileDp = data.dp;
        await AsyncStorage.setItem("cached_profile_dp", profileDp);
        console.log("💾 Profile picture from server cached:", profileDp);
      } else if (cachedDp) {
        // Server doesn't have one, but we have a cached one - keep it!
        profileDp = cachedDp;
        console.log("✅ Keeping cached profile picture (server returned undefined)");
      } else {
        // No server value and no cache - use default
        profileDp = DEFAULT_AVATARS[0];
        await AsyncStorage.setItem("cached_profile_dp", profileDp);
        console.log("💾 Using default profile picture:", profileDp);
      }

      setUser(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: formattedDob || "",
        member_since: data.member_since || "",
        emergency_contact: data.emergency_contact || "",
        email: data.email || "",
        created_at: data.created_at || "",
        dp: profileDp,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch profile");
    } finally {
      setIsLoading(false);
      setAvatarLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) {
        setAlertConfig({
          visible: true,
          title: "Invalid Date",
          message: "something wrong input another data like this",
          type: "error",
        });
        return;
      }

      const payload = {
        name: form.name,
        phone: form.phone,
        gender: form.gender || null,
        dob: form.dob || null,
        created_at: form.created_at,
        emergency_contact: form.emergency_contact,
        dp: typeof form.dp === "string" ? form.dp : DEFAULT_AVATARS[0],
      };

      await userAPI.updateProfile(payload);
      console.log("✅ Profile updated on server");

      // Cache the updated profile picture
      await AsyncStorage.setItem("cached_profile_dp", payload.dp);
      console.log("💾 Profile picture cached after update:", payload.dp);

      // Haptic feedback notification (vibration)
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("📳 Haptic feedback triggered");
      }

      setAlertConfig({
        visible: true,
        title: "Success",
        message: "Profile updated successfully",
        type: "success",
      });

      setUser((prev) => ({ ...prev, ...payload }));
      setForm((prev) => ({ ...prev, ...payload }));
      setIsEditing(false);
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to update profile",
        type: "error",
      });
    }
  };

  const selectAvatar = async (avatarUrl) => {
    handleChange("dp", avatarUrl);

    // Cache the selected avatar immediately
    await AsyncStorage.setItem("cached_profile_dp", avatarUrl);
    console.log("🖼️ Avatar selected and cached:", avatarUrl);

    setShowAvatarModal(false);
    setAvatarLoading(true);
    setTimeout(() => setAvatarLoading(false), 200);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to logout",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity
            style={styles.appBarBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color={PRIMARY_COLOR} />
          </TouchableOpacity>

          <ThemedText style={styles.appBarTitle}>Profile</ThemedText>

          {isEditing ? (
            <TouchableOpacity style={styles.appBarBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={22} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.appBarBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => isEditing && setShowAvatarModal(true)}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              {avatarLoading && (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color={ACCENT_COLOR} />
                </View>
              )}
              <Image
                source={{ uri: form.dp }}
                style={[styles.avatar, { display: avatarLoading ? "none" : "flex" }]}
                onLoad={() => setAvatarLoading(false)}
                onError={() => {
                  handleChange("dp", DEFAULT_AVATARS[0]);
                  setAvatarLoading(false);
                }}
              />

              {isEditing && (
                <View style={styles.avatarEditButton}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={18} color={PRIMARY_COLOR} />
              <ThemedText style={styles.sectionTitle}>
                Personal Information
              </ThemedText>
            </View>

            {/* Name */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={styles.input}
                value={form.name}
                editable={isEditing}
                onChangeText={(text) => handleChange("name", text)}
              />
            </View>

            {/* Phone + Gender */}
            <View style={styles.doubleInputRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <ThemedText style={styles.label}>Phone</ThemedText>
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  editable={isEditing}
                  onChangeText={(text) => handleChange("phone", text)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Gender</ThemedText>
                <TouchableOpacity
                  style={[styles.genderSelector, !isEditing && styles.inputDisabled]}
                  disabled={!isEditing}
                  onPress={() => setShowGenderModal(true)}
                >
                  {form.gender ? (
                    <View style={styles.genderContent}>
                      <Ionicons
                        name={GENDER_OPTIONS.find(g => g.value === form.gender?.toLowerCase())?.icon || "person"}
                        size={18}
                        color={PRIMARY_COLOR}
                      />
                      <ThemedText style={styles.genderText}>
                        {form.gender.charAt(0).toUpperCase() + form.gender.slice(1)}
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.genderPlaceholder}>Select Gender</ThemedText>
                  )}
                  <Ionicons name="chevron-down" size={18} color={ACCENT_COLOR} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { color: "#888" }]}
                value={form.email}
                editable={false}
              />
            </View>

            {/* DOB with Calendar */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>DOB</ThemedText>

              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                disabled={!isEditing}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={{ color: PRIMARY_COLOR }}>
                  {form.dob || "Select Date"}
                </ThemedText>
              </TouchableOpacity>

              {showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.calendarOverlay}>
                    <View style={styles.calendarBox}>
                      {/* Calendar Header */}
                      <View style={styles.calendarHeader}>
                        <TouchableOpacity
                          onPress={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCalendarDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-back" size={24} color={PRIMARY_COLOR} />
                        </TouchableOpacity>

                        <View style={styles.calendarMonthYear}>
                          <ThemedText style={styles.calendarMonthText}>
                            {months[calendarDate.getMonth()]}
                          </ThemedText>
                          <TouchableOpacity
                            onPress={() => setShowYearPicker(!showYearPicker)}
                            style={styles.yearToggle}
                          >
                            <ThemedText style={styles.calendarYearText}>
                              {calendarDate.getFullYear()}
                            </ThemedText>
                            <Ionicons
                              name={showYearPicker ? "chevron-up" : "chevron-down"}
                              size={16}
                              color="#666"
                            />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCalendarDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-forward" size={24} color={PRIMARY_COLOR} />
                        </TouchableOpacity>
                      </View>

                      {showYearPicker ? (
                        <View style={styles.yearPickerContainer}>
                          <FlatList
                            data={Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i)}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.yearOption,
                                  item === calendarDate.getFullYear() && styles.selectedYearOption
                                ]}
                                onPress={() => {
                                  const newDate = new Date(calendarDate);
                                  newDate.setFullYear(item);
                                  setCalendarDate(newDate);
                                  setShowYearPicker(false);
                                }}
                              >
                                <ThemedText style={[
                                  styles.yearOptionText,
                                  item === calendarDate.getFullYear() && styles.selectedYearOptionText
                                ]}>
                                  {item}
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                            initialScrollIndex={0}
                            getItemLayout={(data, index) => ({
                              length: 50,
                              offset: 50 * index,
                              index,
                            })}
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                      ) : (
                        <>
                          {/* Weekdays */}
                          <View style={styles.weekdaysRow}>
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                              <ThemedText key={day} style={styles.weekdayText}>{day}</ThemedText>
                            ))}
                          </View>

                          {/* Days Grid */}
                          <View style={styles.daysGrid}>
                            {generateCalendarDays().map((day, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dayCell,
                                  day === new Date(form.dob).getDate() &&
                                  calendarDate.getMonth() === new Date(form.dob).getMonth() &&
                                  calendarDate.getFullYear() === new Date(form.dob).getFullYear() &&
                                  styles.selectedDayCell
                                ]}
                                disabled={day === null}
                                onPress={() => {
                                  if (day) {
                                    const y = calendarDate.getFullYear();
                                    const m = String(calendarDate.getMonth() + 1).padStart(2, "0");
                                    const d = String(day).padStart(2, "0");
                                    handleChange("dob", `${y}-${m}-${d}`);
                                    setShowDatePicker(false);
                                  }
                                }}
                              >
                                <ThemedText style={[
                                  styles.dayText,
                                  day === new Date(form.dob).getDate() &&
                                  calendarDate.getMonth() === new Date(form.dob).getMonth() &&
                                  calendarDate.getFullYear() === new Date(form.dob).getFullYear() &&
                                  styles.selectedDayText
                                ]}>
                                  {day || ""}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </>
                      )}

                      <TouchableOpacity
                        style={styles.calendarCloseBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <ThemedText style={styles.calendarCloseBtnText}>Close</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}
            </View>

            {/* Emergency Contact */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Emergency Contact</ThemedText>
              <TextInput
                style={styles.input}
                value={form.emergency_contact}
                editable={isEditing}
                placeholder="Enter emergency contact number"
                onChangeText={(text) => handleChange("emergency_contact", text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#e74c3c" />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Choose Your Avatar</ThemedText>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={DEFAULT_AVATARS}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={() => selectAvatar(item)}
                >
                  <Image source={{ uri: item }} style={styles.avatarOptionImage} />

                  {form.dp === item && (
                    <View style={styles.selectedAvatarIndicator}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.avatarList}
            />
          </View>
        </View>
      </Modal>

      {/* Gender Modal */}
      <Modal
        visible={showGenderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Gender</ThemedText>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>

            <View style={styles.genderOptionsContainer}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    form.gender?.toLowerCase() === option.value && styles.genderOptionSelected
                  ]}
                  onPress={() => {
                    handleChange("gender", option.value);
                    setShowGenderModal(false);
                  }}
                >
                  <View style={[
                    styles.genderIconContainer,
                    form.gender?.toLowerCase() === option.value && styles.genderIconContainerSelected
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={28}
                      color={form.gender?.toLowerCase() === option.value ? "#fff" : PRIMARY_COLOR}
                    />
                  </View>
                  <ThemedText style={[
                    styles.genderOptionText,
                    form.gender?.toLowerCase() === option.value && styles.genderOptionTextSelected
                  ]}>
                    {option.label}
                  </ThemedText>
                  {form.gender?.toLowerCase() === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color={ACCENT_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={[
              styles.alertIconBadge,
              { backgroundColor: alertConfig.type === "success" ? "#2ecc71" : "#e74c3c" }
            ]}>
              <Ionicons
                name={alertConfig.type === "success" ? "checkmark" : "warning"}
                size={30}
                color="#fff"
              />
            </View>
            <ThemedText style={styles.alertTitle}>{alertConfig.title}</ThemedText>
            <ThemedText style={styles.alertMessage}>{alertConfig.message}</ThemedText>
            <TouchableOpacity
              style={[
                styles.alertButton,
                { backgroundColor: alertConfig.type === "success" ? "#2ecc71" : "#e74c3c" }
              ]}
              onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            >
              <ThemedText style={styles.alertButtonText}>OK</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  contentContainer: {
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: BG_COLOR,
    flexGrow: 1,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    backgroundColor: "#000000ff",
    borderRadius: 50,
    elevation: 3,
    marginBottom: 24,
  },
  appBarBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  profileCard: {
    backgroundColor: CARD_BG,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    paddingTop: 0,
    elevation: 5,
    marginBottom: 20,
    top: 0,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -50,

    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: SECONDARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#c1b8b8ff",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 15,
  },
  doubleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: PRIMARY_COLOR,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
  },
  logoutText: {
    color: "#e74c3c",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 10,
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
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  avatarList: {
    alignItems: "center",
  },
  avatarOption: {
    width: 90,
    height: 90,
    margin: 10,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOptionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  selectedAvatarIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: ACCENT_COLOR,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  genderSelector: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputDisabled: {
    opacity: 0.6,
  },
  genderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  genderText: {
    fontSize: 15,
    color: PRIMARY_COLOR,
  },
  genderPlaceholder: {
    fontSize: 15,
    color: "#999",
  },
  genderOptionsContainer: {
    paddingVertical: 10,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  genderOptionSelected: {
    backgroundColor: "#f0f0f0",
    borderColor: ACCENT_COLOR,
    borderWidth: 2,
  },
  genderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: SECONDARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  genderIconContainerSelected: {
    backgroundColor: ACCENT_COLOR,
  },
  genderOptionText: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  genderOptionTextSelected: {
    fontWeight: "700",
    color: ACCENT_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: SUBTEXT,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  alertIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    marginBottom: 8,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    elevation: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarMonthYear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  yearPickerContainer: {
    height: 250,
    width: "100%",
  },
  yearOption: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedYearOption: {
    backgroundColor: ACCENT_COLOR,
  },
  yearOptionText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  selectedYearOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  calendarYearText: {
    fontSize: 18,
    color: "#666",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    color: "#999",
    fontWeight: "600",
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderRadius: 10,
  },
  selectedDayCell: {
    backgroundColor: ACCENT_COLOR,
  },
  dayText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  calendarCloseBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: SECONDARY_COLOR,
    alignItems: "center",
  },
  calendarCloseBtnText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
});

export default Profile;
