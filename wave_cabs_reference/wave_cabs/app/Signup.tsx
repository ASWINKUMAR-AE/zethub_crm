import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Modal as RNModal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { useAuth } from "./context/AuthContext";
import { otpService } from "./services/otpService";

const { width } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && width >= 900;

// Colors - Keeping your theme
const PRIMARY_COLOR = "#000";
const BG_COLOR = "#fff";
const CARD_COLOR = "#fff";
const TITLE_COLOR = PRIMARY_COLOR;
const INPUT_BG = "#f3f3f3";
const INPUT_BORDER = "#eee";
const BUTTON_BG = PRIMARY_COLOR;
const BUTTON_TEXT_COLOR = BG_COLOR;
const LINK_COLOR = PRIMARY_COLOR;
const SELECTED_ROLE_COLOR = "#f0f0f0";

export default function Signup() {
  const { login, signup, isAuthenticated, role: userRole } = useAuth() as any;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "rider",
  });
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // OTP Verification States
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<any[]>([]);

  // Custom Alert States
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const alertAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (msg: string, type: "success" | "error" = "error") => {
    setAlertMsg(msg);
    setAlertType(type);
    Animated.parallel([
      Animated.spring(alertAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 14,
        speed: 8,
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(alertAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 2500);
  };

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // OTP Logic
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await otpService.requestPhoneOtp(form.phone);
      if (res.success) {
        setIsOtpModalVisible(true);
        startResendTimer();
        showAlert("OTP sent successfully", "success");
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showAlert(err.message || "Failed to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      showAlert("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await otpService.verifyPhoneOtp(form.phone, otpCode);
      if (res.success) {
        setIsOtpModalVisible(false);
        // Proceed with signup after successful verification
        completeSignup();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showAlert(err.message || "Invalid OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      showAlert("Please fill in all fields");
      return;
    }

    if (!["", "rider", "driver"].includes(form.role)) {
      showAlert("Invalid role selected");
      return;
    }

    // Step 1: Request OTP instead of direct signup
    await handleRequestOtp();
  };

  const completeSignup = async () => {
    setIsLoading(true);
    try {
      const signupData: any = { ...form };
      // CRITICAL: Format phone number with +91 to match OTP service and ensure consistent DB storage
      signupData.phone = otpService.formatPhoneNumber(form.phone);

      if (referralCode.trim()) {
        signupData.referralCode = referralCode.trim();
      }
      const result = await signup(signupData);

      showAlert(`Account created successfully as ${form.role}!`, "success");
      setTimeout(() => {
        router.push("/LoginScreen");
      }, 2000);
    } catch (error: any) {
      showAlert(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      <View style={styles.container}>
        {/* 🔴/🟢 Improved Animated Alert */}
        <Animated.View
          style={[
            styles.alertBox,
            {
              backgroundColor: alertType === "success" ? "#4BB543" : "#ff4d4d",
              shadowColor: alertType === "success" ? "#4BB543" : "#ff4d4d",
              opacity: alertAnim,
              transform: [
                {
                  translateY: alertAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
                {
                  scale: alertAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <ThemedText style={styles.alertText}>{alertMsg}</ThemedText>
        </Animated.View>

        <View style={styles.card}>
          <Ionicons
            name={"person-add-outline" as any}
            size={48}
            color={PRIMARY_COLOR}
            style={styles.icon}
          />
          <ThemedText style={styles.title}>Create Account</ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={form.name}
            onChangeText={(text: string) => handleChange("name", text)}
            placeholderTextColor="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text: string) => handleChange("email", text)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={form.password}
            onChangeText={(text: string) => handleChange("password", text)}
            secureTextEntry
            placeholderTextColor="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={form.phone}
            onChangeText={(text: string) => handleChange("phone", text)}
            keyboardType="phone-pad"
            placeholderTextColor="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="Referral Code (optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            placeholderTextColor="#888"
          />

          {/* Enhanced Role Selector */}
          <View style={styles.roleContainer}>
            <ThemedText style={styles.sectionLabel}>I want to join as:</ThemedText>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  form.role === "rider" && styles.roleButtonSelected,
                ]}
                onPress={() => handleChange("role", "rider")}
              >
                <Ionicons
                  name={"person-outline" as any}
                  size={20}
                  color={form.role === "rider" ? PRIMARY_COLOR : "#666"}
                />
                <ThemedText
                  style={[
                    styles.roleButtonText,
                    form.role === "rider" && styles.roleButtonTextSelected,
                  ]}
                >
                  Rider
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={isLoading || otpLoading}
          >
            {isLoading || otpLoading ? (
              <ActivityIndicator color={BUTTON_TEXT_COLOR} />
            ) : (
              <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push("/LoginScreen")}
          >
            <ThemedText style={styles.loginLinkText}>
              Already have an account?{" "}
              <ThemedText style={styles.loginLinkHighlight}>Log in</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* OTP Verification Modal */}
      <RNModal
        visible={isOtpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !otpLoading && setIsOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.otpTitle}>Verify Phone</ThemedText>
              <ThemedText style={styles.otpSubtitle}>
                We've sent a code to {form.phone}
              </ThemedText>
            </View>

            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text: string) => handleOtpChange(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.verifyButton, otpLoading && styles.disabledButton]}
                onPress={handleVerifyOtp}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.verifyButtonText}>Verify & Join</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleRequestOtp} // Reuse request logic for resend
                disabled={resendTimer > 0 || otpLoading}
              >
                <ThemedText style={[styles.resendLink, resendTimer > 0 && styles.disabledLink]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOtpModalVisible(false)}
                disabled={otpLoading}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: isDesktop ? "50%" : "100%",
    maxWidth: 480,
    backgroundColor: CARD_COLOR,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: TITLE_COLOR,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: INPUT_BG,
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  sectionLabel: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    fontWeight: "500",
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    gap: 8,
  },
  roleButtonSelected: {
    backgroundColor: SELECTED_ROLE_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  roleButtonText: {
    fontSize: 16,
    color: "#666",
  },
  roleButtonTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  button: {
    backgroundColor: BUTTON_BG,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: BUTTON_TEXT_COLOR,
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#666",
  },
  loginLinkHighlight: {
    color: LINK_COLOR,
    fontWeight: "600",
  },
  alertBox: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    borderRadius: 58,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  alertText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  highlightText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#f9f9f9",
    color: PRIMARY_COLOR,
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  verifyButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resendLink: {
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  disabledLink: {
    color: "#aaa",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: "#666",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
