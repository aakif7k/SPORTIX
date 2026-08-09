import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderColor = 'rgba(0, 212, 255, 0.2)',
}) => {
  return (
    <View style={[styles.card, { borderColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A1118',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});
