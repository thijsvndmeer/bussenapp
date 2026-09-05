# Theme System & Stars Dark Epic Luxury Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand theme dependency across all UI elements (action buttons, avatar glows, bus slots, modals, settings sliders) and overhaul the Stars theme into a Dark Epic Luxury Minimalist celestial experience.

**Architecture:** Centralize CSS custom properties in `styles/index.css` and synchronize them at `:root` in `App.tsx` for all 5 themes. Refactor `PlayerAvatar.tsx`, `renderActiveSlot` in `App.tsx`, `SettingsPanel.tsx`, and modals to consume these theme variables, and rebuild `GalaxyBackground.tsx` as a luxury celestial astrolabe.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest.

---

### Task 1: Unify CSS Theme Engine in `styles/index.css`

**Files:**
- Modify: `styles/index.css`
- Test: `tests/themeEngine.test.ts`

- [ ] **Step 1: Write the failing test for theme tokens and CSS selectors**

Create `tests/themeEngine.test.ts`:
```typescript
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
    expect(cssContent).toMatch(/--theme-accent:\s*#c084fc/);
    expect(cssContent).toMatch(/--theme-accent-glow:\s*rgba\(192,\s*132,\s*252,\s*0\.28\)/);
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/themeEngine.test.ts`  
Expected: FAIL (missing `.theme-stars` selectors and dark luxury values)

- [ ] **Step 3: Update `styles/index.css` with dark luxury Stars tokens & full theme coverage**

In `styles/index.css`:
1. Update `.theme-stars`:
```css
.theme-stars {
  --theme-bg: #020008;
  --theme-card-bg: rgba(6, 4, 18, 0.85);
  --theme-card-border: 1px solid rgba(192, 132, 252, 0.18);
  --theme-font: 'Outfit', sans-serif;
  --theme-text: #f8fafc;
  --theme-text-secondary: #c084fc;
  --theme-accent: #c084fc;
  --theme-accent-glow: rgba(192, 132, 252, 0.28);
  --theme-btn-bg: linear-gradient(180deg, #1e1138 0%, #0d061c 100%);
  --theme-btn-text: #ffffff;
  --theme-btn-sec-bg: rgba(255, 255, 255, 0.04);
  --theme-btn-sec-text: #f3e8ff;
  --theme-border-radius: 16px;
}
```
2. Suppress animated gradient bleed:
```css
.theme-stars .bg-animated-gradient,
.theme-stars .from-slate-800 {
  background: #020008 !important;
  background-image: none !important;
  animation: none !important;
}
```
3. Add `.theme-stars * { font-family: 'Outfit', sans-serif !important; }`
4. Add `.theme-stars` to Card & Panel Overrides (`.theme-stars .glass-panel`, `.theme-stars .bg-slate-900`, `.theme-stars .bg-slate-950`, `.theme-stars .bg-slate-800/40`, etc.)
5. Add `.theme-stars` to input elements, text colors, and primary/secondary button styling:
```css
.theme-stars button.bg-gradient-to-r.from-red-600:not(.no-calm-override),
.theme-stars button.bg-white:not(.bg-white\/10):not(.no-calm-override),
.theme-stars button.bg-gradient-to-b.from-emerald-500:not(.no-calm-override),
.theme-stars button.bg-gradient-to-b.from-red-600:not(.no-calm-override),
.theme-stars button.bg-gradient-to-r.from-emerald-500:not(.no-calm-override),
.theme-stars button.bg-gradient-to-r.from-amber-500:not(.no-calm-override) {
  background: var(--theme-btn-bg) !important;
  background-image: var(--theme-btn-bg) !important;
  color: var(--theme-btn-text) !important;
  border: 1px solid rgba(192, 132, 252, 0.35) !important;
  border-radius: var(--theme-border-radius) !important;
  box-shadow: 0 0 20px var(--theme-accent-glow) !important;
}

.theme-stars button.bg-slate-800,
.theme-stars button.bg-slate-800\/80 {
  background: var(--theme-btn-sec-bg) !important;
  color: var(--theme-btn-sec-text) !important;
  border: var(--theme-card-border) !important;
  border-radius: var(--theme-border-radius) !important;
}
.theme-stars button.bg-slate-800:hover,
.theme-stars button.bg-slate-800\/80:hover {
  background: rgba(192, 132, 252, 0.1) !important;
  color: #ffffff !important;
  border-color: rgba(192, 132, 252, 0.3) !important;
}

.theme-stars .slider-active-fill {
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.8), rgba(192, 132, 252, 0.95)) !important;
  opacity: 0.9 !important;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/themeEngine.test.ts`  
Expected: PASS (all 4 tests pass)

- [ ] **Step 5: Commit changes**

```bash
git add styles/index.css tests/themeEngine.test.ts
git commit -m "feat(theme): unify css theme engine with dark luxury stars tokens"
```

---

### Task 2: Root Theme Synchronization & Active Slot in `App.tsx`

**Files:**
- Modify: `App.tsx:1083-1113`, `App.tsx:2824-2880`, `App.tsx:4424`, `App.tsx:4844`
- Test: `tests/themeApp.test.ts`

