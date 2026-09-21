import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import API from '../_services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import DotGridBackground from '../../components/DotGridBackground';

const MilestonesScreen = () => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      
      let allMilestones: any[] = [];
      for (const p of projRes.data) {
        try {
          const msRes = await API.get(`/milestones/project/${p.id}`);
          allMilestones = [...allMilestones, ...msRes.data];
        } catch (e) {
          console.warn(`Failed to fetch milestones for project ${p.id}`);
        }
      }
      setMilestones(allMilestones);
    } catch (error) {
      console.error('Error fetching milestones', error);
      // Fallback
      setMilestones([
        { id: 1, title: 'UI Design Completion', amount: 5000, status: 'approved', project_id: 1, AssignedTeam: { name: 'John' } },
        { id: 2, title: 'Backend API Auth', amount: 8000, status: 'pending', project_id: 1, AssignedTeam: { name: 'Sarah' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async (id: number) => {
    try {
      await API.put(`/milestones/${id}/approve`);
      Alert.alert('Success', 'Milestone approved');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve milestone');
    }
  };

  const handleDateConfirm = (date: Date) => {
    setShowDatePicker(false);
    setDeadlineDate(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setDeadline(`${year}-${month}-${day}`);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
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
      setDeadlineDate(null);
      setShowDatePicker(false);
      setAssignedTo('');
      fetchData();
      Alert.alert('Success', 'Milestone created successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'paid' || item.status === 'approved';
    return (
      <Card style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.header}>
          <Text style={[styles.titleText, isCompleted && styles.completedText]}>{item.title}</Text>
          <Badge status={item.status} text={undefined} style={undefined} />
        </View>
        <Text style={styles.amount}>₹ {item.amount}</Text>
        <Text style={styles.mutedText}>Project ID: {item.project_id} | Assigned: {item.AssignedTeam?.name || 'Unassigned'}</Text>
        
        {item.status === 'submitted' && (
          <Button 
            title="Approve Work" 
            variant="primary" 
            style={styles.actionBtn} 
            onPress={() => approveMilestone(item.id)}
            textStyle={undefined}
            disabled={false}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <DotGridBackground />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tasks / Milestones</Text>
        <Button title="+ Add" onPress={() => setModalVisible(true)} style={undefined} textStyle={undefined} disabled={false} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={milestones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>No milestones found.</Text>}
        />
      )}

      {/* CREATE MILESTONE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Milestone</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Project ID" keyboardType="numeric" value={projectId} onChangeText={setProjectId} placeholderTextColor={COLORS.textSecondary} />
              <TextInput style={styles.input} placeholder="Milestone Title" value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textSecondary} />
              <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} placeholderTextColor={COLORS.textSecondary} />
              
              <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.dateText, !deadline && styles.placeholderText]}>
                  {deadline || "Select Deadline"}
                </Text>
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="Assigned Team Member ID (Optional)" keyboardType="numeric" value={assignedTo} onChangeText={setAssignedTo} placeholderTextColor={COLORS.textSecondary} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: SPACING.sm }} textStyle={undefined} disabled={false} />
              <Button title="Create" loading={submitting} onPress={handleCreateMilestone} style={{ flex: 1, marginLeft: SPACING.sm }} textStyle={undefined} disabled={false} />
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        minimumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  card: { marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  completedCard: { opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  titleText: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1 },
  completedText: { textDecorationLine: 'line-through' },
  amount: { ...TYPOGRAPHY.body1, fontWeight: 'bold', color: COLORS.text, marginVertical: SPACING.xs },
  mutedText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  actionBtn: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.lg },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, padding: SPACING.xl, borderRadius: RADIUS.lg, maxHeight: '80%' },
  modalTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg, color: COLORS.text },
  input: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, ...TYPOGRAPHY.body1, color: COLORS.text },
  dateInput: { justifyContent: 'center' },
  dateText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  placeholderText: { color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md }
});

export default MilestonesScreen;
