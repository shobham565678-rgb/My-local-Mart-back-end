import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';

const LoginScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { sendOTP } = useAuth();
  const { userType } = route.params;

  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phoneNumber) => {
    // Basic phone validation - should start with + and have 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOTP(phone, userType);
      
      if (result.success) {
        navigation.navigate('OTP', { 
          phone, 
          userType,
          otp: result.data?.otp // For development only
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digit characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
                ← Back
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {userType === 'customer' ? 'Customer Login' : 'Store Owner Login'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your phone number to receive an OTP
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                placeholder="+1234567890"
                placeholderTextColor={theme.colors.textLight}
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                autoFocus
                maxLength={16}
              />
              <Text style={[styles.helpText, { color: theme.colors.textLight }]}>
                Include country code (e.g., +1 for US, +91 for India)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
              We'll send you a 6-digit verification code via SMS
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  backButtonText: {
    ...typography.body1,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    lineHeight: 24,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  helpText: {
    ...typography.caption,
    lineHeight: 16,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  info: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  infoText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;





