import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Card from '../../components/Card';
import API from '../../services/api';

// Backend prompt function
const sendBackendPrompt = (action, data) => {
  const prompt = `Backend Request: ${action}\nData: ${JSON.stringify(data, null, 2)}\n\nPlease implement the backend functionality for this action.`;
  console.log(prompt);
  Alert.alert('Backend Request', prompt);
};

const AdminDashboardScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({ projects: 0, users: 0, payments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        sendBackendPrompt('fetch_dashboard_stats', { endpoint: '/dashboard/stats' });
        
        const [projRes, usersRes, payRes] = await Promise.all([
          API.get('/projects'),
          API.get('/users'),
          API.get('/payments')
        ]);
        
        setStats({
          projects: projRes.data.length,
          users: usersRes.data.length,
          payments: payRes.data.length
        });
      } catch (e) {
        console.error('Failed to fetch dashboard stats:', e);
        Alert.alert('Info', 'Backend request logged. Using sample data for demonstration.');
        // Use sample data if API fails
        setStats({
          projects: 12,
          users: 48,
          payments: 156
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome back, {userInfo?.name || 'Admin'}!</Text>
      <Text style={styles.subtitle}>Here is your system overview.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.payments}</Text>
            <Text style={styles.statLabel}>Total Payments</Text>
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  greeting: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', marginBottom: SPACING.md, alignItems: 'center', paddingVertical: SPACING.lg },
  statNumber: { ...TYPOGRAPHY.h1, color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginTop: SPACING.xs }
});

export default AdminDashboardScreen;
