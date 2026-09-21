import { useCallback, useState } from 'react';
import { rideAPI } from '../app/services/api';

export const useUserBookings = (userId: string | undefined) => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const response = await rideAPI.getBookings(userId);
            // console.log("useUserBookings Response:", response); // Optional debug

            if (response && response.success) {
                const list = response.data || response.bookings || [];
                setBookings(list);
            } else {
                setBookings([]);
            }
        } catch (err) {
            console.error("useUserBookings Error:", err);
            setError('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, [userId]);
    console.log("Bookings:", bookings);
    return { bookings, loading, error, refetch: fetchBookings, setBookings };
};