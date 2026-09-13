import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('card style preview', () => {
  const appSource = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');

  it('uses a fixed Card Style Preview heading', () => {
    expect(appSource).toContain('{t("Card Style Preview")}');
  });

  it('closes when the currently selected style action is pressed', () => {
    expect(appSource).toMatch(/if \(settings\.cardStyle === previewDeckStyle\) \{\s*handleDeckPreviewBack\(\);\s*return;\s*\}/);
    expect(appSource).not.toContain('disabled={settings.cardStyle === previewDeckStyle}');
  });
});
