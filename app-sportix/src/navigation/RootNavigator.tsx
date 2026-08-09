import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';

import { FeedHomeScreen } from '../screens/feed/FeedHomeScreen';
import { DiscoverTalentScreen } from '../screens/discover/DiscoverTalentScreen';
import { EventsListScreen } from '../screens/events/EventsListScreen';
import { HuddleMessagesScreen } from '../screens/messages/HuddleMessagesScreen';
import { MyPlayerDNAScreen } from '../screens/profile/MyPlayerDNAScreen';

import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { DirectChatScreen } from '../screens/messages/DirectChatScreen';
import { AthleteProfileScreen } from '../screens/profile/AthleteProfileScreen';

import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#070D12',
          borderTopColor: 'rgba(0, 212, 255, 0.2)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#CCFF00',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedHomeScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverTalentScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => <Search size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsListScreen}
        options={{
          tabBarLabel: 'Clashes',
          tabBarIcon: ({ color, size }) => <Calendar size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="HuddleTab"
        component={HuddleMessagesScreen}
        options={{
          tabBarLabel: 'Huddle',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="PlayerDNATab"
        component={MyPlayerDNAScreen}
        options={{
          tabBarLabel: 'PlayerDNA',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const user = useAuthStore(state => state.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="DirectChat" component={DirectChatScreen} />
            <Stack.Screen name="AthleteProfile" component={AthleteProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
