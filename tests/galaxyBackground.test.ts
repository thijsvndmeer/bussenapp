import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GalaxyBackground Component', () => {
  const file = path.resolve(__dirname, '../src/components/backgrounds/GalaxyBackground.tsx');
  const content = fs.readFileSync(file, 'utf-8');

  it('features celestial astrolabe orbit rings', () => {
    expect(content).toContain('astrolabe');
  });

  it('renders refined starfield with multi-tier depth', () => {
    expect(content).toContain('microStars');
    expect(content).toContain('diamondStars');
  });

  it('uses deep obsidian canvas without light gradient wash', () => {
    expect(content).toContain('#010005');
  });

  it('contains no text labels to maintain a pure dark void', () => {
    expect(content).not.toContain('<text');
    expect(content).not.toContain('CASSIOPEIA');
    expect(content).not.toContain('CYGNUS');
    expect(content).not.toContain('URSA MAJOR');
    expect(content).not.toContain('ORION');
  });
});
