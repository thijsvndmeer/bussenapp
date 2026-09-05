import { describe, it, expect } from 'vitest';
import { dictionaries, Language } from '../i18n';

describe('i18n Translation System', () => {
  it('has both Dutch overrides (nl) and English (en) dictionaries populated', () => {
    expect(dictionaries.nl).toBeDefined();
    expect(dictionaries.en).toBeDefined();
    expect(Object.keys(dictionaries.nl).length).toBeGreaterThan(50);
    expect(Object.keys(dictionaries.en).length).toBeGreaterThan(200);
  });

  it('ensures Dutch override keys have English translations in dictionaries.en', () => {
    const nlOverrideKeys = Object.keys(dictionaries.nl);
    const missingInEn: string[] = [];

    nlOverrideKeys.forEach((key) => {
      // Check if key or its translated value exists in en dictionary
      const val = dictionaries.nl[key];
      if (!(key in dictionaries.en) && !(val in dictionaries.en)) {
        missingInEn.push(key);
      }
    });

    // Report if any Dutch UI override has zero corresponding English translation
    expect(missingInEn, `Keys missing in English dictionary: ${missingInEn.join(', ')}`).toEqual([]);
  });

  it('ensures no dictionary entries have empty or whitespace-only values', () => {
    (['nl', 'en'] as Language[]).forEach((lang) => {
      const dict = dictionaries[lang];
      Object.entries(dict).forEach(([key, val]) => {
        expect(typeof val).toBe('string');
        expect(val.trim().length, `Empty translation for key "${key}" in ${lang}`).toBeGreaterThan(0);
      });
    });
  });

  it('translates correctly with dictionary lookups and fallbacks', () => {
    // English lookup
    expect(dictionaries.en['Instellingen']).toBe('Settings');
    expect(dictionaries.en['Spelers']).toBe('Players');
    expect(dictionaries.en['Gedeelde Bus']).toBe('Shared Bus');

    // Dutch override lookup
    expect(dictionaries.nl['Creative']).toBe('Neon');
    expect(dictionaries.nl['metro']).toBe('Bus');
  });
});
