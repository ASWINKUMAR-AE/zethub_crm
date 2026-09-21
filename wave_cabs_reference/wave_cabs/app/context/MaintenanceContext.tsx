import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { appAPI } from '../services/api';
import { socket } from '../services/socket';

interface MaintenanceState {
    mode: 'none' | 'scheduled' | 'active';
    message: string;
    scheduled_from: string | null;
    scheduled_to: string | null;
    active_from: string | null;
    active_to: string | null;
    server_time: string | null;
    lastCheckedAt: number | null;
    // Derived states for easier usage
    isAppLocked: boolean;
    isBookingDisabled: boolean;
    effectiveMode: 'none' | 'scheduled' | 'active';
}

interface MaintenanceContextType {
    maintenance: MaintenanceState;
    refreshMaintenance: () => Promise<void>;
    loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [maintenance, setMaintenance] = useState<MaintenanceState>({
        mode: 'none',
        message: '',
        scheduled_from: null,
        scheduled_to: null,
        active_from: null,
        active_to: null,
        server_time: null,
        lastCheckedAt: null,
        isAppLocked: false,
        isBookingDisabled: false,
        effectiveMode: 'none',
    });
    const [loading, setLoading] = useState(true);
    const [timeOffset, setTimeOffset] = useState(0);
    const timeOffsetRef = useRef(0);
    const appState = useRef(AppState.currentState);
    const hasInitialCheckedRef = useRef(false);

    const calculateMaintenanceStatus = useCallback((data: any, offset: number): Partial<MaintenanceState> => {
        const mode = data.mode || 'none';
        const serverNow = Date.now() + offset;

        // Helper to parse date string as local time ignoring UTC 'Z' if present
        const parseAsLocal = (str: string | null) => {
            if (!str) return null;
            return new Date(str.replace('Z', '')).getTime();
        };

        const activeFrom = parseAsLocal(data.active_from);
        const activeTo = parseAsLocal(data.active_to);

        let isAppLocked = mode === 'active';
        let isBookingDisabled = mode !== 'none';
        let effectiveMode: 'none' | 'scheduled' | 'active' = mode;

        // Auto-transition from scheduled to active if time window is reached
        if (mode === 'scheduled' && activeFrom && serverNow >= activeFrom) {
            if (!activeTo || serverNow < activeTo) {
                isAppLocked = true;
                effectiveMode = 'active';
                console.log('⚡ [MaintenanceContext] Auto-locking: serverNow >= activeFrom', {
                    serverNow: new Date(serverNow).toLocaleTimeString(),
                    activeFrom: new Date(activeFrom).toLocaleTimeString(),
                });
            }
        }

        // If locked, booking is definitely disabled
        if (isAppLocked) {
            isBookingDisabled = true;
            effectiveMode = 'active';
        }

        return {
            isAppLocked,
            isBookingDisabled,
            effectiveMode
        };
    }, []);

    const refreshMaintenance = useCallback(async () => {
        // Only show loading for the initial request
        if (!hasInitialCheckedRef.current) setLoading(true);

        try {
            const response = await appAPI.getMaintenanceStatus();
            console.log('[MaintenanceContext] Maintenance status fetched:', response);
            if (response && response.success) {
                hasInitialCheckedRef.current = true;
                const serverTime = response.server_time ? new Date(response.server_time).getTime() : Date.now();
                const newOffset = serverTime - Date.now();
                setTimeOffset(newOffset);
                timeOffsetRef.current = newOffset;

                const statusUpdate = calculateMaintenanceStatus(response, newOffset);

                setMaintenance({
                    mode: response.mode || 'none',
                    message: response.message || '',
                    scheduled_from: response.scheduled_from,
                    scheduled_to: response.scheduled_to,
                    active_from: response.active_from,
                    active_to: response.active_to,
                    server_time: response.server_time,
                    lastCheckedAt: Date.now(),
                    ...statusUpdate
                } as MaintenanceState);
            }
        } catch (error) {
            console.error('[MaintenanceContext] Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    }, [calculateMaintenanceStatus]);

    useEffect(() => {
        refreshMaintenance();

        // Foreground listener
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                refreshMaintenance();
            }
            appState.current = nextAppState;
        });

        // Socket live update
        socket.on('maintenanceUpdate', (data: any) => {
            console.log('📡 [MaintenanceContext] Socket update:', data);
            if (data) {
                setMaintenance(prev => {
                    // Fix: Use nullish coalescing to allow 'none' or empty strings to pass through
                    // and merge carefully to avoid losing previous data if socket only sends partials
                    const mergedData = {
                        ...prev,
                        ...data,
                        mode: (data.mode !== undefined && data.mode !== null) ? data.mode : prev.mode,
                        // Ensure optional fields are handled correctly
                        message: data.message ?? prev.message,
                        active_from: data.active_from !== undefined ? data.active_from : prev.active_from,
                        active_to: data.active_to !== undefined ? data.active_to : prev.active_to,
                    };
                    const statusUpdate = calculateMaintenanceStatus(mergedData, timeOffset);
                    return {
                        ...mergedData,
                        ...statusUpdate,
                        lastCheckedAt: Date.now(),
                    };
                });
            }
        });

        // Ticker to check for automatic transitions frequently without full API call
        const tickerId = setInterval(() => {
            setMaintenance(prev => {
                if (prev.mode === 'none') return prev;
                const statusUpdate = calculateMaintenanceStatus(prev, timeOffsetRef.current);
                if (statusUpdate.effectiveMode !== prev.effectiveMode || statusUpdate.isAppLocked !== prev.isAppLocked) {
                    console.log(`⏰ [MaintenanceContext] Automatic transition: ${prev.effectiveMode} -> ${statusUpdate.effectiveMode}`);
                    return { ...prev, ...statusUpdate };
                }
                return prev;
            });
        }, 5000);

        // Polling every 60 seconds
        const intervalId = setInterval(refreshMaintenance, 60000);

        return () => {
            subscription.remove();
            socket.off('maintenanceUpdate');
            clearInterval(intervalId);
            clearInterval(tickerId);
        };
    }, [refreshMaintenance]);

    return (
        <MaintenanceContext.Provider value={{ maintenance, refreshMaintenance, loading }}>
            {children}
        </MaintenanceContext.Provider>
    );
};

export const useMaintenance = () => {
    const context = useContext(MaintenanceContext);
    if (context === undefined) {
        throw new Error('useMaintenance must be used within a MaintenanceProvider');
    }
    return context;
};
