import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Sidebar from '../../components/AdminUI/Sidebar';
import Header from '../../components/AdminUI/Header';
import Card from '../../components/AdminUI/Card';
import ActivityList from '../../components/AdminUI/ActivityList';

const mockActivities = [
  { id: '1', title: 'New user registered: John Doe', time: '2 mins ago' },
  { id: '2', title: 'Payment received: $500 from Client X', time: '1 hour ago' },
  { id: '3', title: 'Project "Alpha" marked as Completed', time: '3 hours ago' },
  { id: '4', title: 'Milestone added for Project "Beta"', time: '1 day ago' },
];

const mockProjects = [
  { id: '1', name: 'Zethub ERP', progress: 80, status: 'Ongoing' },
  { id: '2', name: 'Client Portal', progress: 40, status: 'Ongoing' },
  { id: '3', name: 'Mobile App', progress: 100, status: 'Completed' },
];

const AdminDashboardApp = () => {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    projects: 0,
    users: 0,
    payments: 0,
    revenue: 0,
  });

  // Calculate screen width for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(Dimensions.get('window').width < 768);
    };
    
    // Initial check
    handleResize();
    
    // Listen for resize
    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, []);

  // Mock data fetching
  useEffect(() => {
    // Simulate fetching
    setTimeout(() => {
      setStats({
        projects: 42,
        users: 128,
        payments: 315,
        revenue: '$24,500'
      });
    }, 500);
  }, []);

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const renderDashboardStats = () => (
    <View style={styles.statsContainer}>
      <Card style={[styles.statCard, isMobile && styles.statCardMobile]}>
        <Text style={styles.statLabel}>Total Projects</Text>
        <Text style={styles.statValue}>{stats.projects}</Text>
      </Card>
      <Card style={[styles.statCard, isMobile && styles.statCardMobile]}>
        <Text style={styles.statLabel}>Total Users</Text>
        <Text style={styles.statValue}>{stats.users}</Text>
      </Card>
      <Card style={[styles.statCard, isMobile && styles.statCardMobile]}>
        <Text style={styles.statLabel}>Total Payments</Text>
        <Text style={styles.statValue}>{stats.payments}</Text>
      </Card>
      <Card style={[styles.statCard, isMobile && styles.statCardMobile]}>
        <Text style={styles.statLabel}>Revenue</Text>
        <Text style={styles.statValue}>{stats.revenue}</Text>
      </Card>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>+ Add Project</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>+ Add User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>+ Add Payment</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  const renderProjectStatus = () => (
    <Card style={styles.projectStatusCard}>
      <Text style={styles.sectionTitle}>Project Status Overview</Text>
      {mockProjects.map(proj => (
        <View key={proj.id} style={styles.projectRow}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{proj.name}</Text>
            <Text style={styles.projectProgressText}>{proj.progress}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${proj.progress}%`, backgroundColor: proj.progress === 100 ? COLORS.success : COLORS.primary }]} />
          </View>
        </View>
      ))}
    </Card>
  );

  const renderContent = () => {
    switch(currentView) {
      case 'Dashboard':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderDashboardStats()}
            {renderQuickActions()}
            <View style={[styles.rowContainer, isMobile && styles.columnContainer]}>
              <View style={styles.flexHalf}>
                {renderProjectStatus()}
              </View>
              <View style={[styles.flexHalf, isMobile ? { marginLeft: 0 } : { marginLeft: SPACING.lg }]}>
                <ActivityList activities={mockActivities} />
              </View>
            </View>
          </ScrollView>
        );
      default:
        return (
          <View style={styles.emptyContent}>
            <Text style={styles.emptyText}>{currentView} View (Coming Soon)</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <View style={styles.mainArea}>
        <Header 
          title="Welcome back, Super Admin!" 
          isMobile={isMobile} 
          onMenuPress={() => setIsSidebarOpen(true)}
        />
        <View style={styles.contentArea}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'column',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '23%', 
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  statCardMobile: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  statLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  quickActionsContainer: {
    marginBottom: SPACING.lg,
  },
  quickActionsCard: {
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionButtonText: {
    color: COLORS.surface,
    ...TYPOGRAPHY.body1,
    fontWeight: 'bold',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  columnContainer: {
    flexDirection: 'column',
  },
  flexHalf: {
    flex: 1,
  },
  projectStatusCard: {
    marginTop: SPACING.md,
    flex: 1,
  },
  projectRow: {
    marginBottom: SPACING.md,
  },
  projectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  projectName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  projectProgressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textSecondary,
  }
});

export default AdminDashboardApp;
