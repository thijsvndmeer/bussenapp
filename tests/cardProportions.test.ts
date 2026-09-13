import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Card proportions consistency', () => {
  const cardSource = fs.readFileSync(path.resolve(__dirname, '../components/PlayingCard.tsx'), 'utf-8');

  it('uses container query inline-size on card container for fluid scaling', () => {
    expect(cardSource).toContain('@container');
    expect(cardSource).toContain("containerType: 'inline-size'");
  });

  it('locks bussen text proportion (11.5%)', () => {
    expect(cardSource).toContain('text-[11.5cqw]');
  });

  it('locks giant letter size to pyramid ratio (75%)', () => {
    expect(cardSource).toContain('text-[75cqw]');
  });

  it('locks royal icons to pyramid ratio (25%)', () => {
    expect(cardSource).toContain('w-[25cqw] h-[25cqw]');
  });

  it('locks center suit icon to pyramid ratio (46.875%)', () => {
    expect(cardSource).toContain('w-[46.875cqw] h-[46.875cqw]');
  });

  it('locks pip size to pyramid ratio (17.1875%)', () => {
    expect(cardSource).toContain('w-[17.1875cqw] h-[17.1875cqw]');
  });

  it('locks corner rank text and icon to pyramid ratios', () => {
    expect(cardSource).toContain('text-[18.75cqw]');
    expect(cardSource).toContain('w-[10.9375cqw] h-[10.9375cqw]');
  });
});
