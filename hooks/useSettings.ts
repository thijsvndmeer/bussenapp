import { useCallback, useEffect, useRef, useState } from 'react';
import { CardStyle, GameMode, GameSettings, UITheme } from '../types';

const GAME_SETTINGS_KEY = 'bus-app-game-settings-v1';
const SETTINGS_LABEL = 'instellingen';
const storageAvailable = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const DEFAULT_SETTINGS: GameSettings = {
  mode: GameMode.DIGITAL,
  physicalMode: false,
  pyramidRows: 4,
  sharedBus: false,
  busLength: 6,
  busDecks: 1,
  cardStyle: CardStyle.DARK,
  doublePyramidCards: true,
  theme: UITheme.CALM,
  calmAccentColor: '#fb7185',
};

type SettingsPatch = Partial<GameSettings>;
type SettingsUpdater = (previousSettings: GameSettings) => SettingsPatch;
type SettingsUpdate = SettingsPatch | SettingsUpdater;

const normalizeSettings = (settings: Partial<GameSettings>): GameSettings => {
  const next = { ...DEFAULT_SETTINGS, ...settings };

  // Migration: CREATIVE/NEON_GLASS -> NEON
  const cardStyle = next.cardStyle as CardStyle | 'CREATIVE' | 'NEON_GLASS';
  if (cardStyle === 'CREATIVE' || cardStyle === 'NEON_GLASS') {
    next.cardStyle = CardStyle.NEON;
  }

  return next as GameSettings;
};

const loadSettings = (): GameSettings => {
  if (!storageAvailable) return DEFAULT_SETTINGS;

  try {
    const saved = localStorage.getItem(GAME_SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    return normalizeSettings(JSON.parse(saved));
  } catch (error) {
    console.warn('Kon instellingen niet laden, gebruik standaardinstellingen', error);
    localStorage.removeItem(GAME_SETTINGS_KEY);
    return DEFAULT_SETTINGS;
  }
};

const scheduleStorageWrite = (value: string, onWritten: () => void) => {
  if (!storageAvailable) return undefined;

  const write = () => {
    try {
      localStorage.setItem(GAME_SETTINGS_KEY, value);
      onWritten();
    } catch (error) {
      console.warn(`Kon ${SETTINGS_LABEL} niet opslaan`, error);
    }
  };

  const requester = (window as typeof window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback;

  if (typeof requester === 'function') {
    const id = requester(write, { timeout: 500 });
    return () => {
      const canceler = (window as typeof window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      canceler?.(id);
    };
  }

  const timeoutId = window.setTimeout(write, 150);
  return () => window.clearTimeout(timeoutId);
};

export const useSettings = (): [GameSettings, (partialOrUpdater: SettingsUpdate) => void] => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const lastSavedJsonRef = useRef<string | null>(storageAvailable ? localStorage.getItem(GAME_SETTINGS_KEY) : null);
  const cancelPendingWriteRef = useRef<(() => void) | undefined>();

  const updateSettings = useCallback((partialOrUpdater: SettingsUpdate) => {
    setSettings(previousSettings => {
      const patch = typeof partialOrUpdater === 'function'
        ? partialOrUpdater(previousSettings)
        : partialOrUpdater;

      return normalizeSettings({ ...previousSettings, ...patch });
    });
  }, []);

  useEffect(() => {
    if (!storageAvailable) return undefined;

    const nextJson = JSON.stringify(settings);
    if (nextJson === lastSavedJsonRef.current) return undefined;

    cancelPendingWriteRef.current?.();
    cancelPendingWriteRef.current = scheduleStorageWrite(nextJson, () => {
      lastSavedJsonRef.current = nextJson;
    });

    return () => {
      cancelPendingWriteRef.current?.();
      cancelPendingWriteRef.current = undefined;
    };
  }, [settings]);

  return [settings, updateSettings];
};
