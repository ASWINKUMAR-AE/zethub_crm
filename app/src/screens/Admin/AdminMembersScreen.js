import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';

// Backend prompt function
const sendBackendPrompt = (action, data) => {
  const prompt = `Backend Request: ${action}\nData: ${JSON.stringify(data, null, 2)}\n\nPlease implement the backend functionality for this action.`;
  console.log(prompt);
  Alert.alert('Backend Request', prompt);
};

const AdminMembersScreen = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  // Sample data for demonstration
  const sampleMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@zethub.com",
      role: "Admin",
      status: "active",
      joined: "2024-01-15",
      avatar: null
    },
    {
      id: 2,
      name: "Marcus Vane",
      email: "marcus.vane@zethub.com",
      role: "Manager",
      status: "active",
      joined: "2024-02-20",
      avatar: null
    },
    {
      id: 3,
      name: "Jessica Moore",
      email: "jessica.moore@zethub.com",
      role: "Member",
      status: "active",
      joined: "2024-03-10",
      avatar: null
    },
    {
      id: 4,
      name: "Alex Johnson",
      email: "alex.johnson@zethub.com",
      role: "Member",
      status: "pending",
      joined: "2024-11-28",
      avatar: null
    },
    {
      id: 5,
      name: "Emma Wilson",
      email: "emma.wilson@zethub.com",
      role: "Admin",
      status: "active",
      joined: "2023-12-05",
      avatar: null
    }
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Try to fetch from API first
      const res = await API.get('/members');
      setMembers(res.data);
    } catch (e) {
      console.error('Failed to fetch members, using sample data:', e);
      // Use sample data if API fails
      setMembers(sampleMembers);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      sendBackendPrompt('send_invite', { email: inviteEmail, role: inviteRole });
      
      // Try to send via API
      await API.post('/members/invite', { email: inviteEmail, role: inviteRole });
      
      setInviteModalVisible(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchMembers();
      Alert.alert('Success', 'Invite sent successfully');
    } catch (e) {
      console.error('Failed to send invite:', e);
      Alert.alert('Info', 'Backend request logged. Please implement the backend functionality.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async () => {
    if (!editName || !editEmail) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const updateData = { name: editName, email: editEmail, role: editRole };
      sendBackendPrompt('edit_member', { memberId: selectedMember.id, memberData: updateData });
      
      // Try to update via API
      await API.put(`/members/${selectedMember.id}`, updateData);
      
      setEditModalVisible(false);
      setSelectedMember(null);
      setEditName('');
      setEditEmail('');
      setEditRole('member');
      fetchMembers();
      Alert.alert('Success', 'Member updated successfully');
    } catch (e) {
      console.error('Failed to update member:', e);
      Alert.alert('Info', 'Backend request logged. Please implement the backend functionality.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (member) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              sendBackendPrompt('delete_member', { memberId: member.id });
              
              // Try to delete via API
              await API.delete(`/members/${member.id}`);
              
              fetchMembers();
              Alert.alert('Success', 'Member removed successfully');
            } catch (e) {
              console.error('Failed to delete member:', e);
              Alert.alert('Info', 'Backend request logged. Please implement the backend functionality.');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditModalVisible(true);
  };

  const getFilteredMembers = () => {
    let filtered = members;
    
    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter(m => m.status === 'active');
    } else if (filter === 'pending') {
      filtered = filtered.filter(m => m.status === 'pending');
    } else if (filter === 'admin') {
      filtered = filtered.filter(m => m.role === 'Admin');
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderMemberItem = ({ item }) => (
    <Card style={styles.memberCard}>
      <View style={styles.memberRow}>
        <View style={styles.memberInfo}>
          <View style={styles.avatar}>
            {item.avatar ? (
              <Text style={styles.avatarText}>Avatar</Text>
            ) : (
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        </View>
        
        <View style={styles.memberMeta}>
          <View style={[
            styles.roleBadge,
            item.role === 'Admin' ? styles.adminBadge : 
            item.role === 'Manager' ? styles.managerBadge : 
            styles.memberBadge
          ]}>
            <Text style={[
              styles.roleText,
              item.role === 'Admin' ? styles.adminText : 
              item.role === 'Manager' ? styles.managerText : 
              styles.memberText
            ]}>{item.role}</Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            item.status === 'active' ? styles.activeBadge : styles.pendingBadge
          ]}>
            <View style={[
              styles.statusDot,
              item.status === 'active' ? styles.activeDot : styles.pendingDot
            ]} />
            <Text style={[
              styles.statusText,
              item.status === 'active' ? styles.activeText : styles.pendingText
            ]}>{item.status === 'active' ? 'Active' : 'Pending'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.memberFooter}>
        <Text style={styles.joinedText}>Joined {new Date(item.joined).toLocaleDateString()}</Text>
        <Text style={styles.daysAgoText}>{getDaysAgo(item.joined)} days ago</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteMember(item)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType ? styles.activeFilterButton : styles.inactiveFilterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType ? styles.activeFilterText : styles.inactiveFilterText
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Team Members</Text>
            <Text style={styles.subtitle}>Manage your team members and their permissions</Text>
          </View>
          <View style={styles.headerButtons}>
            <Button 
              title="Export" 
              variant="outline" 
              onPress={() => sendBackendPrompt('export_members', { format: 'csv', allMembers: members })}
              style={styles.headerButton}
            />
            <Button 
              title="Invite" 
              onPress={() => setInviteModalVisible(true)}
              style={styles.headerButton}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>👥</Text>
              </View>
              <Text style={styles.statChange}>+8.2%</Text>
            </View>
            <Text style={styles.statLabel}>Total Members</Text>
            <Text style={styles.statValue}>{members.length}</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>✓</Text>
              </View>
              <Text style={[styles.statChange, styles.statChangeActive]}>Active</Text>
            </View>
            <Text style={styles.statLabel}>Active Now</Text>
            <Text style={styles.statValue}>{members.filter(m => m.status === 'active').length}</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>⏳</Text>
              </View>
              <Text style={[styles.statChange, styles.statChangePending]}>Pending</Text>
            </View>
            <Text style={styles.statLabel}>Pending Invites</Text>
            <Text style={styles.statValue}>{members.filter(m => m.status === 'pending').length}</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>👑</Text>
              </View>
              <Text style={[styles.statChange, styles.statChangeAdmin]}>Admin</Text>
            </View>
            <Text style={styles.statLabel}>Admin Users</Text>
            <Text style={styles.statValue}>{members.filter(m => m.role === 'Admin').length}</Text>
          </Card>
        </View>

        {/* Search and Filters */}
        <Card style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          
          <View style={styles.filterContainer}>
            {renderFilterButton('all', 'All')}
            {renderFilterButton('active', 'Active')}
            {renderFilterButton('pending', 'Pending')}
            {renderFilterButton('admin', 'Admin')}
          </View>
        </Card>

        {/* Members List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={getFilteredMembers()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMemberItem}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite New Member</Text>
            
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="member@example.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.rolePicker}>
              {['member', 'admin', 'manager'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    inviteRole === role ? styles.selectedRole : styles.unselectedRole
                  ]}
                  onPress={() => setInviteRole(role)}
                >
                  <Text style={[
                    styles.roleOptionText,
                    inviteRole === role ? styles.selectedRoleText : styles.unselectedRoleText
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button 
                title="Cancel" 
                variant="outline" 
                onPress={() => setInviteModalVisible(false)} 
                style={{ flex: 1, marginRight: SPACING.sm }} 
              />
              <Button 
                title="Send Invite" 
                loading={submitting}
                onPress={handleSendInvite} 
                style={{ flex: 1, marginLeft: SPACING.sm }} 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Member</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />
            
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.rolePicker}>
              {['member', 'admin', 'manager'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    editRole === role ? styles.selectedRole : styles.unselectedRole
                  ]}
                  onPress={() => setEditRole(role)}
                >
                  <Text style={[
                    styles.roleOptionText,
                    editRole === role ? styles.selectedRoleText : styles.unselectedRoleText
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button 
                title="Cancel" 
                variant="outline" 
                onPress={() => setEditModalVisible(false)} 
                style={{ flex: 1, marginRight: SPACING.sm }} 
              />
              <Button 
                title="Update" 
                loading={submitting}
                onPress={handleEditMember} 
                style={{ flex: 1, marginLeft: SPACING.sm }} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  headerButton: {
    flex: 1,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 16,
  },
  statChange: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    color: COLORS.success,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statChangeActive: {
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  statChangePending: {
    color: COLORS.warning,
    backgroundColor: COLORS.warning + '20',
  },
  statChangeAdmin: {
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  
  // Search and Filters
  searchCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...TYPOGRAPHY.body1,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  inactiveFilterButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: COLORS.surface,
  },
  inactiveFilterText: {
    color: COLORS.text,
  },
  
  // Member Cards
  memberCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 2,
  },
  memberEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  memberMeta: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  adminBadge: {
    backgroundColor: COLORS.primary,
  },
  managerBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  adminText: {
    color: COLORS.surface,
  },
  managerText: {
    color: COLORS.text,
  },
  memberText: {
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  activeBadge: {
    backgroundColor: COLORS.success + '20',
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  activeDot: {
    backgroundColor: COLORS.success,
  },
  pendingDot: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  activeText: {
    color: COLORS.success,
  },
  pendingText: {
    color: COLORS.warning,
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  joinedText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
  },
  daysAgoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error,
  },
  actionButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.lg,
    color: COLORS.text,
  },
  inputLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...TYPOGRAPHY.body1,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: COLORS.primary,
  },
  unselectedRole: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  selectedRoleText: {
    color: COLORS.surface,
  },
  unselectedRoleText: {
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default AdminMembersScreen;
