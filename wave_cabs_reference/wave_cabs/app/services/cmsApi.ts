import axios from 'axios';

const API_BASE_URL = 'https://server.wavecabs.com/CMS/api/admin';
const ADMIN_SECRET = 'wavecabs-admin-secret-2025';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_SECRET,
    },
});

const BASE = "/__vehical__";

export const vehicalService = {
    getVehicles() {
        return api.get(`${BASE}/vehicles`);
    },
}

export const voucherSystemService = {
    async getStatus(): Promise<boolean> {
        try {
            const res = await api.get("/voucher-system");
            // Assuming the response structure is { data: { enabled: 1 } } or { enabled: 1 }
            // The user code said: return res.data.enabled === 1;
            // axios response.data is the body. 
            // So if body is { enabled: 1 }, then res.data.enabled is correct.
            return res.data.enabled === 1;
        } catch (error) {
            console.error("Error fetching voucher status:", error);
            return false;
        }
    },
};
