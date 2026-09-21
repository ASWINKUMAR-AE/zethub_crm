import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Card from '../../components/Card';
import API from '../../services/api';

const TeamDashboardScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({ activeProjects: 0, pendingTasks: 0 });
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

        const activeProjs = projRes.data.filter(p => p.status !== 'completed');
        const pendingMs = allMilestones.filter(m => m.assigned_to === userInfo.id && m.status !== 'approved' && m.status !== 'paid');

        setStats({
          activeProjects: activeProjs.length,
          pendingTasks: pendingMs.length || allMilestones.length // fallback if none assigned
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
      <Text style={styles.greeting}>Hello, {userInfo?.name || 'Team Member'}</Text>
      <Text style={styles.subtitle}>Here is your workflow summary.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeProjects}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
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

export default TeamDashboardScreen;
