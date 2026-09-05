# Design Specification: Full-App Theme Engine & Stars Dark Epic Luxury Overhaul

**Date:** 2026-09-05  
**Topic:** Unified Theme Engine & Stars Dark Epic Luxury Overhaul  
**Target Repository:** [`/Users/thijsvandermeer/Downloads/bussenapp`](file:///Users/thijsvandermeer/Downloads/bussenapp)

---

## 1. Overview & Goals

### 1.1 Context
The application supports multiple themes ([`UITheme.CLASSIC`](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts#L70), [`METRO`](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts#L71), [`CALM`](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts#L72), [`BEER`](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts#L73), [`STARS`](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts#L74)). However:
1. Many UI elements (primary action buttons like "START SPEL" and "NAAR DE BUS", active player avatar glows, modals, Quick Settings sliders, and the bus active slot) either hardcode red/green styles or only conditionally style for `CALM`.
2. The Stars theme was incomplete in [`styles/index.css`](file:///Users/thijsvandermeer/Downloads/bussenapp/styles/index.css), causing panels and buttons to fall back to plain dark slate, while the classic animated red/blue gradient bled through underneath the background.
3. The Stars theme aesthetic needs an overhaul towards **Dark Epic Luxury & Minimalist** — an obsidian celestial astrolabe aesthetic inspired by luxury astronomical timepieces: pure dark void, diamond pinprick starlight, whisper-thin hairline rings, velvety nebulae, and focused starlight glow without oversaturated purple clutter.

### 1.2 Goals
- **Full App Theme Propagation:** Ensure all interactive elements (action buttons, avatar glow, card slots, modal cards, inputs, sliders, toggles) adhere to the active theme tokens.
- **Dark Epic Luxury Stars Theme:** Transform Stars theme into a refined, high-end, dark celestial experience.
- **Architectural Cleanliness:** Unify theme tokens into CSS custom properties (`--theme-*`) synced at `:root` in [`App.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/App.tsx) and `.theme-*` classes in [`styles/index.css`](file:///Users/thijsvandermeer/Downloads/bussenapp/styles/index.css).

---

## 2. Visual Design & Aesthetic: "Celestial Astrolabe"

### 2.1 Palette & Surface Tokens for Stars Theme
- **Base Canvas (`--theme-bg`):** `#020008` (Ultra-deep obsidian void).
- **Cards & Panels (`--theme-card-bg`):** `rgba(6, 4, 18, 0.85)` with `backdrop-blur-2xl`.
- **Card Borders (`--theme-card-border`):** `1px solid rgba(192, 132, 252, 0.18)` with subtle inner glow.
- **Primary Accent (`--theme-accent`):** `#c084fc` (Refined starlight lavender).
- **Secondary / Glint Accent:** `#fef08a` / `#e9d5ff` (Champagne star-core glint).
- **Accent Glow (`--theme-accent-glow`):** `rgba(192, 132, 252, 0.28)` (Restrained optical halo, not loud neon wash).
- **Primary Buttons (`--theme-btn-bg`):** `linear-gradient(180deg, #1e1138 0%, #0d061c 100%)` with starlight edge `border border-purple-400/35`.
- **Primary Button Text (`--theme-btn-text`):** `#ffffff` with `text-shadow: 0 0 10px rgba(192,132,252,0.4)`.
- **Secondary Buttons (`--theme-btn-sec-bg`):** `rgba(255, 255, 255, 0.04)` with `border border-white/10`.
- **Radius (`--theme-border-radius`):** `16px`.
- **Typography:** `'Outfit', sans-serif` for clean, modern luxury.

### 2.2 Background: [`GalaxyBackground.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/src/components/backgrounds/GalaxyBackground.tsx)
1. **Zero Bleed:** Override `bg-animated-gradient` in `.theme-stars` to suppress classic red/blue canvas animations.
2. **Deep Obsidian Void:** Layer 0 pure dark gradient `#010005` to `#04010d`.
3. **Astrolabe Orbit Rings:** Delicate concentric hairline rings with subtle slow rotation, echoing high-end celestial watchmakers.
4. **Three-Tier Starfield:**
   - Layer A (Micro dust): 40 pinprick stars, 0.6px–1px, gentle ambient drift.
   - Layer B (Mid stars): 25 stars, 1.2px–1.6px, breathing twinkle (opacity 0.25 to 0.75).
   - Layer C (Diamond stars): 6 crisp stars with 4-point micro cross glint (`#fef08a`, `#e9d5ff`).
5. **Cosmic Nebulae:** Velvety, low-opacity (<10%) celestial indigo and deep violet blur clouds; non-distracting.
6. **Shooting Stars:** Rare, swift, needle-thin comets with fading starlight tails.

---

## 3. Component Theme Expansion & Technical Details

### 3.1 Root Token Synchronization ([`App.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/App.tsx#L1083-L1113))
- In the theme effect, update `:root` custom properties for **all** themes:
  - When theme is `CALM`: Keep dynamic user accent color computation (`calmAccentColor`).
  - When theme is `STARS`: Inject Stars tokens (`--theme-accent: #c084fc`, `--theme-accent-glow: rgba(192, 132, 252, 0.28)`, `--theme-btn-bg: linear-gradient(180deg, #1e1138 0%, #0d061c 100%)`, etc.).
  - When theme is `METRO`: Inject Metro tokens (`--theme-accent: #fb7185`, etc.).
  - When theme is `BEER`: Inject Beer tokens (`--theme-accent: #f59e0b`, `--theme-btn-bg: #008200`, etc.).
  - When theme is `CLASSIC`: Reset to classic defaults.

### 3.2 Stylesheet Integration ([`styles/index.css`](file:///Users/thijsvandermeer/Downloads/bussenapp/styles/index.css))
- Add `.theme-stars` to:
  - **Font family rule:** `.theme-stars * { font-family: 'Outfit', sans-serif !important; }`
  - **Background override:** `.theme-stars .bg-animated-gradient, .theme-stars .from-slate-800 { background: #020008 !important; background-image: none !important; animation: none !important; }`
  - **Glass & Card panels:** Include `.theme-stars .glass-panel`, `.theme-stars .bg-slate-900`, etc., applying `var(--theme-card-bg)`, `var(--theme-card-border)`, and `var(--theme-border-radius)`.
  - **Input elements:** Include `.theme-stars input:not([type="range"])`.
  - **Action buttons:** Style primary action buttons under `.theme-stars` using `--theme-btn-bg` and `--theme-accent-glow`.
  - **Secondary buttons:** Style `.theme-stars button.bg-slate-800` to use obsidian glass with starlight borders.
  - **Sliders:** Support `.theme-stars .slider-active-fill` with starlight gradient/lavender fill.

### 3.3 Active Player Avatar Glow ([`src/components/ui/PlayerAvatar.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/src/components/ui/PlayerAvatar.tsx))
- Generalize `isCalmGlow`: Replace theme-specific hardcoded red fallback with CSS variable driven styling:
  - `borderColor: 'var(--theme-accent, #ef4444)'`
  - `boxShadow: '0 0 25px var(--theme-accent-glow, rgba(239,68,68,0.4))'`
  - Ring pulse: `boxShadow: '0 0 0 3px var(--theme-accent-glow)'`
- Stars theme active player gets an elegant celestial starlight halo.

### 3.4 Active Bus Slot ([`App.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/App.tsx#L2824))
- In `renderActiveSlot`, add explicit `settings.theme === UITheme.STARS` case:
  - Monolith obsidian card (`bg-[#060412]/90 border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.25)] rounded-2xl`).
  - Active step icon rendered in starlight lavender (`text-purple-300`).
  - Mystery question mark `?` styled with subtle celestial shimmer.

### 3.5 Primary Action Buttons & Modals
- **Start Game ("START SPEL"):** Replace hardcoded red gradient `bg-gradient-to-r from-red-600 to-red-800` with theme-compatible styling (using `--theme-btn-bg` and starlight shadow).
- **"NAAR DE BUS" / "START PIRAMIDE":** Update transition buttons to use theme tokens.
- **Modals ([`SlideMenuModal.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/components/modals/SlideMenuModal.tsx), [`QuitConfirmModal.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/components/modals/QuitConfirmModal.tsx), [`PatchNotesModal.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/components/modals/PatchNotesModal.tsx)):** Ensure modal card backgrounds, headers, and buttons inherit theme card and button variables.
- **Settings Sliders ([`components/SettingsPanel.tsx`](file:///Users/thijsvandermeer/Downloads/bussenapp/components/SettingsPanel.tsx)):** Ensure `activeAccentColor` resolves to `#c084fc` for Stars theme, keeping slider thumbs and active bars consistent.

---

## 4. Verification & Testing

1. **Static Type Checking & Compilation:** Run `npm run build` or `npx tsc --noEmit` to guarantee no broken TypeScript interfaces or syntax errors.
2. **Visual Token Audit:** Inspect CSS cascade to verify no `!important` conflicts block theme switches between Classic, Metro, Calm, Beer, and Stars.
3. **No Browser Testing (User Constraint):** Strict adherence to rule: *"NEVER test in browser unless explicitly requested by the user"*. Verification conducted via code compilation and static checks.
