import * as Linking from "expo-linking";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { ReactNode, useEffect } from "react";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MaintenanceProvider, useMaintenance } from "./context/MaintenanceContext";
import { UpdateProvider } from "./context/UpdateContext";
import { rideAPI, userAPI } from "./services/api";
import { toastConfig } from "./toast.config/toast.config";

interface AuthGateProps {
  children: ReactNode;
}

function AuthGate({ children }: AuthGateProps) {
  const { user, loading: authLoading } = useAuth() ?? { user: null, loading: false };
  const { maintenance, loading: maintenanceLoading } = useMaintenance();
  const router = useRouter();
  const segments = useSegments();

  const loading = authLoading || maintenanceLoading;

  // Allow deep link screen without login
  const PUBLIC_SCREENS = ["LoginScreen", "Signup", "PaymentStatus", "MaintenanceScreen"];

  // Keep ref to segments to check current screen without dependency loop
  const segmentsRef = React.useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // Effect 1: Protect routes (redirect unauthenticated users)
  useEffect(() => {
    if (loading) return;

    const currentScreen =
      segments?.length ? segments[segments.length - 1] : "";
    console.log("Current Screen:", currentScreen);
    console.log("Maintenance:", maintenance);
    // Priority 1: Maintenance Check
    if (maintenance.isAppLocked) {
      if (currentScreen !== "MaintenanceScreen") {
        const checkMaintenanceRedirect = async () => {
          try {
            const statusRes = await userAPI.getStatus();
            if (statusRes.status !== "inRide") {
              router.replace("/MaintenanceScreen");
            }
          } catch (e) {
            router.replace("/MaintenanceScreen");
          }
        };
        checkMaintenanceRedirect();
      }
      return; // Stop here if app is locked
    }

    // Priority 2: Recovery if Maintenance Screen is still active but lock is off
    if (currentScreen === "MaintenanceScreen") {
      router.replace("/(tabs)");
      return;
    }

    // Priority 3: Normal Auth Check
    if (!user && !PUBLIC_SCREENS.includes(currentScreen)) {
      router.replace("/LoginScreen");
    }
  }, [loading, user, segments, maintenance.isAppLocked]);

  // Effect 2: Check rider status on load/login (Redirection Logic)
  const hasRedirectedRef = React.useRef(false);
  useEffect(() => {
    if (!loading && user) {
      if (hasRedirectedRef.current) return;

      const checkRiderStatus = async () => {
        try {
          const statusRes = await userAPI.getStatus();
          console.log("Global Status Check:", statusRes);

          hasRedirectedRef.current = true; // Mark as done after the first successful check

          if (statusRes.status === "inRide") {
            const currentSegments = segmentsRef.current || [];
            const inTracker = currentSegments.some(s => s === 'RiderRideTracker');
            const inDetails = currentSegments.some(s => s === 'RideDetailsScreen');

            let rideType = (statusRes.rideType || statusRes.ride_type || '').toLowerCase();
            const rideId = statusRes.rideId;
            let requestId = statusRes.requestId || statusRes.request_id;

            // If rideType is missing OR we are outstation but missing requestId, fetch details
            if ((!rideType || (rideType === 'outstation' && !requestId)) && rideId) {
              try {
                const d = await rideAPI.getRideDetails(rideId);
                rideType = (d.ride_type || d.rideType || rideType || '').toLowerCase();
                requestId = d.request_id || d.requestId || requestId;
              } catch (e) {
                console.log('Could not fetch details for type/id check');
              }
            }

            // --- FIXED LOGIC FOR ROUND TRIP RETURN ---
            // Fetch fresh details to check precise status (needed for return journey check)
            let isReturnPhase = false;
            let tripType = '';
            if (rideId) {
              try {
                const d = await rideAPI.getRideDetails(rideId);
                tripType = d.trip_type || d.tripType || '';
                // "outstationReturnJourney" is a special booking status for phase 2
                if (d.status === 'outstationReturnJourney') {
                  isReturnPhase = true;
                }
              } catch (e) { }
            }

            if (rideType === 'outstation') {
              // If it's a Round Trip AND we are in Return Phase -> Go to Tracker
              if (tripType === 'round' && isReturnPhase) {
                if (inTracker) return;
                router.replace({ pathname: "/(tabs)/RiderRideTracker", params: { rideId: rideId } });
                return;
              }

              // Otherwise (One-Way OR Round Trip Phase 1) -> Default to Details
              if (inDetails || inTracker) return;

              const bookingId = requestId || rideId;
              router.replace({ pathname: "/RideDetailsScreen", params: { bookingId: String(bookingId), source: 'startup_inRide' } });
            } else {
              // Local
              if (inTracker) return;
              router.replace({ pathname: "/(tabs)/RiderRideTracker", params: { rideId: rideId } });
            }
          } else if (statusRes.status === "searchingRide") {
            router.replace({ pathname: "/RidePendingScreen", params: { requestId: statusRes.requestId } });
          } else if (statusRes.status === "payment") {
            console.log("Payment Status Check:", statusRes);
            router.replace({ pathname: "/CompleteRide", params: { request_id: statusRes.requestId, fare: statusRes.fare, payment_method: statusRes.payment_method, rideId: statusRes.rideId } });
          }
        } catch (e) {
          console.warn("Global status check failed", e);
        }
      };

      checkRiderStatus();
    } else if (!user) {
      hasRedirectedRef.current = false; // Reset if user logs out
    }
  }, [loading, user]);

  if (loading) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log("🔥 Deep Link URL:", url);

      if (!url) return;

      const parsed = Linking.parse(url);
      console.log("🔍 Parsed Deep Link:", parsed);

      // Check scheme first
      if (parsed.scheme === "cabit") {
        console.log("✔ Scheme validated");

        // For intent://PaymentStatus?... → hostname = "PaymentStatus"
        if (parsed.hostname === "PaymentStatus") {
          const orderId = parsed.queryParams?.orderId;

          console.log("🟢 Deeplink Payment Order ID:", orderId);

          if (orderId) {
            router.push(`/PaymentStatus?orderId=${orderId}`);
          }
        }
      }
    };

    // Add listener
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // When app is opened from killed state
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <AuthProvider>
      <UpdateProvider>
        <MaintenanceProvider>
          <AuthGate>
            <Slot />
            <Toast config={toastConfig} />
          </AuthGate>
        </MaintenanceProvider>
      </UpdateProvider>
    </AuthProvider>
  );
}
