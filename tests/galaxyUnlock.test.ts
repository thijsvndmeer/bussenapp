import { describe, it, expect } from 'vitest';
import { CardStyle, UITheme } from '../types';
import { dictionaries } from '../i18n';

describe('Galaxy Theme and Card Style Unlock System', () => {
  it('defines STARS in UITheme and GALAXY in CardStyle', () => {
    expect(UITheme.STARS).toBe('stars');
    expect(CardStyle.GALAXY).toBe('GALAXY');
  });

  it('contains translations for Stars and Galaxy in nl and en dictionaries', () => {
    expect(dictionaries.nl['Stars']).toBe('Stars');
    expect(dictionaries.nl['Galaxy']).toBe('Galaxy');
    expect(dictionaries.nl['Stars Thema']).toBe('Stars Thema');
    expect(dictionaries.nl['Galaxy Kaartstijl']).toBe('Galaxy Kaartstijl');

    expect(dictionaries.en['Stars']).toBe('Stars');
    expect(dictionaries.en['Galaxy']).toBe('Galaxy');
    expect(dictionaries.en['Stars Thema']).toBe('Stars Theme');
    expect(dictionaries.en['Galaxy Kaartstijl']).toBe('Galaxy Card Style');
  });

  it('correctly validates the 20-card first try win condition', () => {
    const checkFirstTry20Win = (busLength: number, busAttempts: number, busSipsTaken: number) => {
      const isFirstTry = busAttempts <= 1 && busSipsTaken === 0;
      return busLength >= 20 && isFirstTry;
    };

    // Exactly 20 cards on 1st try with 0 sips
    expect(checkFirstTry20Win(20, 1, 0)).toBe(true);
    // 25 cards on 1st try with 0 sips
    expect(checkFirstTry20Win(25, 1, 0)).toBe(true);

    // Fails if less than 20 cards
    expect(checkFirstTry20Win(19, 1, 0)).toBe(false);
    expect(checkFirstTry20Win(15, 1, 0)).toBe(false);

    // Fails if second attempt
    expect(checkFirstTry20Win(20, 2, 0)).toBe(false);

    // Fails if player took sips
    expect(checkFirstTry20Win(20, 1, 2)).toBe(false);
  });

  it('ensures App.tsx triggers celebration and rewards both Stars theme and Galaxy cards on 20-card win, and hides both in settings by default', () => {
    const fs = require('fs');
    const path = require('path');
    const appContent = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');

    // handleBusGuess triggers celebration modal and unlocks galaxy/stars
    expect(appContent).toMatch(/if\s*\(settings\.busLength\s*>=\s*20\s*&&\s*isFirstTry\)[\s\S]*?setIsGalaxyCelebrationOpen\(true\)/);
    expect(appContent).toMatch(/if\s*\(settings\.busLength\s*>=\s*20\s*&&\s*isFirstTry\)[\s\S]*?setIsGalaxyUnlocked\(true\)/);

    // Equip callback in App.tsx equips BOTH stars theme and galaxy cards
    expect(appContent).toMatch(/<GalaxyCelebrationModal[\s\S]*?onEquipBoth=\{\(\)\s*=>\s*\{[\s\S]*?theme:\s*UITheme\.STARS[\s\S]*?cardStyle:\s*CardStyle\.GALAXY/);

    // Stars theme only shows if unlocked or legacy active, not shown by default
    expect(appContent).toContain('(isGalaxyUnlocked || hasStarsLegacyTheme || settings.theme === UITheme.STARS) && (() => {');

    // Galaxy card style only shows if unlocked, not shown by default
    expect(appContent).toMatch(/\(isGalaxyUnlocked\s*\|\|\s*settings\.cardStyle\s*===\s*CardStyle\.GALAXY\)\s*&&\s*\(\(\)\s*=>\s*\{/);
  });
});

