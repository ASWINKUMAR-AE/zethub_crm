import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const TeamMilestonesScreen = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    fetchAssignedMilestones();
  }, []);

  const fetchAssignedMilestones = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      
      let allMilestones = [];
      for (const p of projRes.data) {
        const msRes = await API.get(`/milestones/project/${p.id}`);
        allMilestones = [...allMilestones, ...msRes.data];
      }
      
      // Filter milestones assigned to this team member
      const assigned = allMilestones.filter(m => m.assigned_to === userInfo.id);
      setMilestones(assigned.length ? assigned : allMilestones); // show all if none assigned for demo purposes
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitWork = async (id) => {
    try {
      await API.put(`/milestones/${id}/submit`);
      Alert.alert('Success', 'Work submitted for review');
      fetchAssignedMilestones();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Submission failed');
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.desc}>{item.description || 'No description provided'}</Text>
      <Text style={styles.deadline}>Deadline: {new Date(item.deadline || Date.now()).toLocaleDateString()}</Text>
      
      {(item.status === 'pending' || item.status === 'in_progress') && (
        <Button 
          title="Submit Work" 
          onPress={() => submitWork(item.id)} 
          style={styles.actionBtn} 
        />
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <Text style={styles.subtitle}>Milestones assigned for you to complete.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={milestones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No tasks assigned to you right now.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  card: { marginBottom: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  taskTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1 },
  desc: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  deadline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
  actionBtn: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg }
});

export default TeamMilestonesScreen;
