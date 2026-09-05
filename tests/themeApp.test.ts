import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Theme Synchronization', () => {
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('sets root variables for STARS theme in theme effect', () => {
    expect(appContent).toContain("settings.theme === UITheme.STARS");
    expect(appContent).toMatch(/setProperty\('--theme-accent',\s*'#c084fc'\)/);
  });

  it('defines an active slot specifically for UITheme.STARS in renderActiveSlot', () => {
    expect(appContent).toMatch(/settings\.theme === UITheme\.STARS[\s\S]*?renderActiveSlot/);
  });
});
