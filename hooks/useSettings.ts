import { useState } from 'react';
import { CardStyle, GameMode, GameSettings, UITheme } from '../types';

export const GAME_SETTINGS_KEY = 'bus-app-game-settings-v1';

export const getDefaultSettings = (): GameSettings => ({
  mode: GameMode.DIGITAL,
  physicalMode: false,
  pyramidRows: 4,
  sharedBus: false,
  busLength: 6,
  busDecks: 1,
  cardStyle: CardStyle.CLASSIC,
  doublePyramidCards: true,
  theme: UITheme.CLASSIC,
});

export const loadSettings = (storageAvailable: boolean): GameSettings => {
  const defaultSettings = getDefaultSettings();
  if (!storageAvailable) return defaultSettings;
  try {
    const saved = localStorage.getItem(GAME_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.cardStyle === 'CREATIVE' || parsed.cardStyle === 'NEON_GLASS') parsed.cardStyle = CardStyle.NEON;
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Kon instellingen niet laden, gebruik standaardinstellingen', e);
    localStorage.removeItem(GAME_SETTINGS_KEY);
  }
  return defaultSettings;
};

export const useSettings = (storageAvailable: boolean) => useState<GameSettings>(() => loadSettings(storageAvailable));
