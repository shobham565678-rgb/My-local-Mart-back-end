import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';

const UserTypeScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const handleUserTypeSelection = (userType) => {
    navigation.navigate('Login', { userType });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Welcome to MyLocalMart
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choose your account type to get started
          </Text>
        </View>

        {/* User Type Cards */}
        <View style={styles.cardsContainer}>
          {/* Customer Card */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface }, shadows.md]}
            onPress={() => handleUserTypeSelection('customer')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🛒</Text>
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              I'm a Customer
            </Text>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Shop from local stores, browse products, and get items delivered to your doorstep
            </Text>
            <View style={[styles.cardButton, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.cardButtonText, { color: theme.colors.white }]}>
                Shop Now
              </Text>
            </View>
          </TouchableOpacity>

          {/* Store Owner Card */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface }, shadows.md]}
            onPress={() => handleUserTypeSelection('store_owner')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🏪</Text>
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              I'm a Store Owner
            </Text>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Manage your store, add products, and reach more customers in your neighborhood
            </Text>
            <View style={[styles.cardButton, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.cardButtonText, { color: theme.colors.white }]}>
                Start Selling
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textLight }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 40,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardDescription: {
    ...typography.body2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  cardButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    minWidth: 120,
    alignItems: 'center',
  },
  cardButtonText: {
    ...typography.button,
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UserTypeScreen;