- [ ] **Step 1: Write the failing test for theme synchronization and active slot**

Create `tests/themeApp.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Theme Synchronization', () => {
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('sets root variables for STARS theme in theme effect', () => {
    expect(appContent).toContain("settings.theme === UITheme.STARS");
    expect(appContent).toMatch(/setProperty\('--theme-accent',\s*'#c084fc'\)/);
  });

  it('defines an active slot specifically for UITheme.STARS in renderActiveSlot', () => {
    expect(appContent).toMatch(/settings\.theme === UITheme\.STARS[\s\S]*?renderActiveSlot/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/themeApp.test.ts`  
Expected: FAIL

- [ ] **Step 3: Update `App.tsx`**

1. In `useEffect` (around line 1083):
Update theme variable setter to inject variables for all themes:
```typescript
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-metro', 'theme-calm', 'theme-beer', 'theme-stars');
    root.classList.add(`theme-${settings.theme}`, 'theme-transition');

    if (settings.theme === UITheme.CALM) {
      const accentHex = settings.calmAccentColor || '#fb7185';
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = accentHex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      const rgb = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 251, g: 205, b: 83 };

      root.style.setProperty('--theme-accent', accentHex);
      root.style.setProperty('--theme-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
      root.style.setProperty('--theme-btn-bg', accentHex);
      root.style.setProperty('--theme-btn-sec-text', accentHex);
      root.style.setProperty('--theme-card-border', `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      root.style.setProperty('--theme-border-radius', '20px');
    } else if (settings.theme === UITheme.STARS) {
      root.style.setProperty('--theme-accent', '#c084fc');
      root.style.setProperty('--theme-accent-glow', 'rgba(192, 132, 252, 0.28)');
      root.style.setProperty('--theme-btn-bg', 'linear-gradient(180deg, #1e1138 0%, #0d061c 100%)');
      root.style.setProperty('--theme-btn-sec-text', '#f3e8ff');
      root.style.setProperty('--theme-card-border', '1px solid rgba(192, 132, 252, 0.18)');
      root.style.setProperty('--theme-border-radius', '16px');
    } else if (settings.theme === UITheme.METRO) {
      root.style.setProperty('--theme-accent', '#fb7185');
      root.style.setProperty('--theme-accent-glow', 'rgba(251, 113, 133, 0.15)');
      root.style.setProperty('--theme-btn-bg', '#fb7185');
      root.style.setProperty('--theme-btn-sec-text', '#a3a3a3');
      root.style.setProperty('--theme-card-border', '1.5px solid #27272a');
      root.style.setProperty('--theme-border-radius', '6px');
    } else if (settings.theme === UITheme.BEER) {
      root.style.setProperty('--theme-accent', '#f59e0b');
      root.style.setProperty('--theme-accent-glow', 'rgba(245, 158, 11, 0.35)');
      root.style.setProperty('--theme-btn-bg', '#008200');
      root.style.setProperty('--theme-btn-sec-text', '#ffffff');
      root.style.setProperty('--theme-card-border', '1px solid rgba(226, 232, 240, 0.2)');
      root.style.setProperty('--theme-border-radius', '12px');
    } else {
      // Classic clean up
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-accent-glow');
      root.style.removeProperty('--theme-btn-bg');
      root.style.removeProperty('--theme-btn-sec-text');
      root.style.removeProperty('--theme-card-border');
      root.style.removeProperty('--theme-border-radius');
    }
  }, [settings.theme, settings.calmAccentColor]);
```

2. In `renderActiveSlot` (around line 2824):
Add explicit `UITheme.STARS` slot:
```typescript
    if (settings.theme === UITheme.STARS) {
      return (
        <div key={`current-${idx}`} className={`${commonClasses} rounded-2xl border border-purple-400/40 bg-[#060412]/90 shadow-[0_0_25px_rgba(168,85,247,0.25)] relative overflow-hidden`} style={{ zIndex: idx }}>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
          <div className="text-purple-300 opacity-90 mb-1 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
            {slotStep === 1 && <Sparkles size={18} />}
            {slotStep === 2 && <ArrowUpDown size={18} />}
            {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={10} className="rotate-180" /><ArrowRight size={10} /></div>}
            {slotStep === 4 && <Zap size={18} />}
          </div>
          <span className="text-purple-200 font-sans font-black text-xl tracking-wider drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">?</span>
        </div>
      );
    }
```

3. Update start game and bus transition buttons (lines 4424, 4844):
Remove `.no-calm-override` from generic game flow buttons that should adapt to all themes, or bind their border/shadow to theme variables.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/themeApp.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add App.tsx tests/themeApp.test.ts
git commit -m "feat(app): add root theme sync and stars active slot"
```

---

### Task 3: Overhaul `GalaxyBackground.tsx` to Dark Epic Luxury Minimalist

**Files:**
- Modify: `src/components/backgrounds/GalaxyBackground.tsx`
- Test: `tests/galaxyBackground.test.ts`

- [ ] **Step 1: Write the failing test for GalaxyBackground elements**

