import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../_context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import Card from '../../components/Card';
import API from '../_services/api';

const AdminDashboardScreen = () => {
  const { userInfo } = useAuth();
  const [stats, setStats] = useState({ projects: 0, users: 0, payments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let projCount = 0;
        let usersCount = 0;
        let payCount = 0;

        // Everyone can fetch projects
        try {
          const projRes = await API.get('/projects');
          projCount = projRes.data.length;
        } catch(e) { console.warn('Projects fetch failed', e); }

        // Only admins can fetch users and payments
        if (userInfo?.role === 'admin') {
          try {
            const [usersRes, payRes] = await Promise.all([
              API.get('/users'),
              API.get('/payments')
            ]);
            usersCount = usersRes.data.length;
            payCount = payRes.data.length;
          } catch(e) { console.warn('Admin stats fetch failed', e); }
        }
        
        setStats({
          projects: projCount,
          users: usersCount,
          payments: payCount
        });
      } catch (e) {
        console.error('Failed to set dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome back, {userInfo?.name || 'User'}!</Text>
      <Text style={styles.subtitle}>Here is your system overview.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </Card>
          
          {userInfo?.role === 'admin' && (
            <>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </Card>

              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.payments}</Text>
                <Text style={styles.statLabel}>Total Payments</Text>
              </Card>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  greeting: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { 
    width: '48%', 
    marginBottom: SPACING.md, 
    alignItems: 'center', 
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
  },
  statNumber: { ...TYPOGRAPHY.h1, color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginTop: SPACING.xs }
});

export default AdminDashboardScreen;
