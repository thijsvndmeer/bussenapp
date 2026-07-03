import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'majorLoss';

export const triggerHaptic = async (type: HapticType) => {
  try {
    switch (type) {
      case 'light': await Haptics.impact({ style: ImpactStyle.Light }); break;
      case 'medium': await Haptics.impact({ style: ImpactStyle.Medium }); break;
      case 'heavy': await Haptics.impact({ style: ImpactStyle.Heavy }); break;
      case 'success': await Haptics.notification({ type: NotificationType.Success }); break;
      case 'warning': await Haptics.notification({ type: NotificationType.Warning }); break;
      case 'error': await Haptics.impact({ style: ImpactStyle.Heavy }); break;
      case 'majorLoss': await Haptics.vibrate({ duration: 650 }); break;
    }
  } catch {
    if (navigator.vibrate) {
      switch (type) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(40); break;
        case 'heavy': navigator.vibrate(80); break;
        case 'success': navigator.vibrate([25, 30, 25]); break;
        case 'warning': navigator.vibrate([50, 30, 50]); break;
        case 'error': navigator.vibrate([90, 40, 90]); break;
        case 'majorLoss': navigator.vibrate([200, 150, 200, 150, 300]); break;
      }
    }
  }
};

export const useHaptics = () => ({ triggerHaptic });
