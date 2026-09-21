import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import API from '../_services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import DotGridBackground from '../../components/DotGridBackground';
import { Search, UserPlus, Mail, Shield, User } from 'lucide-react-native';

const TeamScreen = () => {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('team'); 
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.error('Failed to fetch team members:', e);
      // Fallback for demonstration
      setUsers([
        { id: 1, name: 'Aswin Kumar', email: 'aswin@zethub.in', role: 'admin' },
        { id: 2, name: 'Sarah Chen', email: 'sarah.chen@zethub.com', role: 'team' },
        { id: 3, name: 'Marcus Vane', email: 'marcus.vane@zethub.com', role: 'client' },
        { id: 4, name: 'Elena Petrova', email: 'elena.p@zethub.com', role: 'team' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!name || !email || !password || !role) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      const userData = { name, email, password, role };
      await API.post('/users', userData);
      setModalVisible(false);
      resetForm();
      fetchUsers();
      Alert.alert('Success', 'Team member added successfully');
    } catch (e) {
      console.error('Failed to create user:', e);
      Alert.alert('Info', 'Backend request logged. Please verify API stability.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('team');
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getRoleColor = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'admin': return '#FFFFFF';
      case 'team': return COLORS.textSecondary;
      case 'client': return '#94A3B8';
      default: return COLORS.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => router.push({ 
        pathname: '/user/[id]', 
        params: { id: item.id, name: item.name, email: item.email, role: item.role } 
      })}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.memberInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { borderColor: getRoleColor(item.role) }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <DotGridBackground />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Team Management</Text>
        <Button 
           title="+ Add User" 
           onPress={() => setModalVisible(true)} 
           style={undefined} 
           textStyle={undefined} 
           disabled={false} 
        />
      </View>

      <View style={styles.searchContainer}>
        <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search team members..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={getFilteredUsers()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No team members found</Text>}
        />
      )}

      {/* ADD USER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Team Member</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <User color={COLORS.textSecondary} size={18} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor={COLORS.textSecondary} />
              </View>
              
              <View style={styles.inputGroup}>
                <Mail color={COLORS.textSecondary} size={18} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholderTextColor={COLORS.textSecondary} />
              </View>

              <View style={styles.inputGroup}>
                <Shield color={COLORS.textSecondary} size={18} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={COLORS.textSecondary} />
              </View>

              <Text style={styles.label}>Select Role</Text>
              <View style={styles.roleContainer}>
                {['admin', 'team', 'client'].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleOption, role === r && styles.roleOptionActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionActiveText]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: SPACING.sm }} textStyle={undefined} disabled={false} />
              <Button title="Create" loading={submitting} onPress={handleAddUser} style={{ flex: 1, marginLeft: SPACING.sm }} textStyle={undefined} disabled={false} />
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
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, height: 48, color: COLORS.text, ...TYPOGRAPHY.body1 },
  list: { paddingBottom: 100 },
  card: { 
    marginBottom: SPACING.md, 
    padding: SPACING.md, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg 
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  avatarText: { color: COLORS.text, fontWeight: 'bold' },
  textContainer: { justifyContent: 'center' },
  name: { ...TYPOGRAPHY.h3, color: COLORS.text, lineHeight: 22 },
  email: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginTop: 1 },
  roleBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: RADIUS.sm, 
    borderWidth: 1,
  },
  roleText: { fontSize: 10, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
  
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: SPACING.lg },
  modalContent: { 
    width: '100%', 
    maxWidth: 400, 
    backgroundColor: COLORS.surface, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.xl, 
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg, color: COLORS.text },
  inputGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.md, 
    paddingHorizontal: SPACING.md 
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, height: 48, ...TYPOGRAPHY.body1, color: COLORS.text },
  label: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase' },
  roleContainer: { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl },
  roleOption: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    alignItems: 'center' 
  },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  roleOptionActiveText: { color: COLORS.background },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg }
});

export default TeamScreen;
