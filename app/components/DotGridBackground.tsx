import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const DotGridBackground = () => {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="dotgrid"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx="1"
              cy="1"
              r="1"
              fill="rgba(255, 255, 255, 0.15)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dotgrid)" />
      </Svg>
    </View>
  );
};

export default DotGridBackground;
