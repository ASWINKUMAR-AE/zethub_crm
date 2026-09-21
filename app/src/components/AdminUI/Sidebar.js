import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const MENU_ITEMS = [
  'Dashboard',
  'Projects',
  'Milestones',
  'Payments',
  'Team',
];

const Sidebar = ({ currentView, onViewChange, onLogout, isMobile, isOpen, onClose }) => {
  const renderContent = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Zethub CRM</Text>
      </View>
      
      <View style={styles.navContainer}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.navItem, currentView === item && styles.activeNavItem]}
            onPress={() => {
              onViewChange(item);
              if (isMobile && onClose) onClose();
            }}
          >
            <Text style={[styles.navText, currentView === item && styles.activeNavText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <View style={styles.mobileOverlay}>
        <TouchableOpacity style={styles.overlayBackground} onPress={onClose} />
        <View style={styles.mobileSidebar}>
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.desktopSidebar}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  desktopSidebar: {
    width: 250,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
  },
  mobileOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mobileSidebar: {
    width: 250,
    backgroundColor: COLORS.surface,
    height: '100%',
    zIndex: 101,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingVertical: SPACING.md,
  },
  logoContainer: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  logoText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  activeNavItem: {
    backgroundColor: COLORS.primary,
  },
  navText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  activeNavText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    marginTop: 'auto',
  },
  logoutText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.error,
    fontWeight: 'bold',
  },
});

export default Sidebar;
