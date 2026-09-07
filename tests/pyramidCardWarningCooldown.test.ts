import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { dictionaries } from '../i18n';

describe('Pyramid Already Flipped Card Warning Cooldown', () => {
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('declares alreadyFlippedWarningCooldownRef in App.tsx', () => {
    expect(appContent).toContain('alreadyFlippedWarningCooldownRef');
  });

  it('checks cooldown specifically lasts until notification is done (1200ms) for already flipped warning', () => {
    expect(appContent).toContain('NOTIFICATION_DURATION_MS = 1200');
    expect(appContent).toContain('isAlreadyFlippedActiveRef');
    expect(appContent).toContain('alreadyFlippedWarningCooldownRef.current = Date.now() + NOTIFICATION_DURATION_MS');
  });

  it('identifies already flipped card warning in both Dutch and English', () => {
    expect(dictionaries.nl['Deze kaart is al omgedraaid!']).toBe('Deze kaart is al omgedraaid!');
    expect(dictionaries.en['Deze kaart is al omgedraaid!']).toBe('This card has already been flipped!');

    expect(appContent).toContain('customText === t("Deze kaart is al omgedraaid!")');
    expect(appContent).toContain('customText === "Deze kaart is al omgedraaid!"');
    expect(appContent).toContain('customText === "This card has already been flipped!"');
  });

  it('simulates cooldown behavior until notification is done (1200ms)', () => {
    let callCount = 0;
    let notificationDoneTime = 0;
    const NOTIFICATION_DURATION = 1200;

    const triggerWarning = (customText: string, now: number) => {
      const isAlreadyFlipped =
        customText === dictionaries.nl['Deze kaart is al omgedraaid!'] ||
        customText === dictionaries.en['Deze kaart is al omgedraaid!'];

      if (isAlreadyFlipped) {
        if (now < notificationDoneTime) {
          return false;
        }
        notificationDoneTime = now + NOTIFICATION_DURATION;
      }
      callCount++;
      return true;
    };

    // First call at t = 1000ms: should trigger
    expect(triggerWarning('Deze kaart is al omgedraaid!', 1000)).toBe(true);
    expect(callCount).toBe(1);

    // Call at t = 1500ms (within 1200ms notification message): should be blocked
    expect(triggerWarning('Deze kaart is al omgedraaid!', 1500)).toBe(false);
    expect(callCount).toBe(1);

    // Call at t = 2199ms (still within notification message duration): should be blocked
    expect(triggerWarning('Deze kaart is al omgedraaid!', 2199)).toBe(false);
    expect(callCount).toBe(1);

    // Call at t = 2200ms (notification message is done): should trigger only then
    expect(triggerWarning('Deze kaart is al omgedraaid!', 2200)).toBe(true);
    expect(callCount).toBe(2);
  });
});
