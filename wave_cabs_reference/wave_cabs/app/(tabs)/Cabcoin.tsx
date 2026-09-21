import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { coinAPI } from "../services/api"; // ✅ FIXED: include coinAPI import


const { width } = Dimensions.get("window");

const THEME = {
  PRIMARY: "#000000",
  SECONDARY: "#111111",
  ACCENT: "#2D2D2D",
  BG: "#F8F9FA",
  CARD: "#FFFFFF",
  BORDER: "#E9ECEF",
  ICON_BG: "#F1F3F5",
  GREEN: "#27AE60",
  RED: "#E74C3C",
  TEXT_PRIMARY: "#2D3436",
  TEXT_SECONDARY: "#636E72",
  TEXT_MUTED: "#B2BEC3",
  SHADOW: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};

export default function Cabcoin() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [waveCoins, setWaveCoins] = useState(0);
  const [referCoins, setReferCoins] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [referralCode, setReferralCode] = useState("");

  // ✅ Generate referral code based on user ID
  useEffect(() => {
    if (user?.id) {
      const random = Math.floor(10 + Math.random() * 90); // 2-digit random number
      setReferralCode(`wavecabs${user.id}refer${random}`);
    }
  }, [user]);

  // ✅ Copy referral code to clipboard
  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    alert("Referral code copied!");
  };

  // ✅ Share referral code
  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `🚖 Use my WaveCabs referral code ${referralCode} to get bonus coins on your first ride!  Download now: https://wavecabs.com/ `,
      });
    } catch (error) {
      console.error("Error sharing referral code:", error);
    }
  };

  // ✅ Fetch wallet data (coins & transactions)
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await coinAPI.getWallet(user.id);
        setWaveCoins(data.wallet?.wave_coins || 0);
        setReferCoins(data.wallet?.refer_coins || 0);
        setTransactions(
          Array.isArray(data.transactions)
            ? [...data.transactions].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
            : []
        );

        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        console.warn("❌ Error fetching wallet:", err.message);
        setWaveCoins(0);
        setReferCoins(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  // ✅ Transaction item
  const renderTransaction = ({ item }) => (
    <Animated.View
      style={[
        styles.transactionItem,
        THEME.SHADOW.sm,
        { transform: [{ scale: scaleAnim }], opacity: scaleAnim },
      ]}
    >
      <View
        style={[
          styles.transactionIconWrap,
          { backgroundColor: item.amount > 0 ? `${THEME.GREEN}15` : `${THEME.RED}15` },
        ]}
      >
        <Ionicons
          name={item.amount > 0 ? "trending-up" : "trending-down"}
          size={20}
          color={item.amount > 0 ? THEME.GREEN : THEME.RED}
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{item.created_at?.slice(0, 10)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.amount > 0 ? `${THEME.GREEN}20` : `${THEME.RED}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.amount > 0 ? THEME.GREEN : THEME.RED },
              ]}
            >
              {item.amount > 0 ? "Credited" : "Debited"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.amount > 0 ? THEME.GREEN : THEME.RED },
          ]}
        >
          {item.amount > 0 ? "+" : ""}
          {item.amount}
        </Text>
        <Text style={styles.coinText}>coins</Text>
      </View>
    </Animated.View>
  );

  // ✅ Header with balance & refer section
  const ListHeader = () => (
    <>
      <View style={[styles.header, { backgroundColor: THEME.PRIMARY }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cab Coins</Text>
          <Text style={styles.headerSubtitle}>Your Digital Wallet</Text>
        </View>

        <View style={styles.headerBtn}>
          <Ionicons name="information-circle-outline" size={22} color="#FFF" />
        </View>
      </View>

      {/* Balance Card */}
      <Animated.View
        style={[styles.balanceCard, THEME.SHADOW.md, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={[styles.balanceInner, { backgroundColor: THEME.SECONDARY }]}>
          <Text style={styles.balanceLabel}>Total Coins</Text>
          <Text style={styles.balanceValue}>{waveCoins + referCoins}</Text>
          <Text style={styles.balanceSubtext}>
            {waveCoins} Ride Coins + {referCoins} Referral Coins
          </Text>
        </View>
      </Animated.View>

      {/* Refer & Earn Section */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 18,
            width: "90%",
            alignItems: "center",
            ...THEME.SHADOW.md,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: THEME.TEXT_PRIMARY,
              marginBottom: 4,
            }}
          >
            Refer & Earn
          </Text>

          <Text
            style={{
              color: THEME.TEXT_SECONDARY,
              fontSize: 14,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Invite friends and earn bonus Cab Coins when they take their first ride!
          </Text>

          {/* Buttons Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 10,
            }}
          >
            {/* Copy Button */}
            <TouchableOpacity
              onPress={handleCopyCode}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: THEME.ACCENT,
                paddingVertical: 12,
                borderRadius: 12,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                ...THEME.SHADOW.sm,
              }}
            >
              <Ionicons name="copy-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                copy code
              </Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShareReferral}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: THEME.PRIMARY,
                paddingVertical: 12,
                borderRadius: 12,
                marginLeft: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                ...THEME.SHADOW.sm,
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              color: THEME.TEXT_MUTED,
              textAlign: "center",
            }}
          >
            You and your friend both earn coins after their first successful ride 🚖
          </Text>
        </View>
      </View>

      {/* Transactions Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: THEME.BG }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.PRIMARY} />
          <Text style={styles.loadingText}>Loading your coins...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id?.toString()}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={60} color={THEME.TEXT_MUTED} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyText}>
                Start riding or referring to earn your first coins!
              </Text>
            </View>
          }
          contentContainerStyle={styles.transactionsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: THEME.TEXT_SECONDARY, marginTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 52,
    margin: 20,
  },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 22,
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
  balanceCard: { margin: 20, borderRadius: 20, overflow: "hidden" },
  balanceInner: { padding: 24, alignItems: "center", borderRadius: 20 },
  balanceLabel: { fontSize: 16, color: "#FFF", opacity: 0.9 },
  balanceValue: { fontSize: 48, color: "#FFF", fontWeight: "900", marginVertical: 6 },
  balanceSubtext: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: THEME.TEXT_PRIMARY },
  transactionsList: { paddingBottom: 40 },
  transactionItem: {
    flexDirection: "row",
    backgroundColor: THEME.CARD,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  transactionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionDesc: { fontSize: 15, fontWeight: "600", color: THEME.TEXT_PRIMARY },
  transactionMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  transactionDate: { fontSize: 12, color: THEME.TEXT_MUTED },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  amountContainer: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 16, fontWeight: "700" },
  coinText: { fontSize: 11, color: THEME.TEXT_MUTED },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: THEME.TEXT_PRIMARY },
  emptyText: { fontSize: 14, color: THEME.TEXT_SECONDARY, marginTop: 4 },
});
