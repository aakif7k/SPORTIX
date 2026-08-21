import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkColors } from '../../theme/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  disableTopPadding?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  scrollable = false,
  contentContainerStyle,
  disableTopPadding = false,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: darkColors.background,
    paddingTop: disableTopPadding ? 0 : Math.max(insets.top, 12),
    paddingBottom: Math.max(insets.bottom, 12),
  };

  if (scrollable) {
    return (
      <View style={[styles.outer, containerStyle]}>
        <StatusBar barStyle="light-content" backgroundColor="#060606" />
        <View style={styles.ambientGlowTop} pointerEvents="none" />
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outer, containerStyle, style]}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(204, 255, 0, 0.035)',
    zIndex: 0,
  },
});
