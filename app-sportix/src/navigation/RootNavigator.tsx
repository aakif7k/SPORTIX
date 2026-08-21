/**
 * src/navigation/RootNavigator.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Three gate types:
 *  - Public     — Welcome, Login, Signup (redirect away if session exists)
 *  - Onboarding — OnboardingScreen (session required; redirect if already complete)
 *  - Protected  — All main screens (session + is_onboarding_complete required)
 */
import React from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeContext';

// ── Auth screens ──────────────────────────────────────────────────────────────
import { WelcomeScreen }         from '../screens/auth/WelcomeScreen';
import { OnboardingIntroScreen } from '../screens/auth/OnboardingIntroScreen';
import { LoginScreen }           from '../screens/auth/LoginScreen';
import { SignupScreen }          from '../screens/auth/SignupScreen';
import { OnboardingScreen }      from '../screens/auth/OnboardingScreen';

// ── Tab screens ───────────────────────────────────────────────────────────────
import { FeedHomeScreen }         from '../screens/feed/FeedHomeScreen';
import { ReelFeedScreen }         from '../screens/feed/ReelFeedScreen';
import { EventsListScreen }       from '../screens/events/EventsListScreen';
import { SquadFormationScreen }   from '../screens/pulse/SquadFormationScreen';
import { HuddleMessagesScreen }   from '../screens/messages/HuddleMessagesScreen';
import { MyPlayerDNAScreen }      from '../screens/profile/MyPlayerDNAScreen';
import { EditProfileScreen }      from '../screens/profile/EditProfileScreen';

// ── Stack screens ─────────────────────────────────────────────────────────────
import { EventDetailScreen }       from '../screens/events/EventDetailScreen';
import { CreateEventScreen }       from '../screens/events/CreateEventScreen';
import { EventDiscussionScreen }   from '../screens/events/EventDiscussionScreen';
import { ManageEventScreen }       from '../screens/events/ManageEventScreen';
import { ManageEventsDashboardScreen } from '../screens/events/ManageEventsDashboardScreen';
import { DirectChatScreen }        from '../screens/messages/DirectChatScreen';
import { AthleteProfileScreen }    from '../screens/profile/AthleteProfileScreen';
import { MediaVaultScreen }        from '../screens/profile/MediaVaultScreen';
import { PostDetailScreen }        from '../screens/feed/PostDetailScreen';
import { PostComposerScreen }      from '../screens/feed/PostComposerScreen';
import { SquadLockerScreen }       from '../screens/squads/SquadLockerScreen';
import { SquadMatchHistoryScreen } from '../screens/squads/SquadMatchHistoryScreen';
import { SquadSettingsScreen }     from '../screens/squads/SquadSettingsScreen';
import { MatchReportScreen }       from '../screens/matches/MatchReportScreen';
import { MatchValidationScreen }   from '../screens/matches/MatchValidationScreen';
import { PulseScreen }             from '../screens/pulse/PulseScreen';
import { DailyRewardScreen }       from '../screens/pulse/DailyRewardScreen';
import { BadgesScreen }            from '../screens/pulse/BadgesScreen';
import { CoinLedgerScreen }        from '../screens/pulse/CoinLedgerScreen';
import { NotificationsScreen }     from '../screens/notifications/NotificationsScreen';
import { DiscoverTalentScreen }    from '../screens/discover/DiscoverTalentScreen';
import { SettingsScreen }          from '../screens/settings/SettingsScreen';

