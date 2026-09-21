import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Modal, TextInput, TouchableOpacity, Alert, ScrollView,
  KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';

// ─── Constants ────────────────────────────────────────────
const PROJECT_TYPES = ['React', 'React Native', 'Full Stack', 'Backend', 'Other'];
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const TOTAL_STEPS = 2;

const STEP_LABELS = [
  { num: 1, title: 'Project & Client' },
  { num: 2, title: 'Team & Details' },
];

// ─── Reusable Dropdown Component ──────────────────────────
const Dropdown = ({ label, options, value, onSelect }) => {
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
          {options.map((opt) => (
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
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionLine} />
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

// ─── Step Indicator ───────────────────────────────────────
const StepIndicator = ({ currentStep, totalSteps }) => (
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
const AdminProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ── Form Fields ──
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [status, setStatus] = useState('Pending');

  // ── Team Members ──
  const [teamMembers, setTeamMembers] = useState([]);
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
      setProjects([
        { id: 1, name: 'SaaS Platform Redesign', client_name: 'Acme Corp', status: 'in_progress', deadline: '2026-12-12', projectType: 'Full Stack', clientName: 'John Doe' },
        { id: 2, name: 'Marketing Automation', client_name: 'Globex Ltd', status: 'pending', deadline: '2027-01-05', projectType: 'React', clientName: 'Jane Smith' },
        { id: 3, name: 'API Security Audit', client_name: 'Cyberdyne Inc', status: 'in_progress', deadline: '2027-02-18', projectType: 'Backend', clientName: 'Mike Johnson' },
        { id: 4, name: 'Brand Identity 2.0', client_name: 'Initech Ventures', status: 'pending', deadline: '2027-03-12', projectType: 'Other', clientName: 'Sarah Wilson' },
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
  const handleDateConfirm = (date) => {
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

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  const removeTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  // ── Per-step Validation ──
  const validateStep = (step) => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required', 'Project Name is required');
        return false;
      }
      if (!clientName.trim()) {
        Alert.alert('Required', 'Client Name is required');
        return false;
      }
      if (!deadline) {
        Alert.alert('Required', 'Please select a deadline');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (teamMembers.length === 0) {
        Alert.alert('Required', 'At least 1 team member is required');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProject = async () => {
    // Final validation on step 2
    if (!validateStep(2)) return;
    // Also re-validate step 1 in case
    if (!validateStep(1)) return;

    const techStack = techStackInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const projectData = {
      projectName: name.trim(),
      clientId: clientId.trim(),
      deadline: deadline.trim(),
      projectType,
      clientName: clientName.trim(),
      companyName: companyName.trim(),
      clientContact: clientContact.trim(),
      teamMembers,
      description: description.trim(),
      techStack,
      status,
    };

    setSubmitting(true);
    try {
      await API.post('/admin/projects/create', {
        name: projectData.projectName,
        client_id: projectData.clientId ? parseInt(projectData.clientId) : null,
        deadline: projectData.deadline || null,
        projectType: projectData.projectType,
        clientName: projectData.clientName,
        companyName: projectData.companyName,
        clientContact: projectData.clientContact,
        teamMembers: projectData.teamMembers,
        description: projectData.description,
        techStack: projectData.techStack,
        status: projectData.status,
      });
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

  const completeProject = async (id) => {
    try {
      await API.put(`/projects/${id}/complete`);
      fetchProjects();
      Alert.alert('Success', 'Project marked as complete');
    } catch (e) {
      console.error('Failed to complete project:', e);
      Alert.alert('Error', 'Failed to complete project.');
    }
  };

  // ── Helpers ──
  const getStatusLabel = (s) => {
    const map = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
    return map[s] || s;
  };

  const getProjectTypeBadge = (type) => {
    if (!type) return null;
    const colorMap = {
      'React': '#61DAFB',
      'React Native': '#0088CC',
      'Full Stack': '#6C3FC5',
      'Backend': '#38A169',
      'Other': '#A0AEC0',
    };
    return (
      <View style={[styles.typeBadge, { backgroundColor: colorMap[type] || '#A0AEC0' }]}>
        <Text style={styles.typeBadgeText}>{type}</Text>
      </View>
    );
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // ── Render Project Card ──
  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';

    return (
      <Card style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.projectName, isCompleted && styles.completedText]}>{item.name}</Text>
            {getProjectTypeBadge(item.projectType)}
          </View>
          <Badge status={getStatusLabel(item.status)} />
        </View>
        <Text style={styles.clientNameText}>
          Client: {item.clientName || item.Client?.name || `ID: ${item.client_id}`}
        </Text>
        {item.companyName ? (
          <Text style={styles.companyText}>Company: {item.companyName}</Text>
        ) : null}
        <Text style={styles.deadline}>
          Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}
        </Text>
        {item.teamMembers && item.teamMembers.length > 0 && (
          <View style={styles.teamChips}>
            {item.teamMembers.slice(0, 3).map((m, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{m.name}</Text>
              </View>
            ))}
            {item.teamMembers.length > 3 && (
              <View style={[styles.chip, styles.chipMore]}>
                <Text style={styles.chipText}>+{item.teamMembers.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {!isCompleted && (
          <View style={styles.actionRow}>
            <Button
              title="Manage Tasks"
              variant="outline"
              style={styles.actionButton}
              onPress={() => navigation.navigate('Milestones')}
            />
            <Button
              title="End Project"
              variant="primary"
              style={styles.completeBtn}
              onPress={() => completeProject(item.id)}
            />
          </View>
        )}
      </Card>
    );
  };

  // ══════════════════════════════════════════════════════════
  //  STEP 1 — Project Info & Client Details
  // ══════════════════════════════════════════════════════════
  const renderStep1 = () => (
    <View>
      {/* ─── Project Info ─── */}
      <SectionHeader title="Project Info" />

      <Text style={styles.fieldLabel}>Project Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Enter project name"
        placeholderTextColor={COLORS.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.fieldLabel}>Project Type</Text>
      <Dropdown
        label="Select Project Type"
        options={PROJECT_TYPES}
        value={projectType}
        onSelect={setProjectType}
      />

      <Text style={styles.fieldLabel}>Deadline</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.textSecondary}
        value={deadline}
        onChangeText={setDeadline}
      />

      <Text style={styles.fieldLabel}>Status</Text>
      <Dropdown
        label="Select Status"
        options={STATUS_OPTIONS}
        value={status}
        onSelect={setStatus}
      />

      {/* ─── Client Details ─── */}
      <SectionHeader title="Client Details" />

      <Text style={styles.fieldLabel}>Client Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Enter client name"
        placeholderTextColor={COLORS.textSecondary}
        value={clientName}
        onChangeText={setClientName}
      />

      <Text style={styles.fieldLabel}>Company Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter company name"
        placeholderTextColor={COLORS.textSecondary}
        value={companyName}
        onChangeText={setCompanyName}
      />

      <Text style={styles.fieldLabel}>Client Contact</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone or email"
        placeholderTextColor={COLORS.textSecondary}
        value={clientContact}
        onChangeText={setClientContact}
        keyboardType="email-address"
      />

      <Text style={styles.fieldLabel}>Client ID</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3 (optional)"
        placeholderTextColor={COLORS.textSecondary}
        keyboardType="numeric"
        value={clientId}
        onChangeText={setClientId}
      />
    </View>
  );

  // ══════════════════════════════════════════════════════════
  //  STEP 2 — Team Members & Project Details
  // ══════════════════════════════════════════════════════════
  const renderStep2 = () => (
    <View>
      {/* ─── Team Members ─── */}
      <SectionHeader title="Team Members" />

      {teamMembers.length > 0 && (
        <View style={styles.membersList}>
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => removeTeamMember(index)}
                style={styles.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.addMemberRow}>
        <TextInput
          style={[styles.input, styles.memberInput]}
          placeholder="Name"
          placeholderTextColor={COLORS.textSecondary}
          value={memberName}
          onChangeText={setMemberName}
        />
        <TextInput
          style={[styles.input, styles.memberInput]}
          placeholder="Role"
          placeholderTextColor={COLORS.textSecondary}
          value={memberRole}
          onChangeText={setMemberRole}
        />
      </View>
      <TouchableOpacity style={styles.addMemberBtn} onPress={addTeamMember}>
        <Text style={styles.addMemberBtnText}>+ Add Member</Text>
      </TouchableOpacity>

      {teamMembers.length === 0 && (
        <Text style={styles.helperText}>* At least 1 team member required</Text>
      )}
      {teamMembers.length > 0 && (
        <Text style={styles.memberCount}>{teamMembers.length} member{teamMembers.length > 1 ? 's' : ''} added</Text>
      )}

      {/* ─── Project Details ─── */}
      <SectionHeader title="Project Details" />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the project..."
        placeholderTextColor={COLORS.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.fieldLabel}>Tech Stack</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. React, Node.js, MongoDB"
        placeholderTextColor={COLORS.textSecondary}
        value={techStackInput}
        onChangeText={setTechStackInput}
      />
      <Text style={styles.helperText}>Separate with commas</Text>
    </View>
  );

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>All Projects</Text>
        <Button title="+ New Project" onPress={() => setModalVisible(true)} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={sortedProjects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No projects found</Text>}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          CREATE PROJECT MODAL — MULTI-STEP
          ══════════════════════════════════════════════════════ */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <Text style={styles.modalTitle}>Create New Project</Text>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            {/* Step subtitle */}
            <Text style={styles.stepSubtitle}>
              Part {currentStep} of {TOTAL_STEPS} — {STEP_LABELS[currentStep - 1].title}
            </Text>

            {/* Scrollable Form Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
            </ScrollView>

            {/* ─── Navigation Buttons ─── */}
            <View style={styles.modalActions}>
              {currentStep === 1 ? (
                <>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => { setModalVisible(false); resetForm(); }}
                    style={{ flex: 1, marginRight: SPACING.sm }}
                  />
                  <Button
                    title="Next →"
                    onPress={handleNext}
                    style={{ flex: 1, marginLeft: SPACING.sm }}
                  />
                </>
              ) : (
                <>
                  <Button
                    title="← Back"
                    variant="outline"
                    onPress={handleBack}
                    style={{ flex: 1, marginRight: SPACING.sm }}
                  />
                  <Button
                    title="Create Project"
                    loading={submitting}
                    onPress={handleCreateProject}
                    style={{ flex: 1, marginLeft: SPACING.sm }}
                  />
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker — must be OUTSIDE the main Modal to avoid nested modal issues */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={deadlineDate || new Date()}
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
      />
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  list: { paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md },
  completedCard: { opacity: 0.75, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: SPACING.sm },
  projectName: { ...TYPOGRAPHY.h3, color: COLORS.text, marginRight: SPACING.sm, flexShrink: 1 },
  completedText: { textDecorationLine: 'line-through' },
  clientNameText: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginBottom: 2 },
  companyText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 2 },
  deadline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  actionButton: { height: 36, flex: 1 },
  completeBtn: { height: 36, flex: 1, backgroundColor: '#000' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },

  // Type badge on card
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  typeBadgeText: { ...TYPOGRAPHY.caption, color: '#FFF', fontWeight: '600' },

  // Team chips on card
  teamChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  chip: { backgroundColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  chipMore: { backgroundColor: COLORS.secondary },
  chipText: { ...TYPOGRAPHY.caption, color: COLORS.text },

  // ── Modal ──
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.md },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  modalTitle: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.md },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // ── Step Indicator ──
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepCircleCompleted: { backgroundColor: COLORS.success },
  stepNumber: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary },
  stepNumberActive: { color: '#FFF' },
  stepCheckmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  stepLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLabelCompleted: { color: COLORS.success, fontWeight: '600' },
  stepConnector: {
    height: 2,
    width: 50,
    backgroundColor: COLORS.border,
    marginBottom: 18,
    marginHorizontal: SPACING.sm,
  },
  stepConnectorActive: { backgroundColor: COLORS.success },

  // ── Step subtitle ──
  stepSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: '500',
  },

  // ── Form scroll ──
  formScroll: { flex: 1 },
  formScrollContent: { paddingBottom: SPACING.md },

  // ── Form ──
  fieldLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: COLORS.error },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  textArea: { height: 100, paddingTop: SPACING.sm },
  datePickerField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePickerText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  calendarIcon: { fontSize: 18 },
  helperText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: -8, marginBottom: SPACING.md },

  // ── Section ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionTitle: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textSecondary, marginHorizontal: SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },

  // ── Dropdown ──
  dropdownWrapper: { marginBottom: SPACING.md, zIndex: 10 },
  dropdownToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  dropdownText: { ...TYPOGRAPHY.body1, color: COLORS.text },
  placeholderText: { color: COLORS.textSecondary },
  dropdownArrow: { fontSize: 10, color: COLORS.textSecondary },
  dropdownMenu: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: SPACING.md },
  dropdownItemActive: { backgroundColor: COLORS.primary },
  dropdownItemText: { ...TYPOGRAPHY.body2, color: COLORS.text },
  dropdownItemTextActive: { color: '#FFF', fontWeight: '600' },

  // ── Team Members ──
  membersList: { marginBottom: SPACING.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  memberName: { ...TYPOGRAPHY.body2, fontWeight: '600', color: COLORS.text },
  memberRole: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  memberCount: { ...TYPOGRAPHY.caption, color: COLORS.success, fontWeight: '600', marginBottom: SPACING.sm },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: COLORS.error, fontWeight: '700' },
  addMemberRow: { flexDirection: 'row', gap: SPACING.sm },
  memberInput: { flex: 1 },
  addMemberBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  addMemberBtnText: { ...TYPOGRAPHY.body2, color: COLORS.primary, fontWeight: '600' },
});

export default AdminProjectsScreen;
