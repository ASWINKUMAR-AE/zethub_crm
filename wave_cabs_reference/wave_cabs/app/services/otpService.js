import { apiRequest } from "./api";

/**
 * OTP Service for handling Phone and Email verification for Rider App.
 */

const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, "");

    // If it's 10 digits, we assume it needs +91 for Twilio
    if (cleanPhone.length === 10) {
        return `+91${cleanPhone}`;
    }

    // If it already has 91 but no +, add one
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
        return `+${cleanPhone}`;
    }

    return phone.startsWith("+") ? phone : `+${cleanPhone}`;
};

const getRawPhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length === 12 && cleanPhone.startsWith("91") ? cleanPhone.slice(2) : cleanPhone;
};

export const otpService = {
    formatPhoneNumber,
    getRawPhoneNumber,
    /**
     * Request an OTP for a phone number
     * Endpoint: POST /Rider/api/auth/request-phone-otp
     */
    requestPhoneOtp: async (phone) => {
        const formattedPhone = formatPhoneNumber(phone);
        const endpoint = "auth/request-phone-otp";
        console.log(`[OTP Service] Requesting Phone OTP for: ${formattedPhone} via ${endpoint}`);
        try {
            return await apiRequest(endpoint, "POST", {
                phone: formattedPhone
            });
        } catch (error) {
            console.error("[OTP Service] requestPhoneOtp error:", error);
            throw error;
        }
    },

    /**
     * Verify the phone OTP
     * Endpoint: POST /Rider/api/auth/verify-phone-otp
     */
    verifyPhoneOtp: async (phone, code) => {
        const formattedPhone = formatPhoneNumber(phone);
        const endpoint = "auth/verify-phone-otp";
        console.log(`[OTP Service] Verifying Phone OTP for: ${formattedPhone} via ${endpoint}`);
        try {
            return await apiRequest(endpoint, "POST", {
                phone: formattedPhone,
                otp: code
            });
        } catch (error) {
            console.error("[OTP Service] verifyPhoneOtp error:", error);
            throw error;
        }
    },

    /**
     * Request an OTP for an email address
     * Endpoint: POST /Rider/api/auth/request-email-otp
     */
    requestEmailOtp: async (email) => {
        const endpoint = "auth/request-email-otp";
        console.log(`[OTP Service] Requesting Email OTP for: ${email} via ${endpoint}`);
        try {
            return await apiRequest(endpoint, "POST", {
                email: email
            });
        } catch (error) {
            console.error("[OTP Service] requestEmailOtp error:", error);
            throw error;
        }
    },

    /**
     * Verify the email OTP
     * Endpoint: POST /Rider/api/auth/verify-email-otp
     */
    verifyEmailOtp: async (email, code) => {
        const endpoint = "auth/verify-email-otp";
        console.log(`[OTP Service] Verifying Email OTP for: ${email} via ${endpoint}`);
        try {
            return await apiRequest(endpoint, "POST", {
                email: email,
                otp: code
            });
        } catch (error) {
            console.error("[OTP Service] verifyEmailOtp error:", error);
            throw error;
        }
    }
};
