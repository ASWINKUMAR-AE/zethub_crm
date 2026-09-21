import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { API_URL } from "../services/api";

const UpdateContext = createContext({
    isUpdateRequired: false,
    isForceUpdate: false,
    checkAppVersion: async () => { },
    openStore: () => { },
});

export const useUpdate = () => useContext(UpdateContext);

const isOutdated = (current: string, latest: string) => {
    const c = current.split(".").map(Number);
    const l = latest.split(".").map(Number);

    for (let i = 0; i < Math.max(c.length, l.length); i++) {
        const cv = c[i] || 0;
        const lv = l[i] || 0;

        if (cv < lv) return true;
        if (cv > lv) return false;
    }
    return false;
};

export const UpdateProvider = ({ children }: { children: React.ReactNode }) => {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [isForceUpdate, setIsForceUpdate] = useState(false);

    const openStore = () => {
        const url =
            Platform.OS === "android"
                ? "https://wavecabs.com/"
                : "https://wavecabs.com/"; // Replace with actual iOS App ID if available

        Linking.openURL(url);
    };

    const checkAppVersion = async () => {
        try {
            const currentVersion =
                Constants.expoConfig?.version ||
                (Constants.manifest as any)?.version ||
                "1.0.0";

            const platform = Platform.OS;

            const response = await fetch(
                `${API_URL}version/latest?platform=${platform}`
            );

            const result = await response.json();

            if (!result.success) return;

            const { version: latestVersion, force_update } = result.data;

            if (isOutdated(currentVersion, latestVersion)) {
                setIsUpdateRequired(true);
                if (force_update) {
                    setIsForceUpdate(true);
                }

                Alert.alert(
                    "Update Available 🚀",
                    "A new version of the app is available. Please update to continue.",
                    force_update
                        ? [
                            {
                                text: "Update Now",
                                onPress: () => openStore(),
                            },
                        ]
                        : [
                            { text: "Later", style: "cancel" },
                            {
                                text: "Update",
                                onPress: () => openStore(),
                            },
                        ],
                    { cancelable: !force_update }
                );
            } else {
                setIsUpdateRequired(false);
                setIsForceUpdate(false);
            }
        } catch (err) {
            console.log("Version check error:", err);
        }
    };

    useEffect(() => {
        checkAppVersion();
    }, []);

    return (
        <UpdateContext.Provider
            value={{ isUpdateRequired, isForceUpdate, checkAppVersion, openStore }}
        >
            {children}
        </UpdateContext.Provider>
    );
};
