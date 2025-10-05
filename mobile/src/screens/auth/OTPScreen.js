import React, { useState, useRef, useEffect } from 'react';
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

const OTPScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { phone, userType, otp: devOTP } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-fill OTP in development
    if (devOTP && __DEV__) {
      const otpArray = devOTP.split('');
      setOtp(otpArray);
    }

    // Start timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [devOTP]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(phone, otpString);
      
      if (result.success) {
        // Navigation will be handled by AppNavigator based on auth state
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const result = await sendOTP(phone, userType);
      
      if (result.success) {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Start timer again
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        Alert.alert('Success', 'OTP sent successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              Verify OTP
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={{ fontWeight: '600' }}>{phone}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <View style={styles.otpInputs}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: digit ? theme.colors.primary : theme.colors.border,
                      color: theme.colors.text,
                    }
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>

          {/* Timer and Resend */}
          <View style={styles.timerContainer}>
            {!canResend ? (
              <Text style={[styles.timerText, { color: theme.colors.textLight }]}>
                Resend OTP in {formatTime(timer)}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          {/* Development Info */}
          {__DEV__ && devOTP && (
            <View style={styles.devInfo}>
              <Text style={[styles.devText, { color: theme.colors.textLight }]}>
                Development OTP: {devOTP}
              </Text>
            </View>
          )}
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
    textAlign: 'center',
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timerText: {
    ...typography.body2,
  },
  resendText: {
    ...typography.body2,
    fontWeight: '600',
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  devInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  devText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
});

export default OTPScreen;





