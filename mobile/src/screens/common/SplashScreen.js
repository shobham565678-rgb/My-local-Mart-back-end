import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, spacing, typography } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const { theme } = useTheme();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🛒</Text>
        </View>

        {/* App Name */}
        <Text style={[styles.appName, { color: theme.colors.white }]}>
          MyLocalMart
        </Text>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: theme.colors.white }]}>
          Your Neighborhood Marketplace
        </Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingDot, { backgroundColor: theme.colors.white }]} />
          <View style={[styles.loadingDot, { backgroundColor: theme.colors.white }]} />
          <View style={[styles.loadingDot, { backgroundColor: theme.colors.white }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    fontSize: 60,
  },
  appName: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body1,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.xxl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    opacity: 0.7,
  },
});

export default SplashScreen;





