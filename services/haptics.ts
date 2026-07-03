import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'majorLoss';

const HAPTIC_DEDUPLICATION_WINDOW_MS = 150;
const lastTriggeredAtByType = new Map<HapticType, number>();

const webVibrationPatterns: Record<HapticType, VibratePattern> = {
  light: 10,
  medium: 40,
  heavy: 80,
  success: [25, 30, 25],
  warning: [50, 30, 50],
  error: [90, 40, 90],
  majorLoss: [200, 150, 200, 150, 300],
};

const triggerNativeHaptic = async (type: HapticType) => {
  switch (type) {
    case 'light':
      await Haptics.impact({ style: ImpactStyle.Light });
      break;
    case 'medium':
      await Haptics.impact({ style: ImpactStyle.Medium });
      break;
    case 'heavy':
      await Haptics.impact({ style: ImpactStyle.Heavy });
      break;
    case 'success':
      await Haptics.notification({ type: NotificationType.Success });
      break;
    case 'warning':
      await Haptics.notification({ type: NotificationType.Warning });
      break;
    case 'error':
      await Haptics.impact({ style: ImpactStyle.Heavy });
      break;
    case 'majorLoss':
      await Haptics.vibrate({ duration: 650 });
      break;
  }
};

const triggerWebVibration = (type: HapticType) => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  navigator.vibrate(webVibrationPatterns[type]);
};

export const triggerHaptic = async (type: HapticType) => {
  const now = Date.now();
  const lastTriggeredAt = lastTriggeredAtByType.get(type) ?? 0;

  if (now - lastTriggeredAt < HAPTIC_DEDUPLICATION_WINDOW_MS) {
    return;
  }

  lastTriggeredAtByType.set(type, now);

  try {
    await triggerNativeHaptic(type);
  } catch {
    triggerWebVibration(type);
  }
};
