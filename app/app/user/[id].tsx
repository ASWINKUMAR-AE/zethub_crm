import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import API from '../_services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import DotGridBackground from '../../components/DotGridBackground';

const UserWorkLogScreen = () => {
  const { id, name, email, role } = useLocalSearchParams();
  const router = useRouter();
  
  const [user, setUser] = useState<any>({ 
    id, 
    name: name || 'User', 
    email: email || '', 
    role: role || 'team' 
  });
  const [workLog, setWorkLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUserWork();
    }
  }, [id]);

  const fetchUserWork = async () => {
    try {
      setLoading(true);
      // We rely on route params for user info to prevent 404s if the specific user endpoint is restricted
      // const userRes = await API.get(`/users/${id}`);
      // setUser(userRes.data);

      // Fetch all milestones and filter by assigned_to
      // Note: Ideally the backend has /milestones/user/:id, but we'll fetch via projects as fallback
      const projRes = await API.get('/projects');
      let allMilestones: any[] = [];
      
      for (const p of projRes.data) {
        try {
          const msRes = await API.get(`/milestones/project/${p.id}`);
          allMilestones = [...allMilestones, ...msRes.data];
        } catch (e) {
          // ignore project milestone fetch errors
        }
      }

      // Filter milestones assigned to this user
      const filteredWork = allMilestones.filter(m => m.assigned_to === parseInt(id as string));
      setWorkLog(filteredWork);
      
    } catch (e) {
      console.error('Failed to fetch user work log:', e);
      // Fallback data
      setUser({ id, name: 'Sample User', email: 'user@zethub.in', role: 'team' });
      setWorkLog([
        { id: 1, title: 'UI Concept Design', status: 'approved', amount: 5000, targetDate: '2024-04-10' },
        { id: 2, title: 'Dashboard API Integration', status: 'pending', amount: 8000, targetDate: '2024-04-25' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderWorkItem = ({ item, index }: { item: any, index: number }) => (
    <View key={item.id?.toString() || index.toString()} style={styles.timelineItem}>
      <View style={styles.timelineIndicator}>
        <View style={[styles.timelineDot, { backgroundColor: item.status === 'approved' ? COLORS.success : COLORS.warning }]} />
        {index !== workLog.length - 1 && <View style={styles.timelineLine} />}
      </View>
      <Card style={styles.workCard}>
        <View style={styles.workHeader}>
          <Text style={styles.workTitle}>{item.title}</Text>
          <Badge status={item.status} text={undefined} style={undefined} />
        </View>
        <View style={styles.workDetails}>
          <View style={styles.detailItem}>
             <Clock size={14} color={COLORS.textSecondary} />
             <Text style={styles.detailText}>{item.targetDate || 'No deadline'}</Text>
          </View>
          <Text style={styles.amount}>₹ {item.amount}</Text>
        </View>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <DotGridBackground />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DotGridBackground />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Work Log</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* USER PROFILE CARD */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <View style={styles.roleContainer}>
                <Shield size={14} color={COLORS.primary} />
                <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.contactRow}>
            <Mail size={16} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>{user?.email}</Text>
          </View>
        </Card>

        {/* WORK LOG SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assigned Milestones</Text>
          <View style={styles.countBadge}>
             <Text style={styles.countText}>{workLog.length}</Text>
          </View>
        </View>

        {workLog.length === 0 ? (
          <View style={styles.emptyState}>
             <AlertCircle size={48} color={COLORS.border} />
             <Text style={styles.emptyText}>No assigned work found for this user.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
             {workLog.map((item, index) => renderWorkItem({ item, index }))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Simple Shield icon fallback since lucide-react-native is available
const Shield = ({ size, color }: { size: number, color: string }) => (
  <View style={{ marginRight: 4 }}>
    <CheckCircle2 size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: SPACING.md, 
    paddingBottom: SPACING.md 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: SPACING.sm
  },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  
  profileCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatarLarge: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  avatarLargeText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: 4 },
  roleContainer: { flexDirection: 'row', alignItems: 'center' },
  roleText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  contactText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginLeft: SPACING.sm },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, paddingHorizontal: 4 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginRight: SPACING.sm },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  countText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },

  listContainer: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.md },
  timelineIndicator: { alignItems: 'center', marginRight: SPACING.md, width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 18, zIndex: 1 },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: -10 },
  workCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: RADIUS.lg
  },
  workHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  workTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  workDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginLeft: 4 },
  amount: { ...TYPOGRAPHY.body2, fontWeight: 'bold', color: COLORS.text },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' }
});

export default UserWorkLogScreen;