import {
  Home, Flame, Trophy, Sparkles, MessageCircle, User, Zap,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

import { PulseCenterTabButton } from '../components/navigation/PulseCenterTabButton';

function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  colors.surface,
          borderTopColor:   colors.border,
          borderTopWidth:   1,
          height:           Platform.OS === 'ios' ? 88 : 70,
          paddingBottom:    Platform.OS === 'ios' ? 24 : 10,
          paddingTop:       8,
        },
        tabBarActiveTintColor:   colors.volt,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize:      10,
          fontFamily:    'Urbanist_700Bold',
          letterSpacing: 0.2,
        },
      }}
      screenListeners={{ tabPress: () => triggerHaptic('selection') }}
    >
      {/* 1. Hypezone (Feed) */}
      <Tab.Screen
        name="HypezoneTab"
        component={FeedHomeScreen}
        options={{
          tabBarLabel: 'Hypezone',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { shadowColor: colors.volt, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : undefined}>
              <Flame size={21} color={color} />
            </View>
          ),
        }}
      />

      {/* 2. Clashub (Events / Clashes) */}
      <Tab.Screen
        name="ClashubTab"
        component={EventsListScreen}
        options={{
          tabBarLabel: 'Clashub',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { shadowColor: colors.volt, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : undefined}>
              <Trophy size={21} color={color} />
            </View>
          ),
        }}
      />

      {/* 3. SportiX Center Circle Button (Player PULSE System) */}
      <Tab.Screen
        name="PulseTab"
        component={PulseScreen}
        options={{
          tabBarLabel: 'PULSE',
          tabBarButton: (props: any) => (
            <PulseCenterTabButton
              focused={props.accessibilityState?.selected ?? false}
              onPress={props.onPress}
            />
          ),
        }}
      />

      {/* 4. Huddle (Chat / Messages) */}
      <Tab.Screen
        name="HuddleTab"
        component={HuddleMessagesScreen}
        options={{
          tabBarLabel: 'Huddle',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { shadowColor: colors.volt, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : undefined}>
              <MessageCircle size={21} color={color} />
            </View>
          ),
        }}
      />

      {/* 5. Profile DNA */}
      <Tab.Screen
        name="ProfileDNATab"
        component={MyPlayerDNAScreen}
        options={{
          tabBarLabel: 'Profile DNA',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { shadowColor: colors.volt, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : undefined}>
              <User size={21} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const authUser             = useAuthStore(state => state.authUser);
  const isOnboardingComplete = useAuthStore(state => state.isOnboardingComplete);
  const loading              = useAuthStore(state => state.loading);

  if (loading) return null; // Expo SplashScreen covers this

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>

        {/* ── Public (no session) ──────────────────────────────────────────── */}
        {!authUser ? (
          <>
            <Stack.Screen name="Welcome"         component={WelcomeScreen}         />
            <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
            <Stack.Screen name="Login"           component={LoginScreen}           />
            <Stack.Screen name="Signup"          component={SignupScreen}          />
          </>
        ) : !isOnboardingComplete ? (
          /* ── Onboarding (session, not complete) ──────────────────────────── */
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          /* ── Protected (session + onboarding complete) ───────────────────── */
          <>
            <Stack.Screen name="MainTabs"         component={MainTabNavigator}       />
            <Stack.Screen name="EventDetail"      component={EventDetailScreen}      />
            <Stack.Screen name="CreateEvent"      component={CreateEventScreen}      />
            <Stack.Screen name="EventDiscussion"  component={EventDiscussionScreen}  />
            <Stack.Screen name="ManageEvent"      component={ManageEventScreen}      />
            <Stack.Screen name="ManageEventsDashboard" component={ManageEventsDashboardScreen} />
            <Stack.Screen name="DirectChat"       component={DirectChatScreen}       />
            <Stack.Screen name="AthleteProfile"   component={AthleteProfileScreen}   />
            <Stack.Screen name="MediaVault"       component={MediaVaultScreen}       />
            <Stack.Screen name="PostDetail"       component={PostDetailScreen}       />
            <Stack.Screen name="PostComposer"     component={PostComposerScreen}     />
            <Stack.Screen name="SquadLocker"      component={SquadLockerScreen}      />
            <Stack.Screen name="SquadMatchHistory"component={SquadMatchHistoryScreen}/>
            <Stack.Screen name="SquadSettings"    component={SquadSettingsScreen}    />
            <Stack.Screen name="MatchReport"      component={MatchReportScreen}      />
            <Stack.Screen name="MatchValidation"  component={MatchValidationScreen}  />
            <Stack.Screen name="Pulse"            component={PulseScreen}            />
            <Stack.Screen name="DailyReward"      component={DailyRewardScreen}      />
            <Stack.Screen name="Badges"           component={BadgesScreen}           />
            <Stack.Screen name="CoinLedger"       component={CoinLedgerScreen}       />
            <Stack.Screen name="Notifications"    component={NotificationsScreen}    />
            <Stack.Screen name="Discover"         component={DiscoverTalentScreen}   />
            <Stack.Screen name="Settings"         component={SettingsScreen}         />
            <Stack.Screen name="EditProfile"      component={EditProfileScreen}      />
            <Stack.Screen name="AutoSquad"        component={SquadFormationScreen}   />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
