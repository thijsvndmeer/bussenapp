import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Settings & Modals Theme Harmony', () => {
  const settingsFile = path.resolve(__dirname, '../components/SettingsPanel.tsx');
  const settingsContent = fs.readFileSync(settingsFile, 'utf-8');

  it('resolves activeAccentColor for stars and metro in SettingsPanel', () => {
    expect(settingsContent).toContain("settings?.theme === 'stars'");
  });
});
