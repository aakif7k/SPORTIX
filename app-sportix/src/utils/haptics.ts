/**
 * src/utils/haptics.ts
 */
import * as Haptics from 'expo-haptics';

export function triggerHaptic(type: 'selection' | 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' = 'selection') {
  try {
    switch (type) {
      case 'selection': Haptics.selectionAsync(); break;
      case 'light':     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium':    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy':     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'error':     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
      case 'success':   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning':   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
    }
  } catch { /* haptics not supported */ }
}
