// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useEffect, useRef, useState } from "react";
// import { ActivityIndicator, Animated, Easing, Text, View } from "react-native";

// export default function PaymentStatus() {
//     const { orderId } = useLocalSearchParams();
//     const router = useRouter();

//     const [status, setStatus] = useState("Checking...");
//     const scaleAnim = useRef(new Animated.Value(0)).current;

//     const startSuccessAnimation = () => {
//         Animated.timing(scaleAnim, {
//             toValue: 1,
//             duration: 700,
//             easing: Easing.out(Easing.exp),
//             useNativeDriver: true,
//         }).start();
//     };

//     useEffect(() => {
//         async function fetchStatus() {
//             try {
//                 const res = await fetch(
//                     `https://server.wavecabs.com/Rider/api/payment/status/${orderId}`
//                 );

//                 const data = await res.json();

//                 // ----------------------------------------
//                 // FIX: CORRECT STATUS FROM BACKEND
//                 // ----------------------------------------
//                 const finalStatus =
//                     data?.data?.state?.toUpperCase() ||
//                     data?.status?.toUpperCase() ||
//                     "UNKNOWN";

//                 console.log("FINAL STATUS = ", finalStatus);

//                 setStatus(finalStatus);

//                 if (finalStatus === "SUCCESS") {
//                     startSuccessAnimation();
//                     setTimeout(() => router.replace("/"), 2000);
//                 } else {
//                     setTimeout(() => router.replace("/"), 500);
//                 }
//             } catch (err) {
//                 console.log("STATUS ERROR:", err);
//                 setTimeout(() => router.replace("/"), 500);
//             }
//         }

//         fetchStatus();
//     }, []);

//     return (
//         <View
//             style={{
//                 flex: 1,
//                 justifyContent: "center",
//                 alignItems: "center",
//                 padding: 20,
//                 backgroundColor: "#fff",
//             }}
//         >
//             <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
//                 Payment Status
//             </Text>

//             <Text style={{ fontSize: 16, marginBottom: 5 }}>Order ID:</Text>
//             <Text style={{ fontSize: 14, marginBottom: 20 }}>{orderId}</Text>

//             {status === "CHECKING..." && <ActivityIndicator size={40} />}

//             {status === "SUCCESS" && (
//                 <>
//                     <Animated.View
//                         style={{
//                             transform: [{ scale: scaleAnim }],
//                             backgroundColor: "#16A34A",
//                             height: 120,
//                             width: 120,
//                             borderRadius: 120,
//                             justifyContent: "center",
//                             alignItems: "center",
//                             marginBottom: 20,
//                         }}
//                     >
//                         <Text style={{ fontSize: 60, color: "#fff" }}>✔</Text>
//                     </Animated.View>

//                     <Text style={{ fontSize: 22, fontWeight: "700", color: "#16A34A" }}>
//                         Payment Successful!
//                     </Text>
//                 </>
//             )}
//         </View>
//     );
// }


import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Text,
    View,
} from "react-native";

export default function PaymentStatus() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState<"CHECKING" | "COMPLETED" | "FAILED">(
        "CHECKING"
    );

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const apiCalled = useRef(false); // 🔒 prevent double call

    const startSuccessAnimation = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        // 🚫 If orderId missing, stop
        if (!orderId || apiCalled.current) return;

        apiCalled.current = true;

        async function fetchStatus() {
            try {
                console.log("📲 FETCHING PAYMENT STATUS FOR:", orderId);

                const res = await fetch(
                    `https://server.wavecabs.com/Rider/api/payment/status/${orderId}`
                );

                const data = await res.json();

                console.log("📦 STATUS RESPONSE:", data);

                const finalStatus =
                    data?.data?.state?.toUpperCase() ||
                    data?.status?.toUpperCase() ||
                    "FAILED";

                console.log("✅ FINAL STATUS =", finalStatus);

                if (finalStatus === "COMPLETED") {
                    setStatus("COMPLETED");
                    startSuccessAnimation();

                    setTimeout(() => {
                        router.replace("/"); // home
                    }, 2000);
                } else {
                    setStatus("FAILED");
                    setTimeout(() => {
                        router.replace("/");
                    }, 1000);
                }
            } catch (err) {
                console.log("❌ STATUS ERROR:", err);
                setTimeout(() => router.replace("/"), 1000);
            }
        }

        fetchStatus();
    }, [orderId]);

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

            <Text style={{ fontSize: 14, marginBottom: 20 }}>
                Order ID: {orderId}
            </Text>

            {status === "CHECKING" && <ActivityIndicator size={40} />}

            {status === "COMPLETED" && (
                <>
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

                    <Text
                        style={{
                            fontSize: 22,
                            fontWeight: "700",
                            color: "#16A34A",
                        }}
                    >
                        Payment Successful!
                    </Text>
                </>
            )}
        </View>
    );
}
