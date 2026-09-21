import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const ClientTimelineScreen = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      
      let allMilestones = [];
      for (const p of projRes.data) {
        const msRes = await API.get(`/milestones/project/${p.id}`);
        allMilestones = [...allMilestones, ...msRes.data];
      }
      
      setMilestones(allMilestones);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async (id) => {
    try {
      await API.put(`/milestones/${id}/approve`);
      Alert.alert('Success', 'Work approved successfully!');
      fetchTimeline();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve');
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.amount}>Cost: ₹{item.amount}</Text>
      
      {item.status === 'submitted' && (
        <Button 
          title="Approve Work" 
          onPress={() => approveMilestone(item.id)} 
          style={styles.actionBtn} 
        />
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Timeline</Text>
      <Text style={styles.subtitle}>Review milestones and approve submissions.</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={milestones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No milestones to display.</Text>}
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
  amount: { ...TYPOGRAPHY.body1, fontWeight: 'bold', color: COLORS.text },
  actionBtn: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg }
});

export default ClientTimelineScreen;
