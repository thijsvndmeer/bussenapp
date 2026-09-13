import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Galaxy card back', () => {
  const cardSource = fs.readFileSync(path.resolve(__dirname, '../components/PlayingCard.tsx'), 'utf-8');
  const animationSource = fs.readFileSync(path.resolve(__dirname, '../styles/animations.css'), 'utf-8');

  it('uses the Dark back shell and a randomized nebula instead of astrolabe artwork', () => {
    expect(cardSource).toContain('createGalaxyNebulaLayers');
    expect(cardSource).toContain("isGalaxy || isDark ? 'bg-[#020617] border-slate-800'");
    expect(cardSource).toContain('galaxy-nebula-gas');
    expect(cardSource).not.toContain('High-Precision Kinetic Astrolabe Mechanism');
  });

  it('animates nebula gas without animating the card shell', () => {
    expect(animationSource).toContain('@keyframes galaxy-nebula-drift');
    expect(animationSource).toContain('.animate-galaxy-nebula-drift');
  });
});
