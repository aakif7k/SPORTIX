import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { account, databases, ID, DATABASE_ID, COLLECTIONS } from '../../api/appwrite';
import { useAuthStore } from '../../store/authStore';
import { Zap, Mail, Lock, User, Activity } from 'lucide-react-native';

export const SignupScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sport, setSport] = useState('Football');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      try {
        await account.deleteSession('current');
      } catch { /* ignore */ }

      const userId = ID.unique();
      await account.create(userId, email.trim(), password, fullName.trim());
      await account.createEmailPasswordSession(email.trim(), password);

      const username = email.trim().split('@')[0];
      const now = new Date().toISOString();

      const profilePayload = {
        full_name: fullName.trim(),
        username,
        email: email.trim(),
        sport,
        sports: [sport],
        role: 'athlete',
        experience_level: 'amateur',
        is_open_to_recruit: true,
        pulse_score: 100,
        level: 1,
        created_at: now,
      };

      try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, profilePayload);
      } catch { /* fallback if document fails */ }

      setUser({ id: userId, ...profilePayload });
    } catch (err: any) {
      console.error('[SignupScreen] error:', err?.message ?? err);
      Alert.alert('Signup Failed', err?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Zap size={14} color="#CCFF00" />
            <Text style={styles.badgeText}>ATHLETE REGISTRATION</Text>
          </View>
          <Text style={styles.title}>JOIN THE <Text style={styles.highlight}>ARENA</Text></Text>
          <Text style={styles.subtitle}>Create your PlayerDNA profile and compete in real tournament clashes.</Text>
        </View>

        <GlassCard style={styles.formCard} borderColor="rgba(204, 255, 0, 0.2)">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={styles.inputContainer}>
              <User size={16} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Marcus Reid"
                placeholderTextColor="#555"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PRIMARY SPORT</Text>
            <View style={styles.inputContainer}>
              <Activity size={16} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Football, Basketball, Padel..."
                placeholderTextColor="#555"
                value={sport}
                onChangeText={setSport}
              />
            </View>
          </View>

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

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>CREATE ATHLETE DNA</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    marginBottom: 10,
  },
  badgeText: {
    color: '#CCFF00',
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
    color: '#00D4FF',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  formCard: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
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
    height: 46,
    color: '#FFF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#00D4FF',
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
    marginTop: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 13,
  },
  linkText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
