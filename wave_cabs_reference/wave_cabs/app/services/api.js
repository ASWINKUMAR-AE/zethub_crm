import * as SecureStore from "expo-secure-store";
import { showError } from "../utils/showError";

// ============================================================
// BASE URL FOR RIDER API
// ============================================================
export const API_URL = "https://server.wavecabs.com/Rider/api/";


// ============================================================
// GENERIC REQUEST HANDLER
// ============================================================
export async function apiRequest(endpoint, method = "GET", data = null) {
  const finalUrl = `${API_URL}${endpoint}`;

  console.log("🌍 API Request →", finalUrl);


  const token = await SecureStore.getItemAsync("token");
  console.log("🔐 JWT Token →", token);

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  let options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(finalUrl, options);

    let result;
    try {
      result = await response.json();
    } catch {
      result = { error: "Invalid server response (not JSON)" };
    }

    if (!response.ok) {
      const msg =
        result?.error ||
        result?.message ||
        `Server error (${response.status})`;

      console.log("❌ API ERROR:", msg);

      if (
        endpoint.includes("auth/login") ||
        endpoint.includes("auth/signup")
      ) {
        showError("Login/Signup Failed", msg);
      }

      throw new Error(msg);
    }

    return result;
  } catch (err) {
    console.log("🔥 apiRequest Exception:", err.message);
    throw err;
  }
}

// ============================================================
// AUTH APIs
// ============================================================
export const authAPI = {
  login: (email, password, platform) =>
    apiRequest("auth/login", "POST", { email, password, platform }),
  signup: (data) => apiRequest("auth/signup", "POST", data),
  getSession: () => apiRequest("auth/session", "GET"),
  resetPassword: (data) => apiRequest("auth/reset-password", "POST", data),
};

// ============================================================
// USER APIs
// ============================================================
export const userAPI = {
  getProfile: () => apiRequest("users/profile"),
  updateProfile: (data) => apiRequest("users/profile", "PUT", data),
  getPreferences: () => apiRequest("users/preferences"),
  updatePreferences: (prefs) =>
    apiRequest("users/preferences", "PUT", prefs),
  deleteAccount: (reason) =>
    apiRequest("users/delete-account", "POST", { reason }),
  getStatus: () => apiRequest("users/status"),
  getDriverDetails: (driverId) =>
    apiRequest(`users/driverDetails/${driverId}`),
};

// ============================================================
// ⭐⭐⭐ PHONEPE PAYMENT APIs — FIXED ⭐⭐⭐
// ============================================================
export const paymentAPI = {
  processPayment: (data) =>
    apiRequest("payment/process", "POST", data),

  checkStatus: (merchantOrderId) =>
    apiRequest(`payment/status/${merchantOrderId}`, "GET"),
};

// ============================================================
// BOOKINGS APIs
// ============================================================
export const bookingAPI = {
  createBooking: (data) => apiRequest("bookings", "POST", data),
  getBookings: () => apiRequest("bookings"),
  getBookingDetails: (id) => apiRequest(`bookings/${id}`),
};

// ============================================================
// RIDE APIs
// ============================================================
export const rideAPI = {
  bookRide: (data) => apiRequest("rides/book", "POST", data),
  getBookingDetails: (id) => apiRequest(`rides/getBookingDetails/${id}`),
  cancelRide: (request_id) =>
    apiRequest("rides/cancel", "POST", { request_id }),
  getRideHistory: (userId) =>
    apiRequest(`rides/history?user_id=${userId}`),
  getRideDetails: (rideId) =>
    apiRequest(`rides/getRideDetails/${rideId}`),
  outstationConfirm: (data) =>
    apiRequest("rides/outstation/confirmBooking", "POST", {
      ...data,
      fare: data.finalFare,
      breakdown: data.fareBreakdown
    }),
  getBookings: (userId) => apiRequest(`rides/history?user_id=${userId}`),
  getBookingById: (bookingId) => apiRequest(`rides/getBookingDetails/${bookingId}`),
  getPackageTime: (rideId) => apiRequest(`rides/package-time/${rideId}`, "GET"),
};

// ============================================================
// LOCATION APIs
// ============================================================
export const locationAPI = {
  saveFavoriteLocation: (data) =>
    apiRequest("locations/favorite-locations", "POST", data),
  getFavoriteLocations: (user_id) =>
    apiRequest(`locations/favorite-locations/${user_id}`),
};

// ============================================================
// COIN APIs
// ============================================================
export const coinAPI = {
  applyReferral: (referralCode, refereeId) =>
    apiRequest("coins/referral", "POST", {
      referralCode,
      refereeId,
    }),
  getWallet: (riderId) => apiRequest(`coins/wallet/${riderId}`),
  redeemCoins: (riderId, coins) =>
    apiRequest("coins/redeem", "POST", { riderId, coins }),
};

// ============================================================
// MESSAGES APIs
// ============================================================
export const messageAPI = {
  sendMessage: (data) => apiRequest("messages/send", "POST", data),
  getMessages: (rideId) => apiRequest(`messages/${rideId}`),
};

// ============================================================
// VOUCHER APIs
// ============================================================
export const voucherAPI = {
  getAvailableVouchers: (userId, vehicleType) =>
    apiRequest(
      `vouchers/available?userId=${userId}&vehicleType=${vehicleType}`
    ),
};

// ============================================================
// PACKAGES APIs
// ============================================================
export const packagesAPI = {
  fetchAll: async () => {
    const response = await apiRequest("packages", "GET");
    console.log("📦 Packages:", response);
    return response;
  },
};
// ============================================================
// APP APIs
// ============================================================
export const appAPI = {
  getMaintenanceStatus: () => apiRequest("app/maintenance-status"),
};
