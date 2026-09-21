import { coinAPI } from "./api";

const API_BASE_URL = "http://server.wavecabs.com/api/rides";

export const walletService = {
  fetchWallet: (riderId) => coinAPI.getWallet(riderId),
  redeem: (riderId, coins) => coinAPI.redeemCoins(riderId, coins),
  referAndEarn: (code, userId) => coinAPI.applyReferral(code, userId),
};

export const rideAPI = {
  // Book a new ride
  bookRide: async (rideData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rideData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book ride");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Get ride history for a specific user
  getRideHistory: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch ride history");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
