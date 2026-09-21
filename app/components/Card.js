import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const Card = ({ children, style, intensity = 40, tint = "dark" }) => {
  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.card, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
  }
});

export default Card;
