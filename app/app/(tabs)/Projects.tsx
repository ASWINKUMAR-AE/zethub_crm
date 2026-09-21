import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Modal, TextInput, TouchableOpacity, Alert, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRouter } from 'expo-router';
import API from '../_services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import { useAuth } from '../_context/AuthContext';
import DotGridBackground from '../../components/DotGridBackground';

// ─── Constants ────────────────────────────────────────────
const PROJECT_TYPES = ['React', 'React Native', 'Full Stack', 'Backend', 'Other'];
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const TOTAL_STEPS = 2;

const STEP_LABELS = [
  { num: 1, title: 'Project & Client' },
  { num: 2, title: 'Team & Details' },
];

// ─── Reusable Dropdown Component ──────────────────────────
const Dropdown = ({ label, options, value, onSelect }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownToggle]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || label}
        </Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.dropdownItem,
                value === opt && styles.dropdownItemActive,
              ]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[
                styles.dropdownItemText,
                value === opt && styles.dropdownItemTextActive,
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionLine} />
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

// ─── Step Indicator ───────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <View style={styles.stepContainer}>
    {STEP_LABELS.map((step, index) => {
      const isActive = currentStep === step.num;
      const isCompleted = currentStep > step.num;
      return (
        <React.Fragment key={step.num}>
          {index > 0 && (
            <View style={[styles.stepConnector, isCompleted && styles.stepConnectorActive]} />
          )}
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              isActive && styles.stepCircleActive,
              isCompleted && styles.stepCircleCompleted,
            ]}>
              {isCompleted ? (
                <Text style={styles.stepCheckmark}>✓</Text>
              ) : (
                <Text style={[
                  styles.stepNumber,
                  (isActive || isCompleted) && styles.stepNumberActive,
                ]}>{step.num}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              isActive && styles.stepLabelActive,
              isCompleted && styles.stepLabelCompleted,
            ]}>{step.title}</Text>
          </View>
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────
const ProjectsScreen = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ── Form Fields ──
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [status, setStatus] = useState('Pending');

  // ── Team Members ──
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.error('Failed to fetch projects:', e);
      // Sample data fallback
      setProjects([
        { id: 1, name: 'SaaS Platform Redesign', clientName: 'Acme Corp', status: 'in_progress', deadline: '2026-12-12', projectType: 'Full Stack' },
        { id: 2, name: 'Marketing Automation', clientName: 'Globex Ltd', status: 'pending', deadline: '2027-01-05', projectType: 'React' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setClientId('');
    setDeadline('');
    setDeadlineDate(null);
    setShowDatePicker(false);
    setProjectType('');
    setClientName('');
    setCompanyName('');
    setClientContact('');
    setDescription('');
    setTechStackInput('');
    setStatus('Pending');
    setTeamMembers([]);
    setMemberName('');
    setMemberRole('');
    setCurrentStep(1);
  };

  // ── Date Picker Handlers ──
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

  const addTeamMember = () => {
    if (!memberName.trim()) {
      Alert.alert('Error', 'Please enter a member name');
      return;
    }
    setTeamMembers([...teamMembers, {
      name: memberName.trim(),
      role: memberRole.trim() || 'Member',
    }]);
    setMemberName('');
    setMemberRole('');
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Required', 'Project Name is required'); return false; }
      if (!clientName.trim()) { Alert.alert('Required', 'Client Name is required'); return false; }
      if (!deadline) { Alert.alert('Required', 'Please select a deadline'); return false; }
      return true;
    }
    if (step === 2) {
      if (teamMembers.length === 0) { Alert.alert('Required', 'At least 1 team member is required'); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const handleCreateProject = async () => {
    if (!validateStep(2)) return;
    const techStack = techStackInput.split(',').map(t => t.trim()).filter(Boolean);
    const projectData = {
      name: name.trim(),
      client_id: clientId ? parseInt(clientId) : null,
      deadline,
      projectType,
      clientName,
      companyName,
      clientContact,
      teamMembers,
      description,
      techStack,
      status,
    };

    setSubmitting(true);
    try {
      await API.post('/admin/projects/create', projectData);
      setModalVisible(false);
      resetForm();
      fetchProjects();
      Alert.alert('Success', 'Project created successfully');
    } catch (e) {
      console.error('Failed to create project:', e);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    return (
      <Card style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.header}>
          <Text style={[styles.projectName, isCompleted && styles.completedText]}>{item.name}</Text>
          <Badge status={item.status} text={undefined} style={undefined} />
        </View>
        <Text style={styles.clientNameText}>Client: {item.clientName}</Text>
        <Text style={styles.deadline}>Deadline: {item.deadline || 'N/A'}</Text>
        <View style={styles.actionRow}>
          <Button title="Manage Tasks" variant="outline" style={styles.actionButton} onPress={() => router.push('/Milestones')} textStyle={undefined} disabled={false} />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <DotGridBackground />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Projects</Text>
        <Button title="+ New Project" onPress={() => setModalVisible(true)} style={undefined} textStyle={undefined} disabled={false} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No projects found</Text>}
        />
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Project</Text>
            <StepIndicator currentStep={currentStep} />

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              {currentStep === 1 && (
                <View>
                  <SectionHeader title="Project Info" />
                  <Text style={styles.fieldLabel}>Project Name *</Text>
                  <TextInput style={styles.input} placeholder="Project Name" value={name} onChangeText={setName} placeholderTextColor={COLORS.textSecondary} />
                  
                  <Text style={styles.fieldLabel}>Deadline *</Text>
                  <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setShowDatePicker(true)}>
                    <Text style={[styles.dateText, !deadline && styles.placeholderText]}>
                      {deadline || "Select Deadline"}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.fieldLabel}>Project Type</Text>
                  <Dropdown label="Select Type" options={PROJECT_TYPES} value={projectType} onSelect={setProjectType} />

                  <SectionHeader title="Client Details" />
                  <Text style={styles.fieldLabel}>Client Name *</Text>
                  <TextInput style={styles.input} placeholder="Client Name" value={clientName} onChangeText={setClientName} placeholderTextColor={COLORS.textSecondary} />
                </View>
              )}

              {currentStep === 2 && (
                <View>
                  <SectionHeader title="Team Members" />
                  <View style={styles.addMemberRow}>
                    <TextInput style={[styles.input, styles.memberInput]} placeholder="Name" value={memberName} onChangeText={setMemberName} placeholderTextColor={COLORS.textSecondary} />
                    <TextInput style={[styles.input, styles.memberInput]} placeholder="Role" value={memberRole} onChangeText={setMemberRole} placeholderTextColor={COLORS.textSecondary} />
                  </View>
                  <Button title="Add Member" variant="outline" onPress={addTeamMember} style={undefined} textStyle={undefined} disabled={false} />

                  <SectionHeader title="Description" />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Project description..." value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor={COLORS.textSecondary} />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              {currentStep === 1 ? (
                <>
                  <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} textStyle={undefined} disabled={false} />
                  <Button title="Next →" onPress={handleNext} style={{ flex: 1, marginLeft: 8 }} textStyle={undefined} disabled={false} />
                </>
              ) : (
                <>
                  <Button title="← Back" variant="outline" onPress={() => setCurrentStep(1)} style={{ flex: 1, marginRight: 8 }} textStyle={undefined} disabled={false} />
                  <Button title="Create" loading={submitting} onPress={handleCreateProject} style={{ flex: 1, marginLeft: 8 }} textStyle={undefined} disabled={false} />
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
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
  list: { paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  completedCard: { opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  projectName: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1 },
  completedText: { textDecorationLine: 'line-through' },
  clientNameText: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary },
  deadline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  actionRow: { flexDirection: 'row', marginTop: SPACING.xs },
  actionButton: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.md },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, maxHeight: '80%' },
  modalTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.md, color: COLORS.text },
  formScroll: { marginVertical: SPACING.md },
  fieldLabel: { ...TYPOGRAPHY.body2, fontWeight: '600', marginBottom: 4, color: COLORS.text },
  input: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, marginBottom: 16, color: COLORS.text },
  dateInput: { justifyContent: 'center' },
  dateText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  placeholderText: { color: COLORS.textSecondary },
  textArea: { height: 100, paddingTop: 12 },
  modalActions: { flexDirection: 'row', borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 16 },
  
  // Dropdown
  dropdownWrapper: { marginBottom: 16 },
  dropdownToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  dropdownArrow: { fontSize: 12, color: COLORS.textSecondary },
  dropdownMenu: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginTop: -12, marginBottom: 16 },
  dropdownItem: { padding: 12 },
  dropdownItemActive: { backgroundColor: COLORS.primary + '10' },
  dropdownItemText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  dropdownItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  
  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionTitle: { paddingHorizontal: 10, ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },

  // Step Indicator
  stepContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepCircleCompleted: { backgroundColor: COLORS.success },
  stepNumber: { color: COLORS.textSecondary, fontWeight: 'bold' },
  stepNumberActive: { color: '#FFF' },
  stepCheckmark: { color: '#FFF', fontWeight: 'bold' },
  stepLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },
  stepLabelActive: { color: COLORS.primary },
  stepLabelCompleted: { color: COLORS.success },
  stepConnector: { width: 40, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8 },
  stepConnectorActive: { backgroundColor: COLORS.success },
  
  // Members
  addMemberRow: { flexDirection: 'row', gap: 8 },
  memberInput: { flex: 1 }
});

export default ProjectsScreen;
