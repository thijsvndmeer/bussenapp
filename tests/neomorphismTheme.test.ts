import { describe, it, expect } from 'vitest';
import { CardStyle, UITheme } from '../types';
import { dictionaries } from '../i18n';
import fs from 'fs';
import path from 'path';

describe('Neomorphism Theme and Card Style System', () => {
  it('defines NEOMORPHISM in UITheme and CardStyle', () => {
    expect(UITheme.NEOMORPHISM).toBe('neomorphism');
    expect(CardStyle.NEOMORPHISM).toBe('NEOMORPHISM');
  });

  it('contains translations for Neomorphism in nl and en dictionaries', () => {
    expect(dictionaries.nl['Neomorphism']).toBe('Neumorfisme');
    expect(dictionaries.nl['Neomorfisme Thema']).toBe('Neumorfisme Thema');
    expect(dictionaries.nl['Neomorfisme Kaartstijl']).toBe('Neumorfisme Kaartstijl');

    expect(dictionaries.en['Neomorphism']).toBe('Neumorphism');
    expect(dictionaries.en['Neomorfisme Thema']).toBe('Neumorphism Theme');
    expect(dictionaries.en['Neomorfisme Kaartstijl']).toBe('Neumorphism Card Style');
  });

  it('verifies Neomorphism CSS tokens and classes in index.css', () => {
    const cssPath = path.resolve(__dirname, '../styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain("[data-theme='neomorphism']");
    expect(cssContent).toContain('--neo-shadow-raised');
    expect(cssContent).toContain('--neo-shadow-inset');
    expect(cssContent).toContain('.neo-raised');
    expect(cssContent).toContain('.neo-inset');
    expect(cssContent).toContain('.neo-btn-convex');
    expect(cssContent).toContain('.neo-led-dot');
  });

  it('ensures Neomorphism unlock in App.tsx is gated by isGalaxyUnlocked', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Theme switch button in settings is gated by isGalaxyUnlocked
    expect(appContent).toMatch(/\(isGalaxyUnlocked\s*\|\|\s*settings\.theme\s*===\s*UITheme\.NEOMORPHISM\)/);
    expect(appContent).toContain("settings.theme === UITheme.NEOMORPHISM");
    expect(appContent).toContain("settings.cardStyle === CardStyle.NEOMORPHISM");
  });

  it('ensures Neomorphism background is wired into PersistentBackground', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    expect(appContent).toContain("<NeomorphicBackground />");
  });

  it('ensures PlayingCard renders Neomorphism card back with debossed concentric pattern and cyan LED', () => {
    const cardPath = path.resolve(__dirname, '../components/PlayingCard.tsx');
    const cardContent = fs.readFileSync(cardPath, 'utf-8');

    expect(cardContent).toContain("style === CardStyle.NEOMORPHISM");
    expect(cardContent).toContain("#171a23");
    expect(cardContent).toContain("#38bdf8");
  });

  it('strictly enforces zero-blur architecture across neomorphism CSS and components', () => {
    const cssPath = path.resolve(__dirname, '../styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain("backdrop-filter: none !important;");
    expect(cssContent).toContain("--tw-backdrop-blur: none !important;");

    const bgPath = path.resolve(__dirname, '../src/components/backgrounds/NeomorphicBackground.tsx');
    const bgContent = fs.readFileSync(bgPath, 'utf-8');
    expect(bgContent).not.toContain('blur');

    const badgePath = path.resolve(__dirname, '../src/components/ui/neomorphism/NeomorphicBadge.tsx');
    const badgeContent = fs.readFileSync(badgePath, 'utf-8');
    expect(badgeContent).not.toContain('blur');

    const buttonPath = path.resolve(__dirname, '../src/components/ui/neomorphism/NeomorphicButton.tsx');
    const buttonContent = fs.readFileSync(buttonPath, 'utf-8');
    expect(buttonContent).not.toContain('blur');

    const switchPath = path.resolve(__dirname, '../src/components/ui/neomorphism/NeomorphicSwitch.tsx');
    const switchContent = fs.readFileSync(switchPath, 'utf-8');
    expect(switchContent).not.toContain('blur');
  });

  it('verifies neomorphism light variant tokens and theme classes exist', () => {
    const cssPath = path.resolve(__dirname, '../styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain("[data-theme='neomorphism-light']");
    expect(cssContent).toContain('.theme-neomorphism-light');
    expect(cssContent).toContain('--theme-bg-base: #edf1f7');
    expect(cssContent).toContain('--theme-text: #1e293b');
  });

  it('ensures PlayerAvatar and border system does not branch on specific themes', () => {
    const avatarPath = path.resolve(__dirname, '../src/components/ui/PlayerAvatar.tsx');
    const avatarContent = fs.readFileSync(avatarPath, 'utf-8');

    // Avatar styling must NOT depend on UITheme.NEOMORPHISM
    expect(avatarContent).not.toContain('UITheme.NEOMORPHISM');
    expect(avatarContent).not.toContain('isNeomorphism');
    // Ensure avatar image has rounded-full to avoid sub-pixel border collisions
    expect(avatarContent).toContain('className="w-full h-full object-cover rounded-full"');
  });

  it('ensures App.tsx wires neomorphism light variant and accent color picker', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    expect(appContent).toContain("settings.neoVariant");
    expect(appContent).toContain("theme-neomorphism-light");
    expect(appContent).toContain("neoVariant: 'light'");
  });
});
