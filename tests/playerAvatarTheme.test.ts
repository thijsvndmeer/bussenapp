import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PlayerAvatar Theme Support', () => {
  const file = path.resolve(__dirname, '../src/components/ui/PlayerAvatar.tsx');
  const content = fs.readFileSync(file, 'utf-8');

  it('uses theme accent CSS variables for avatar glow on any theme', () => {
    expect(content).not.toContain('const isCalmGlow = glow && theme === UITheme.CALM');
    expect(content).toContain('var(--theme-accent');
    expect(content).toContain('var(--theme-accent-glow');
  });

  it('keeps avatar background predominantly black with accent color on avatar itself, not border', () => {
    expect(content).toContain("'from-black to-slate-900'");
    expect(content).not.toContain('${accentColor}88');
    expect(content).not.toContain('borderColor: accentColor');
    expect(content).toContain('border-slate-600/50');
    expect(content).toContain('#000000');
  });

  it('owns the standard avatar border in PlayerAvatar rather than at call sites', () => {
    expect(content).toContain("const PLAYER_AVATAR_BORDER_CLASS = 'border-2 border-slate-600/50'");

    const appContent = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
    const busContent = fs.readFileSync(path.resolve(__dirname, '../components/AnimatedPartyBus.tsx'), 'utf-8');
    const avatarUsages = `${appContent}\n${busContent}`.match(/<PlayerAvatar[\s\S]*?\/>/g) || [];

    avatarUsages.forEach((usage) => {
      expect(usage).not.toMatch(/className=["{`][^>]*\bborder-/);
    });
  });

  it('keeps the dev-mode border as a centralized avatar state', () => {
    expect(content).toContain("const borderClass = isDev ? 'border-2 border-green-400/70' : PLAYER_AVATAR_BORDER_CLASS");
  });
});
