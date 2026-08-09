import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { account, databases, DATABASE_ID, COLLECTIONS } from '../../api/appwrite';
import { useAuthStore } from '../../store/authStore';
import { Zap, Mail, Lock } from 'lucide-react-native';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Credentials', 'Please enter your email address and password.');
      return;
    }

    setLoading(true);
    try {
      try {
        await account.deleteSession('current');
      } catch { /* ignore if no active session */ }

      await account.createEmailPasswordSession(email.trim(), password);
      const acc = await account.get();

      let profileData: any = {
        id: acc.$id,
        full_name: acc.name || 'Athlete',
        email: acc.email,
        sport: 'Multi-Sport',
        username: acc.email.split('@')[0],
      };

      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, acc.$id);
        profileData = { ...profileData, ...doc, id: doc.$id };
      } catch { /* fallback to auth data */ }

      setUser(profileData);
    } catch (err: any) {
      console.error('[LoginScreen] error:', err?.message ?? err);
      Alert.alert('Login Failed', err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Zap size={14} color="#00D4FF" />
          <Text style={styles.badgeText}>SPORTIX ATHLETE MATRIX</Text>
        </View>
        <Text style={styles.title}>SIGN IN TO <Text style={styles.highlight}>SPORTIX</Text></Text>
        <Text style={styles.subtitle}>Scout athletes, enter live tournament clashes, and build your competitive squad.</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputContainer}>
            <Mail size={16} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="athlete@sportix.com"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Lock size={16} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN TO HUDDLE</Text>
          )}
        </TouchableOpacity>
      </GlassCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an athlete profile?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    marginBottom: 12,
  },
  badgeText: {
    color: '#00D4FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  highlight: {
    color: '#CCFF00',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  formCard: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121A22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#CCFF00',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    color: '#888',
    fontSize: 13,
  },
  linkText: {
    color: '#00D4FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
