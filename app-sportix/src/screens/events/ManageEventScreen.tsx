/**
 * src/screens/events/ManageEventScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { eventService } from '../../services/eventService';
import { SportixEvent, EventStatus } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export function ManageEventScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const { colors } = useTheme();

  const [event, setEvent] = useState<SportixEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    eventService.getEvent(eventId)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleUpdateStatus = async (status: EventStatus) => {
    setUpdating(true);
    try {
      await eventService.updateEventStatus(eventId, status);
      setEvent(prev => prev ? { ...prev, status } : null);
      Alert.alert('Status Updated', `Event is now marked as ${status}.`);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <View style={[styles.loader, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.volt} size="large" /></View>;
  if (!event) return null;

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Manage Clash</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard style={styles.statusCard}>
            <Text style={[styles.statusHeading, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>
              CURRENT STATUS
            </Text>
            <View style={[styles.statusBadge, {
              backgroundColor: event.status === 'ongoing' ? 'rgba(255, 189, 46, 0.15)' :
                               event.status === 'completed' ? 'rgba(0, 255, 120, 0.15)' :
                               event.status === 'cancelled' ? 'rgba(255, 100, 100, 0.15)' : 'rgba(204, 255, 0, 0.15)'
            }]}>
              <Text style={[styles.statusText, {
                color: event.status === 'ongoing' ? '#FFBD2E' :
                       event.status === 'completed' ? '#00FF78' :
                       event.status === 'cancelled' ? '#FF6464' : colors.volt,
                fontFamily: 'Urbanist_800ExtraBold'
              }]}>
                {event.status.toUpperCase()}
              </Text>
            </View>
          </GlassCard>

          <View style={styles.actionsContainer}>
            <Text style={[styles.actionsHeading, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>
              CHANGE EVENT STATE
            </Text>

            <TouchableOpacity
              onPress={() => handleUpdateStatus('ongoing')}
              disabled={updating || event.status === 'ongoing'}
              style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Play size={20} color="#FFBD2E" />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Start Match (Live)</Text>
                <Text style={[styles.actionSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>Mark event as currently active</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleUpdateStatus('completed')}
              disabled={updating || event.status === 'completed'}
              style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <CheckCircle size={20} color="#00FF78" />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Mark Completed</Text>
                <Text style={[styles.actionSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>Conclude event and enable match reports</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleUpdateStatus('cancelled')}
              disabled={updating || event.status === 'cancelled'}
              style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <XCircle size={20} color="#FF6464" />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Cancel Clash</Text>
                <Text style={[styles.actionSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>Notify attendees that event is cancelled</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1 },
  loader:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:      { fontSize: 17 },
  scroll:           { padding: 16, gap: 16 },
  statusCard:       { alignItems: 'center', paddingVertical: 24, gap: 10 },
  statusHeading:    { fontSize: 12, letterSpacing: 0.5 },
  statusBadge:      { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  statusText:       { fontSize: 16 },
  actionsContainer: { gap: 10 },
  actionsHeading:   { fontSize: 12, letterSpacing: 0.5, marginBottom: 4 },
  actionRow:        { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 14 },
  actionInfo:       { flex: 1, gap: 2 },
  actionTitle:      { fontSize: 15 },
  actionSub:        { fontSize: 12 },
});
