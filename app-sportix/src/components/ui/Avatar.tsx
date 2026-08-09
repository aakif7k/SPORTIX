import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'Athlete',
  size = 48,
  isOnline = false,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: Math.max(10, size * 0.25),
              height: Math.max(10, size * 0.25),
              borderRadius: Math.max(5, size * 0.125),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  img: {
    borderWidth: 1.5,
    borderColor: '#00D4FF',
  },
  fallback: {
    backgroundColor: '#14202C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00D4FF',
  },
  initialsText: {
    color: '#00D4FF',
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#CCFF00',
    borderWidth: 2,
    borderColor: '#050A0E',
  },
});
