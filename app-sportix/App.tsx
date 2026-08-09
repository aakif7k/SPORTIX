import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { account, databases, DATABASE_ID, COLLECTIONS } from './src/api/appwrite';

export default function App() {
  const setUser = useAuthStore(state => state.setUser);
  const setLoading = useAuthStore(state => state.setLoading);

  useEffect(() => {
    account.get()
      .then(async (acc) => {
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
        } catch { /* fallback to auth info */ }

        setUser(profileData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
