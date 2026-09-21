import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { LogOut, User } from 'lucide-react-native';

const CustomDrawerContent = (props) => {
  const { logout, userInfo } = useContext(AuthContext);

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.userInfoSection}>
          <View style={styles.userAvatar}>
            <User color={COLORS.primary} size={30} />
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
            <Text style={styles.userRole}>{userInfo?.role?.toUpperCase() || 'Role'}</Text>
          </View>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => logout()}
      >
        <LogOut color={COLORS.error} size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userDetail: {
    marginLeft: SPACING.md,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  userRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.error,
    marginLeft: SPACING.md,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
