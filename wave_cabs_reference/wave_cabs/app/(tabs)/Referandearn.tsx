import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { userAPI } from '../services/api'; // adjust path as needed


export default function ReferAndEarn() {
  const navigation = useNavigation();
  useEffect(() => {
  const checkRiderStatus = async () => {
    try {
      const statusRes = await userAPI.getStatus();
      // statusRes.status could be: "in_ride", "searching", "idle", etc.
      if (statusRes.status === "inRide") {
        navigation.replace("RiderRideTracker", {
          ...route.params, // pass existing params
          rideId: statusRes.rideId,
          // add any other params from statusRes if needed
        });
      } else if (statusRes.status === "searchingRide") {
        navigation.replace("RidePendingScreen", {
          ...route.params, // pass existing params
          requestId: statusRes.requestId,
          // add any other params from statusRes if needed
        });
      }
      // else do nothing (idle or other status)
    } catch (error) {
      console.warn("Error checking rider status:", error);
    }
  };

  checkRiderStatus();
}, []);
  const { user } = useContext(AuthContext);

  // Use referral code from AuthContext
  const referralCode = user?.referral_code || "WAVECABS";
  const inviteLink = `https://wavecabs.com/signup?ref=${referralCode}`;
  const inviteMessage = `Hey! Use my WAVE CABS referral code ${referralCode} to get ₹50 off your first ride. Download the app now: ${inviteLink}`;

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: inviteMessage,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share referral code");
      console.error(error);
    }
  };

  const handleSendSMS = async () => {
    try {
      const supported = await Linking.canOpenURL("sms:");
      if (!supported) {
        Alert.alert("Error", "SMS is not supported on this device");
        return;
      }
      await Linking.openURL(
        `sms:?body=${encodeURIComponent(inviteMessage)}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to open SMS app");
      console.error(error);
    }
  };

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      Alert.alert("Copied!", "Referral code copied to clipboard");
    } catch {
      Alert.alert("Copied!", "Referral code copied to clipboard");
    }
  };

  const handleInfoPress = () => {
    Alert.alert(
      "Refer & Earn Info",
      "Invite friends using your referral code and earn rewards when they complete their first ride!"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer Friends</Text>
          <TouchableOpacity style={styles.headerIcon} onPress={handleInfoPress}>
            <Ionicons name="help-circle-outline" size={24} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={{
              uri: "https://img.freepik.com/free-vector/flat-people-megaphone-illustration_23-2148889729.jpg?w=900&t=st=1689320000~exp=1689320600~hmac=8f6b2e7e2e2b9e7e2e2b9e7e2e2b9e7e2",
            }}
            style={styles.bannerImage}
          />
          <Text style={styles.bannerMsg}>
            Earn up to{" "}
            <Text style={{ fontWeight: "bold", color: "#555" }}>₹50</Text> per
            friend you invite to Wave Cabs
          </Text>
          <View style={styles.referralCodeRow}>
            <View style={styles.referralCodePill}>
              <Text style={styles.referralCode}>{referralCode}</Text>
              <TouchableOpacity
                style={styles.copyIcon}
                onPress={handleCopyReferralCode}
              >
                <Feather name="copy" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Invite Card */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteCardLeft}>
            <MaterialIcons name="person-add-alt-1" size={28} color="#555" />
            <Text style={styles.inviteCardText}>Invite Friends to Wave Cabs</Text>
          </View>
          <TouchableOpacity onPress={handleSendSMS}>
            <Text style={styles.inviteLink}>INVITE</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howItWorksTitle}>HOW IT WORKS?</Text>
          <View style={styles.stepRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#222"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.stepText}>
              Your friend completes 1 order within 7 days of registration
            </Text>
          </View>
          <View style={styles.rewardRow}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              }}
              style={styles.coinIcon}
            />
            <Text style={styles.rewardText}>You earn 50 coins</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.inviteFriendsBtn}
            onPress={handleInviteFriends}
          >
            <Text style={styles.inviteFriendsBtnText}>
              Invite Friends to Wave Cabs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.referNowBtn}
            onPress={handleSendSMS}
          >
            <Text style={styles.referNowBtnText}>Refer Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 0, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 0.5,
  },
  banner: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 18,
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  bannerMsg: {
    fontSize: 16,
    color: "#222",
    textAlign: "center",
    marginBottom: 14,
    marginTop: 2,
  },
  referralCodeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 2,
  },
  referralCodePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#555",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 2,
  },
  referralCode: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 2,
    marginRight: 8,
  },
  copyIcon: {
    padding: 2,
  },
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inviteCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  inviteCardText: {
    fontSize: 16,
    color: "#222",
    marginLeft: 10,
    fontWeight: "500",
  },
  inviteLink: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 15,
    padding: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  howItWorksSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  howItWorksTitle: {
    fontSize: 14,
    color: "#555",
    fontWeight: "bold",
    marginBottom: 14,
    letterSpacing: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepText: {
    fontSize: 15,
    color: "#222",
    flex: 1,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  coinIcon: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  rewardText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },
  ctaSection: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
  },
  inviteFriendsBtn: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  inviteFriendsBtnText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 16,
  },
  referNowBtn: {
    backgroundColor: "#ccc",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  referNowBtnText: {
    color: "#222",
    fontWeight: "bold",
  },
});