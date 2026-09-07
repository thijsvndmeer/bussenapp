import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Theme Engine CSS', () => {
  const cssPath = path.resolve(__dirname, '../styles/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('contains complete dark luxury tokens for .theme-stars', () => {
    expect(cssContent).toContain('.theme-stars {');
    expect(cssContent).toMatch(/--theme-bg:\s*#020008/);
    expect(cssContent).toMatch(/--theme-card-bg:\s*rgba\(6,\s*4,\s*18,\s*0\.85\)/);
    expect(cssContent).toMatch(/--theme-accent:\s*#f1f5f9/);
    expect(cssContent).toMatch(/--theme-accent-secondary:\s*#c084fc/);
    expect(cssContent).toMatch(/--theme-accent-gradient:\s*linear-gradient\(135deg,\s*#f1f5f9/);
    expect(cssContent).toMatch(/--theme-accent-glow:\s*rgba\(192,\s*132,\s*252,\s*0\.3\)/);
  });

  it('uses purple/light-white gradient for .theme-stars slider fill', () => {
    expect(cssContent).toContain('.theme-stars .slider-active-fill');
    expect(cssContent).toMatch(/\.theme-stars \.slider-active-fill\s*\{\s*background:\s*linear-gradient\(90deg,\s*#f1f5f9/);
  });

  it('preserves pill shape for rounded-full buttons under .theme-stars', () => {
    expect(cssContent).toContain('.theme-stars button.rounded-full');
    expect(cssContent).toMatch(/\.theme-stars button\.rounded-full[\s\S]*?border-radius:\s*9999px/);
  });

  it('suppresses bg-animated-gradient under .theme-stars to prevent red/blue bleed', () => {
    expect(cssContent).toContain('.theme-stars .bg-animated-gradient');
  });

  it('includes .theme-stars in panel and card background overrides', () => {
    expect(cssContent).toContain('.theme-stars .glass-panel');
    expect(cssContent).toContain('.theme-stars .bg-slate-900');
  });

  it('includes .theme-stars in font family and action button styling', () => {
    expect(cssContent).toContain('.theme-stars *');
    expect(cssContent).toMatch(/\.theme-stars\s+button/);
  });

  it('contains light heineken red accent and beer color tertiary for .theme-beer', () => {
    expect(cssContent).toContain('.theme-beer {');
    expect(cssContent).toMatch(/--theme-accent:\s*#ff3333/);
    expect(cssContent).toMatch(/--theme-tertiary:\s*#f59e0b/);
    expect(cssContent).toMatch(/--theme-accent-tertiary:\s*#f59e0b/);
    expect(cssContent).toMatch(/--theme-btn-sec-bg:\s*#ff3333/);
  });
});
