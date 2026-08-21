/**
 * src/components/ui/TerminalProgress.tsx
 * AutoSquad terminal-style animated progress display.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface TerminalProgressProps {
  messages: string[];
  active:   boolean;
}

export function TerminalProgress({ messages, active }: TerminalProgressProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (active) {
      blink.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);
    } else {
      blink.value = 1;
    }
  }, [active]);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <View style={[styles.terminal, { backgroundColor: '#0A0A0A', borderColor: colors.volt }]}>
      <View style={styles.termHeader}>
        <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
        <View style={[styles.dot, { backgroundColor: '#28CA41' }]} />
        <Text style={[styles.termTitle, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>
          AutoSquad AI
        </Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.output} showsVerticalScrollIndicator={false}>
        {messages.map((msg, i) => (
          <Text key={i} style={[styles.line, { color: i === messages.length - 1 ? colors.volt : '#5A7A2A', fontFamily: 'Urbanist_400Regular' }]}>
            {'> '}{msg}
          </Text>
        ))}
        {active && (
          <Animated.View style={[styles.cursor, { backgroundColor: colors.volt }, cursorStyle]} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  terminal:  { borderRadius: 12, borderWidth: 1, overflow: 'hidden', maxHeight: 200 },
  termHeader:{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  dot:       { width: 10, height: 10, borderRadius: 5 },
  termTitle: { marginLeft: 8, fontSize: 12 },
  output:    { padding: 12 },
  line:      { fontSize: 12, lineHeight: 20 },
  cursor:    { width: 8, height: 14, marginTop: 2 },
});
