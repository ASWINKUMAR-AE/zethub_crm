import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, Text, View } from "react-native";

export default function PaymentStatus() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("Checking...");
  const scaleAnim = new Animated.Value(0);

  // ----- SUCCESS ANIMATION -----
  const startSuccessAnimation = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  // ----- FETCH PAYMENT STATUS -----
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(
          `https://server.wavecabs.com/Rider/api/payment/status/${orderId}`
        );

        const data = await res.json();
        const finalStatus = data.status?.toUpperCase() || "UNKNOWN";

        setStatus(finalStatus);

        if (finalStatus === "SUCCESS") {
          startSuccessAnimation();

          // Redirect after 2 sec
          setTimeout(() => {
            router.replace("/");
          }, 3000);
        } else {
          // For FAIL / UNKNOWN
          setTimeout(() => {
            router.replace("/");
          }, 2500);
        }
      } catch (err) {
        setStatus("ERROR");
        setTimeout(() => {
          router.replace("/");
        }, 2500);
      }
    }

    fetchStatus();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
        Payment Status
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>Order ID:</Text>
      <Text style={{ fontSize: 14, marginBottom: 20 }}>{orderId}</Text>

      {/* LOADING */}
      {status === "Checking..." && <ActivityIndicator size={40} />}

      {/* SUCCESS UI */}
      {status === "SUCCESS" && (
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: "#16A34A",
            height: 120,
            width: 120,
            borderRadius: 120,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 60, color: "#fff" }}>✔</Text>
        </Animated.View>
      )}

      {status === "SUCCESS" && (
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#16A34A" }}>
          Payment Successful!
        </Text>
      )}

      {/* FAILED / ERROR UI */}
      {status !== "SUCCESS" && status !== "Checking..." && (
        <>
          <View
            style={{
              backgroundColor: "#DC2626",
              height: 120,
              width: 120,
              borderRadius: 120,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 60, color: "#fff" }}>✖</Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: "700", color: "#DC2626" }}>
            Payment Failed
          </Text>

          <Text style={{ marginTop: 10, fontSize: 14 }}>
            Redirecting back...
          </Text>
        </>
      )}
    </View>
  );
}
