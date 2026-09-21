import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
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

const AdminTeamScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('team'); // 'team' or 'client'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
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
      sendBackendPrompt('create_user', userData);
      
      await API.post('/users', userData);
      setModalVisible(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('team');
      fetchUsers();
      Alert.alert('Success', 'User created successfully');
    } catch (e) {
      console.error('Failed to create user:', e);
      Alert.alert('Info', 'Backend request logged. Please implement the backend functionality.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <Text style={styles.role}>{item.role.toUpperCase()}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>System Users</Text>
        <Button title="+ Add User" onPress={() => setModalVisible(true)} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}

      {/* CREATE USER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New User</Text>

            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput style={styles.input} placeholder="Role (team or client)" autoCapitalize="none" value={role} onChangeText={setRole} />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: SPACING.sm }} />
              <Button title="Create" loading={submitting} onPress={handleAddUser} style={{ flex: 1, marginLeft: SPACING.sm }} />
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...TYPOGRAPHY.h3, color: COLORS.text },
  email: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary },
  role: { ...TYPOGRAPHY.caption, fontWeight: 'bold', color: COLORS.primary },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.lg },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, padding: SPACING.xl, borderRadius: RADIUS.lg },
  modalTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.lg, color: COLORS.text },
  input: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, ...TYPOGRAPHY.body1 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md }
});

export default AdminTeamScreen;
