import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Card from '../../components/Card';
import API from '../../services/api';

const ClientDashboardScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({ projects: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projRes = await API.get('/projects');
        
        let allMilestones = [];
        for (const p of projRes.data) {
          const msRes = await API.get(`/milestones/project/${p.id}`);
          allMilestones = [...allMilestones, ...msRes.data];
        }

        const pendingPayables = allMilestones.filter(m => m.status === 'approved'); // approved but not paid

        setStats({
          projects: projRes.data.length,
          pendingPayments: pendingPayables.length
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {userInfo?.name || 'Client'}</Text>
      <Text style={styles.subtitle}>Track your ongoing engagements.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingPayments}</Text>
            <Text style={styles.statLabel}>Pending Invoices</Text>
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

export default ClientDashboardScreen;
