// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
// @ts-ignore
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Modal as RNModal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import { useAuth } from "./context/AuthContext";
// @ts-ignore
import { otpService } from "./services/otpService";

const { width, height } = Dimensions.get("window");
const isDesktop = width >= 768;

// Background image
// @ts-ignore
import bgImage from "@/assets/images/profile_bg1.png";

export default function LoginScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const { login, signup, isAuthenticated, role: userRole } = useAuth() as any;

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");

  // OTP Verification States
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<any[]>([]);

  // Forgot Password States
  const [isForgotPwd, setIsForgotPwd] = useState(false);
  const [forgotPwdStep, setForgotPwdStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotPwdOtp, setForgotPwdOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState(""); // Captured from verify-otp response

  // Validation alert
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

  // Onboarding animation
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  const slides = [
    {
      title: "Welcome to WaveCabs!",
      description: "Book rides easily and securely.",
      animation: require("@/assets/Checking Phone.json"),
    },
    {
      title: "Earn Rewards",
      description: "Refer friends and earn cabcoins.",
      animation: require("@/assets/animation.json"),
    },
    {
      title: "Track Your Ride",
      description: "Live tracking and support for every ride.",
      animation: require("@/assets/Login.json"),
    },
  ];

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        if (seen === "true" || from === "index") {
          setShowOnboarding(false);
        }
      } catch (e) {
        console.error("Error reading onboarding status", e);
      }
    };
    checkOnboardingStatus();
  }, [from]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showOnboarding ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [showOnboarding]);

  useEffect(() => {
    if (lottieRef.current) lottieRef.current.play();
  }, [slideIndex]);

  useEffect(() => {
    if (isAuthenticated) {
      const destination = userRole === "driver" ? "/driver_panel" : "/(tabs)";
      router.replace(destination as any);
    }
  }, [isAuthenticated, router, userRole]);

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
      setOtp(["", "", "", "", "", ""]); // Clear OTP on request
      const res = await otpService.requestPhoneOtp(phone);
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
      const res = await otpService.verifyPhoneOtp(phone, otpCode);
      if (res.success) {
        setIsOtpModalVisible(false);
        // Proceed with login after successful verification
        completeLogin();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showAlert(err.message || "Invalid OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const completeLogin = async () => {
    try {
      setIsLoading(true);
      const redirectPath = await login(email, password);
      if (redirectPath) {
        router.push(redirectPath as any);
      }
    } catch (e: any) {
      showAlert(e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password || !phone) return showAlert("Please fill in all fields");
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return showAlert("Please enter a valid email");

    // Start with OTP verification
    await handleRequestOtp();
  };

  const handleNextSlide = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      if (slideIndex < slides.length - 1) {
        setSlideIndex(slideIndex + 1);
      } else {
        setShowOnboarding(false);
        await AsyncStorage.setItem("hasSeenOnboarding", "true");
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleForgotPassword = async () => {
    if (!phone) return showAlert("Please enter your phone number");

    setOtpLoading(true);
    try {
      setOtp(["", "", "", "", "", ""]); // Clear OTP on request
      const res = await otpService.requestPhoneOtp(phone);
      if (res.success) {
        setForgotPwdStep('otp');
        setIsOtpModalVisible(true);
        startResendTimer();
        showAlert("Verification code sent", "success");
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showAlert(err.message || "Failed to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      showAlert("Please enter a 6-digit OTP", "error");
      return;
    }

    setOtpLoading(true);
    try {
      // CRITICAL: Verify OTP with backend to get verificationToken
      // The backend uses this token to authorize the password reset
      const res = await otpService.verifyPhoneOtp(phone, otpCode);

      if (res.success || res.verificationToken) {
        setVerificationToken(res.verificationToken || res.token); // Handle potential naming variations
        setForgotPwdOtp(otpCode); // Keep for reference if needed
        setIsOtpModalVisible(false);
        setForgotPwdStep('reset');
      } else {
        throw new Error(res.message || "Invalid OTP");
      }
    } catch (err: any) {
      showAlert(err.message || "Failed to verify OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return showAlert("Please fill in both password fields");
    if (newPassword !== confirmPassword) return showAlert("Passwords do not match");
    if (newPassword.length < 6) return showAlert("Password must be at least 6 characters");

    setResetLoading(true);
    try {
      const { authAPI } = require("./services/api");
      // CRITICAL: Backend advisory requires +91 format for token validation
      const formattedPhone = otpService.formatPhoneNumber(phone);

      await authAPI.resetPassword({
        phone: formattedPhone,
        newPassword,
        verificationToken: verificationToken // Use the captured token
      });

      showAlert("Password reset successful! Please login.", "success");
      setIsForgotPwd(false);
      setForgotPwdStep('phone');
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showAlert(err.message || "Failed to reset password", "error");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAuth = async () => {
    await handleLogin();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ImageBackground source={bgImage} style={styles.background} resizeMode="cover">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* 🔴/🟢 Improved Animated Alert */}
          <Animated.View
            style={[
              styles.errorBox,
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
            <Text style={styles.errorText}>{alertMsg}</Text>
          </Animated.View>

          {showOnboarding ? (
            <View style={styles.sliderContainer}>
              <Text style={styles.brandName}>CABIT</Text>
              <Animated.View
                style={[
                  styles.slideContent,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LottieView
                  ref={lottieRef}
                  source={slides[slideIndex].animation}
                  autoPlay={false}
                  loop
                  style={styles.lottie}
                />
                <Text style={[styles.title, styles.textWhite]}>
                  {slides[slideIndex].title}
                </Text>
                <Text style={[styles.slideDesc, styles.textWhite]}>
                  {slides[slideIndex].description}
                </Text>
              </Animated.View>

              <View style={styles.sliderDots}>
                {slides.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, slideIndex === idx && styles.dotActive]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={async () => {
                  setShowOnboarding(false);
                  await AsyncStorage.setItem("hasSeenOnboarding", "true");
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextbutton} onPress={handleNextSlide}>
                <Text style={styles.buttonText}>
                  {slideIndex < slides.length - 1 ? "Next" : "Get Started"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.card,
                isDesktop && styles.cardDesktop,
                {
                  opacity: slideAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {isForgotPwd ? (
                <>
                  <Text style={[styles.title, styles.textWhite]}>
                    {forgotPwdStep === 'phone' ? 'Reset Password' : 'Create New Password'}
                  </Text>

                  {forgotPwdStep === 'phone' ? (
                    <>
                      <TextInput
                        style={[styles.input, styles.inputWhite]}
                        placeholder="Phone Number"
                        placeholderTextColor="#fff"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleForgotPassword}
                        disabled={otpLoading}
                      >
                        {otpLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.input, styles.inputWhite]}
                          placeholder="New Password"
                          placeholderTextColor="#fff"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPwd}
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => setShowNewPwd(!showNewPwd)}
                        >
                          <Ionicons
                            name={(showNewPwd ? "eye" : "eye-off") as any}
                            size={20}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.input, styles.inputWhite]}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#fff"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showNewPwd}
                      />
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleResetPassword}
                        disabled={resetLoading}
                      >
                        {resetLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.switchAuth}
                    onPress={() => {
                      setIsForgotPwd(false);
                      setForgotPwdStep('phone');
                    }}
                  >
                    <Text style={styles.switchAuthText}>Back to Login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.title, styles.textWhite]}>
                    Welcome Back
                  </Text>

                  <TextInput
                    style={[styles.input, styles.inputWhite]}
                    placeholder="Email"
                    placeholderTextColor="#fff"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <TextInput
                    style={[styles.input, styles.inputWhite]}
                    placeholder="Phone Number"
                    placeholderTextColor="#fff"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.inputWhite]}
                      placeholder="Password"
                      placeholderTextColor="#fff"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPwd}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPwd(!showPwd)}
                    >
                      <Ionicons
                        name={(showPwd ? "eye" : "eye-off") as any}
                        size={20}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={{ alignSelf: 'flex-end', marginBottom: 15 }}
                    onPress={() => setIsForgotPwd(true)}
                  >
                    <Text style={{ color: '#aaa', textDecorationLine: 'underline' }}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleAuth}
                    disabled={isLoading || otpLoading}
                  >
                    {isLoading || otpLoading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.buttonText}>
                        Login
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchAuth}
                    onPress={() => router.push("/Signup")}
                  >
                    <Text style={styles.switchAuthText}>
                      Don't have an account? Sign Up
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </ImageBackground>

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
              <Text style={styles.otpTitle}>Verify Phone</Text>
              <Text style={styles.otpSubtitle}>
                We've sent a code to {phone}
              </Text>
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
                onPress={isForgotPwd ? handleVerifyForgotOtp : handleVerifyOtp}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {isForgotPwd ? "Verify OTP" : "Verify & Login"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleRequestOtp}
                disabled={resendTimer > 0 || otpLoading}
              >
                <Text style={[styles.resendLink, resendTimer > 0 && styles.disabledLink]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOtpModalVisible(false)}
                disabled={otpLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1, justifyContent: "center", padding: 20 },


  errorBox: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "#ff4d4d",
    borderRadius: 58,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#ff4d4d",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  sliderContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000000ff",
    borderRadius: 36,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
    elevation: 8,
    paddingTop: 60,
  },
  brandName: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: "40%",
    letterSpacing: 10,
    textTransform: "uppercase",

  },
  nextbutton: {
    backgroundColor: "#fff",
    borderRadius: 50,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    marginBottom: -50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
    elevation: 8,
  },
  slideContent: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  lottie: { width: width * 0.7, height: height * 0.4, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  slideDesc: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    color: "#fff",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  sliderDots: { flexDirection: "row", justifyContent: "center", marginBottom: 10, marginTop: 110 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ffffff40", marginHorizontal: 6, display: "none" },
  dotActive: { backgroundColor: "#fff", transform: [{ scale: 1.2 }] },
  button: {
    backgroundColor: "#fff",
    borderRadius: 50,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  buttonText: { color: "#000", fontSize: 18, fontWeight: "bold" },
  skipButton: { marginTop: 20, padding: 10 },
  skipButtonText: { color: "#ffffff80", fontSize: 16, textDecorationLine: "underline" },
  card: {
    backgroundColor: "#000000cc",
    borderRadius: 36,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ffffff7b",
    borderRadius: 50,
    paddingHorizontal: 16,
    marginVertical: 8,
    fontSize: 16,
  },
  inputWhite: { color: "#fff" },
  textWhite: { color: "#fff" },
  roleLabel: { fontSize: 16, marginBottom: 8 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  roleButtonActive: { backgroundColor: "#fff" },
  roleButtonText: { color: "#fff" },
  roleButtonTextActive: { color: "#000", fontWeight: "bold" },
  eyeIcon: { position: "absolute", right: 16, top: 22, zIndex: 1 },
  switchAuth: { marginTop: 20, alignItems: "center" },
  switchAuthText: { color: "#aaa", textDecorationLine: "underline" },
  roleContainer: { marginBottom: 20 },
  roleButtons: { flexDirection: "row", justifyContent: "space-between" },
  cardDesktop: {
    width: "50%",
    maxWidth: 500,
  },
  inputContainer: { position: "relative" },
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
    color: "#000",
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
    color: "#000",
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  verifyButton: {
    backgroundColor: "#000",
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
    color: "#000",
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
