/**
 * App.tsx — SPORTiX Mobile App entry point
 */
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  Urbanist_800ExtraBold,
} from '@expo-google-fonts/urbanist';

import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { authService } from './src/services/authService';
import { isSessionActive, clearSession } from './src/utils/secureSession';

// Keep splash visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const setAuthUser  = useAuthStore(state => state.setAuthUser);
  const setProfile   = useAuthStore(state => state.setProfile);
  const setLoading   = useAuthStore(state => state.setLoading);
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
    Urbanist_800ExtraBold,
  });

  // Restore active user session
  useEffect(() => {
    async function init() {
      try {
        const sessionActive = await isSessionActive();
        if (sessionActive) {
          const [auth, profile] = await Promise.all([
            authService.getCurrentAuthUser(),
            authService.getCurrentProfile(),
          ]);
          if (auth && profile) {
            setAuthUser(auth);
            setProfile(profile);
          } else {
            await clearSession();
          }
        }
      } catch (e) {
        console.warn('[App] Session restore error:', e);
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    }
    init();
  }, []);

  // Dismiss splash screen immediately once fonts and state are resolved
  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, appReady]);

  // Safety fallback: force hide splash screen after 3 seconds so screen is never blocked
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
