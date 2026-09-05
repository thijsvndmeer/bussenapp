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
});
