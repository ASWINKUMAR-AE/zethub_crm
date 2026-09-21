import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const ClientProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.deadline}>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
      
      <Button 
        title="View Timeline" 
        variant="outline" 
        style={styles.actionButton}
        onPress={() => navigation.navigate('Timeline')}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Projects</Text>
      <Text style={styles.subtitle}>Track your ongoing engagements.</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>You have no active projects.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  list: { paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  projectName: { ...TYPOGRAPHY.h3, color: COLORS.text },
  deadline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.md },
  actionButton: { alignSelf: 'flex-start', height: 36 },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl }
});

export default ClientProjectsScreen;
