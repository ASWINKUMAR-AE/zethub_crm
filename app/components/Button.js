import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const Button = ({ title, onPress, variant = 'primary', loading = false, style, textStyle, disabled }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return COLORS.primary; // White
      case 'secondary': return COLORS.secondary; // Grey
      case 'outline': return 'transparent';
      case 'danger': return COLORS.primary; // Enforcing Mono (White instead of Red)
      default: return COLORS.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline': return COLORS.text;
      case 'primary': return COLORS.background; // Black text on White bg
      case 'danger': return COLORS.background; // Black text on White bg
      default: return COLORS.background;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
  },
  text: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.5,
  }
});

export default Button;