Create `tests/galaxyBackground.test.ts`:
```typescript
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/galaxyBackground.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Dark Epic Luxury GalaxyBackground**

Refactor `src/components/backgrounds/GalaxyBackground.tsx`:
- Obsidian base (`#010005` to `#04010d`)
- Astrolabe concentric hairline orbit rings (whisper-thin astronomical lines, subtle slow counter-rotation)
- 3-tier starfield:
  - Micro stardust: 35 pinpricks (0.6px - 0.9px, faint opacity)
  - Breathing mid stars: 22 stars (1.2px - 1.5px)
  - Diamond core stars: 5 stars (1.8px) with subtle starlight glint
- Velvety low-opacity celestial nebulae (indigo & deep violet blur clouds, max 10% opacity)
- Elegant shooting stars with starlight trail

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/galaxyBackground.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/components/backgrounds/GalaxyBackground.tsx tests/galaxyBackground.test.ts
git commit -m "feat(ui): overhaul galaxy background to dark epic luxury astrolabe"
```

---

### Task 4: Upgrade `PlayerAvatar.tsx` to Theme-Driven Accent Glows

**Files:**
- Modify: `src/components/ui/PlayerAvatar.tsx`
- Test: `tests/playerAvatarTheme.test.ts`

- [ ] **Step 1: Write the failing test for PlayerAvatar theme styling**

Create `tests/playerAvatarTheme.test.ts`:
```typescript
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/playerAvatarTheme.test.ts`  
Expected: FAIL

- [ ] **Step 3: Refactor `PlayerAvatar.tsx` to use theme variables**

In `src/components/ui/PlayerAvatar.tsx`:
- Replace `const isCalmGlow = glow && theme === UITheme.CALM;` with:
  `const isThemeGlow = glow && !player?.isDev;`
- In `calmStyle` (rename to `glowStyle`):
```typescript
  const glowStyle = isThemeGlow ? {
    borderColor: 'var(--theme-accent, #ef4444)',
    boxShadow: '0 0 30px var(--theme-accent-glow, rgba(239,68,68,0.4))',
    ...customBgStyle,
  } : customBgStyle;
```
- In pulse ring:
```typescript
  style={isThemeGlow ? { boxShadow: '0 0 0 3px var(--theme-accent-glow, rgba(239,68,68,0.4))' } : undefined}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/playerAvatarTheme.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/components/ui/PlayerAvatar.tsx tests/playerAvatarTheme.test.ts
git commit -m "feat(avatar): support dynamic theme accent glow for all themes"
```

---

### Task 5: Enhance `SettingsPanel.tsx` & Modals for Full Theme Harmony

**Files:**
- Modify: `components/SettingsPanel.tsx`, `components/modals/SlideMenuModal.tsx`, `components/modals/QuitConfirmModal.tsx`, `components/modals/PatchNotesModal.tsx`
- Test: `tests/settingsTheme.test.ts`

- [ ] **Step 1: Write the failing test for SettingsPanel and Modals**

Create `tests/settingsTheme.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Settings & Modals Theme Harmony', () => {
  const settingsFile = path.resolve(__dirname, '../components/SettingsPanel.tsx');
  const settingsContent = fs.readFileSync(settingsFile, 'utf-8');

  it('resolves activeAccentColor for stars and metro in SettingsPanel', () => {
    expect(settingsContent).toContain("settings?.theme === 'stars'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/settingsTheme.test.ts`  
Expected: FAIL

- [ ] **Step 3: Update `SettingsPanel.tsx` and modal files**

1. In `components/SettingsPanel.tsx` (around line 153):
```typescript
  const activeAccentColor = 
    settings?.theme === 'calm' ? (settings.calmAccentColor || '#fb7185') :
    settings?.theme === 'stars' ? '#c084fc' :
    settings?.theme === 'metro' ? '#fb7185' :
    settings?.theme === 'beer' ? '#f59e0b' : '#ef4444';
```
2. In `components/modals/SlideMenuModal.tsx`:
Ensure dialog background and border use theme variables:
```typescript
className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden glass-panel ${...}`}
```
(Since `.theme-stars .glass-panel` now applies `--theme-card-bg` and `--theme-card-border`, this seamlessly styles all modals).
3. In `components/modals/QuitConfirmModal.tsx` and `components/modals/PatchNotesModal.tsx`:
Ensure modal primary action buttons and headers use theme variables.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/settingsTheme.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add components/SettingsPanel.tsx components/modals/ tests/settingsTheme.test.ts
git commit -m "feat(settings): unify theme colors in settings panel and modals"
```

---

### Task 6: Full Verification & Build Validation

**Files:**
- None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`  
Expected: PASS (0 errors)

- [ ] **Step 2: Run all tests**

Run: `npm test`  
Expected: PASS (All test files passing)

- [ ] **Step 3: Run Vite build**

Run: `npm run build`  
Expected: PASS (Production build succeeds, assets generated)

- [ ] **Step 4: Final commit & cleanup**

```bash
git commit --allow-empty -m "chore: complete theme engine and stars overhaul verification"
```
