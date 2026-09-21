import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const Badge = ({ status, text, style }) => {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
      case 'approved':
        return { bg: COLORS.success + '20', text: COLORS.success };
      case 'pending':
      case 'in_progress':
        return { bg: COLORS.warning + '20', text: COLORS.warning };
      case 'cancelled':
      case 'failed':
        return { bg: COLORS.error + '20', text: COLORS.error };
      default:
        return { bg: COLORS.border, text: COLORS.textSecondary };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{text || status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    alignSelf: 'flex-start',
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});

export default Badge;
