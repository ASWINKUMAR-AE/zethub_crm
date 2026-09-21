import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';

const AdminMilestonesScreen = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      
      let allMilestones = [];
      for (const p of projRes.data) {
        const msRes = await API.get(`/milestones/project/${p.id}`);
        allMilestones = [...allMilestones, ...msRes.data];
      }
      setMilestones(allMilestones);
    } catch (error) {
      console.error('Error fetching milestones', error);
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async (id) => {
    try {
      await API.put(`/milestones/${id}/approve`);
      Alert.alert('Success', 'Milestone approved');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve milestone');
    }
  };

  const handleCreateMilestone = async () => {
    if (!projectId || !title || !amount) {
      Alert.alert('Error', 'Project ID, Title, and Amount are required.');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/milestones', {
        project_id: parseInt(projectId),
        title,
        amount: parseFloat(amount),
        deadline: deadline || null,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
      });
      setModalVisible(false);
      setProjectId('');
      setTitle('');
      setAmount('');
      setDeadline('');
      setAssignedTo('');
      fetchData();
      Alert.alert('Success', 'Milestone created successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.status === 'paid' || a.status === 'approved') return 1;
    if (b.status === 'paid' || b.status === 'approved') return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'paid' || item.status === 'approved';

    return (
      <Card style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.header}>
          <Text style={[styles.titleText, isCompleted && styles.completedText]}>{item.title}</Text>
          <Badge status={item.status} />
        </View>
        <Text style={styles.amount}>₹ {item.amount}</Text>
        <Text style={styles.mutedText}>Project ID: {item.project_id} | Assigned: {item.AssignedTeam?.name || 'Unassigned'}</Text>
        
        {item.status === 'submitted' && (
          <Button 
            title="Approve Work" 
            variant="primary" 
            style={styles.actionBtn} 
            onPress={() => approveMilestone(item.id)} 
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>All Milestones</Text>
        <Button title="+ Add" onPress={() => setModalVisible(true)} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={sortedMilestones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No milestones found.</Text>}
        />
      )}

      {/* CREATE MILESTONE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Milestone</Text>

            <TextInput style={styles.input} placeholder="Project ID" keyboardType="numeric" value={projectId} onChangeText={setProjectId} />
            <TextInput style={styles.input} placeholder="Milestone Title" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Deadline (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} />
            <TextInput style={styles.input} placeholder="Assigned Team Member ID (Optional)" keyboardType="numeric" value={assignedTo} onChangeText={setAssignedTo} />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: SPACING.sm }} />
              <Button title="Create" loading={submitting} onPress={handleCreateMilestone} style={{ flex: 1, marginLeft: SPACING.sm }} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  card: { marginBottom: SPACING.md },
  completedCard: { opacity: 0.75, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  titleText: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1 },
  completedText: { textDecorationLine: 'line-through' },
  amount: { ...TYPOGRAPHY.body1, fontWeight: 'bold', color: COLORS.text, marginVertical: SPACING.xs },
  mutedText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  actionBtn: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
  
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.lg },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, padding: SPACING.xl, borderRadius: RADIUS.lg },
  modalTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg, color: COLORS.text },
  input: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, ...TYPOGRAPHY.body1 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md }
});

export default AdminMilestonesScreen;
