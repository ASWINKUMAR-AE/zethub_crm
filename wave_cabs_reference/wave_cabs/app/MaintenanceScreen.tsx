import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMaintenance } from './context/MaintenanceContext';

export default function MaintenanceScreen() {
    const { maintenance, refreshMaintenance, loading } = useMaintenance();

    const endTime = maintenance.active_to || maintenance.scheduled_to;
    const formattedEndTime = endTime
        ? new Date(endTime.replace('Z', '')).toLocaleString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).toUpperCase()
        : 'soon';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="construct-outline" size={80} color="#FF9800" />
                </View>

                <Text style={styles.title}>Server Under Maintenance</Text>

                <Text style={styles.message}>
                    {maintenance.message || "We are currently performing scheduled maintenance to improve our services. We'll be back shortly!"}
                </Text>

                {formattedEndTime && (
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeLabel}>Expected completion by:</Text>
                        <Text style={styles.timeValue}>{formattedEndTime}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={refreshMaintenance}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="refresh" size={20} color="#FFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Retry</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: '#FFF8E1',
        padding: 20,
        borderRadius: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 15,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    timeContainer: {
        backgroundColor: '#F5F5F5',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    timeLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    button: {
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
