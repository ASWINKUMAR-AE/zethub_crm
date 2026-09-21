// components/WaveLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export const WaveLoader = () => {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  const createWaveAnimation = (animatedValue: Animated.Value, delay: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
  };

  useEffect(() => {
    createWaveAnimation(wave1, 0).start();
    createWaveAnimation(wave2, 200).start();
    createWaveAnimation(wave3, 400).start();
  }, []);

  return (
    <View style={styles.container}>
      {[wave1, wave2, wave3].map((wave, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: wave }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 20,
    gap: 6,
  },
  bar: {
    width: 8,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#61dafb',
  },
});
