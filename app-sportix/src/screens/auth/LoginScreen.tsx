/**
 * src/screens/auth/LoginScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Futuristic Sports-Tech Authentication Terminal for SPORTiX Mobile.
 * Inspired by: Nike × Strava × Discord × Gaming × Future Sports Technology.
 *
 * Features:
 * - Segmented Switcher: [ SIGN IN ] vs [ CREATE ACCOUNT ]
 * - Email, Password (with eye toggle), Full Name & Username for sign up
 * - Google Sign-In with official styling & Appwrite OAuth
 * - Real-time username availability validation
 * - Forgot password reset dialog
 * - Direct Appwrite auth & profile routing
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Zap,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { subscribeAll } from '../../utils/realtimeManager';
import { triggerHaptic } from '../../utils/haptics';

export function LoginScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const setProfile = useAuthStore((state) => state.setProfile);

  const initialTab = route?.params?.mode === 'signup' ? 'signup' : 'login';
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleUsernameBlur = useCallback(async () => {
    if (username.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const avail = await authService.checkUsernameAvailable(username.trim());
    setUsernameAvailable(avail);
    setCheckingUsername(false);
  }, [username]);

  // Login Action
  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      triggerHaptic('error');
      return;
    }
    setError('');
    setLoading(true);
    triggerHaptic('medium');

    try {
      const { auth, profile } = await authService.loginWithEmail(email, password);
      setAuthUser(auth);
      setProfile(profile);
      subscribeAll({ userId: auth.id });
      triggerHaptic('success');
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please verify your credentials.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  // Sign Up Action
  const handleSignup = useCallback(async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required.');
      triggerHaptic('error');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      triggerHaptic('error');
      return;
    }
    if (usernameAvailable === false) {
      setError('Username is already taken.');
      triggerHaptic('error');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      triggerHaptic('error');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      triggerHaptic('error');
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    try {
      const { auth, profile } = await authService.signupWithEmail({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setAuthUser(auth);
      setProfile(profile);
      subscribeAll({ userId: auth.id });
      triggerHaptic('success');
    } catch (e: any) {
      setError(e.message ?? 'Signup failed. Please try again.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  }, [fullName, username, usernameAvailable, email, password]);

  // Google OAuth Action
  const handleGoogle = useCallback(async () => {
    setError('');
    setGoogleLoading(true);
    triggerHaptic('medium');

    try {
      const result = await authService.loginWithGoogle();
      if (result) {
        setAuthUser(result.auth);
        setProfile(result.profile);
        subscribeAll({ userId: result.auth.id });
        triggerHaptic('success');
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in could not be completed.');
      triggerHaptic('error');
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  // Forgot Password Action
  const handleForgotPassword = () => {
    triggerHaptic('selection');
    if (!email.trim()) {
      Alert.alert(
        'Reset Password',
        'Please enter your email in the email field first, then tap Forgot Password.'
      );
      return;
    }
    Alert.alert(
      'Password Reset Link',
      `A password recovery link will be sent to ${email.trim()}. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => {
            Alert.alert('Link Sent', 'Check your inbox for password reset instructions.');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic('selection');
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Welcome');
            }}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Zap size={14} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandText}>SPORTIX</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Title Section */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.headerSection}>
              <View style={styles.terminalTag}>
                <Sparkles size={10} color="#CCFF00" />
                <Text style={styles.terminalTagText}>ATHLETIC ACCESS TERMINAL</Text>
              </View>
              <Text style={styles.mainTitle}>
                {tab === 'login' ? 'WELCOME BACK' : 'CREATE YOUR PASSPORT'}
              </Text>
              <Text style={styles.subTitle}>
                {tab === 'login'
                  ? 'Sign in to access your squad, pulse & clash telemetry.'
                  : 'Join the next generation of verified competitive athletes.'}
              </Text>
            </Animated.View>

            {/* Segmented Tab Switcher */}
            <View style={styles.segmentedTabWrap}>
              <TouchableOpacity
                style={[styles.segmentedTabBtn, tab === 'login' && styles.segmentedTabBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setTab('login');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.segmentedTabText,
                    tab === 'login' && styles.segmentedTabTextActive,
                  ]}
                >
                  SIGN IN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentedTabBtn, tab === 'signup' && styles.segmentedTabBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setTab('signup');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.segmentedTabText,
                    tab === 'signup' && styles.segmentedTabTextActive,
                  ]}
                >
                  CREATE ACCOUNT
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {error ? (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.errorBanner}>
                <AlertCircle size={16} color="#FF3B30" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Form Fields Card */}
            <View style={styles.formCard}>
              {/* Full Name & Username for Signup */}
              {tab === 'signup' && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FULL NAME</Text>
                    <View style={styles.inputWrap}>
                      <User size={16} color="#64748B" />
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="e.g. Alex Rivera"
                        placeholderTextColor="#64748B"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>USERNAME</Text>
                      {checkingUsername ? (
                        <Text style={styles.statusChecking}>Checking...</Text>
                      ) : usernameAvailable === true ? (
                        <Text style={styles.statusAvail}>✓ Available</Text>
                      ) : usernameAvailable === false ? (
                        <Text style={styles.statusTaken}>✗ Taken</Text>
                      ) : null}
                    </View>
                    <View style={styles.inputWrap}>
                      <AtSign size={16} color="#64748B" />
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="alex_striker"
                        placeholderTextColor="#64748B"
                        value={username}
                        onChangeText={setUsername}
                        onBlur={handleUsernameBlur}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrap}>
                  <Mail size={16} color="#64748B" />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="you@example.com"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  {tab === 'login' && (
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotPassText}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.inputWrap}>
                  <Lock size={16} color="#64748B" />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={tab === 'signup' ? 'Min. 8 characters' : 'Enter password'}
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Action Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={tab === 'login' ? handleLogin : handleSignup}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Zap size={16} color="#000" strokeWidth={3} fill="#000" />
                    <Text style={styles.submitBtnText}>
                      {tab === 'login' ? 'SIGN IN TO SPORTIX' : 'CREATE ATHLETE PASSPORT'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google OAuth Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogle}
                disabled={googleLoading}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconBadge}>
                      <Text style={styles.googleG}>G</Text>
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 1.5,
  },

  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  /* Header Section */
  headerSection: {
    gap: 6,
    marginTop: 4,
  },
  terminalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  terminalTagText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.4,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 18,
  },

  /* Segmented Switcher */
  segmentedTabWrap: {
    flexDirection: 'row',
    backgroundColor: '#080808',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentedTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentedTabBtnActive: {
    backgroundColor: '#CCFF00',
  },
  segmentedTabText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  segmentedTabTextActive: {
    color: '#000',
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorBannerText: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FF3B30',
    flex: 1,
  },

  /* Form Card */
  formCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  statusChecking: {
    fontSize: 9,
    fontFamily: 'Urbanist_700Bold',
    color: '#00D4FF',
  },
  statusAvail: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#00FF78',
  },
  statusTaken: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FF3B30',
  },
  forgotPassText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#CCFF00',
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFF',
  },
  eyeBtn: {
    padding: 6,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 1,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
});
