# UI Theme Overhaul Design Spec

Design specification for adding dynamic high-end UI themes (`classic`, `metro`, `calm`, `beer`) and separating the Beer Card Style in the Bussen Companion app.

## User Review Required

> [!IMPORTANT]
> - **Theme-Only Scoped Colors:** Themes will only modify colors, gradients, backgrounds, shadows, and ambient animations. They will not modify game text or force specific card deck styles.
> - **Separate Card Style:** A new card style `BEER` is introduced under settings `CardStyle`, allowing users to select the Beer Pint visual deck on any theme.

## Proposed Changes

### 1. Types & Interfaces

#### [MODIFY] [types.ts](file:///Users/thijsvandermeer/Downloads/bussenapp/types.ts)
- Add `UITheme` enum:
  ```typescript
  export enum UITheme {
    CLASSIC = 'classic',
    METRO = 'metro',
    CALM = 'calm',
    BEER = 'beer',
  }
  ```
- Modify `CardStyle` enum to add `BEER`:
  ```typescript
  export enum CardStyle {
    MODERN = 'MODERN',
    DARK = 'DARK',
    CLASSIC = 'CLASSIC',
    NEON = 'NEON',
    BEER = 'BEER',
  }
  ```
- Modify `GameSettings` to include `theme: UITheme`.

### 2. Styling System

#### [MODIFY] [index.html](file:///Users/thijsvandermeer/Downloads/bussenapp/index.html)
- Add global CSS variable themes on root/viewport parent:
  ```css
  /* Classic Theme */
  .theme-classic {
    --theme-bg: #020617;
    --theme-card-bg: rgba(15, 23, 42, 0.6);
    --theme-card-border: 1px solid rgba(255, 255, 255, 0.1);
    --theme-font: 'Inter', sans-serif;
    --theme-text: #f3f4f6;
    --theme-text-secondary: #94a3b8;
    --theme-accent: #fb7185;
    --theme-accent-glow: rgba(251, 113, 133, 0.4);
    --theme-btn-bg: #fb7185;
    --theme-btn-text: #ffffff;
    --theme-btn-sec-bg: rgba(255, 255, 255, 0.1);
    --theme-btn-sec-text: #f3f4f6;
    --theme-border-radius: 1.5rem;
  }

  /* Metro Theme */
  .theme-metro {
    --theme-bg: #0d0d0d;
    --theme-card-bg: #161616;
    --theme-card-border: 1.5px solid #ffcc00;
    --theme-font: 'Space Grotesk', sans-serif;
    --theme-text: #ffffff;
    --theme-text-secondary: #a3a3a3;
    --theme-accent: #ffcc00;
    --theme-accent-glow: rgba(255, 204, 0, 0.2);
    --theme-btn-bg: #ffcc00;
    --theme-btn-text: #0d0d0d;
    --theme-btn-sec-bg: transparent;
    --theme-btn-sec-text: #ffcc00;
    --theme-border-radius: 6px;
  }

  /* Calm Theme */
  .theme-calm {
    --theme-bg: #0b0d19;
    --theme-card-bg: rgba(22, 27, 51, 0.65);
    --theme-card-border: 1px solid rgba(229, 169, 59, 0.25);
    --theme-font: 'Playfair Display', Georgia, serif;
    --theme-text: #ffffff;
    --theme-text-secondary: #94a3b8;
    --theme-accent: #e5a93b;
    --theme-accent-glow: rgba(229, 169, 59, 0.35);
    --theme-btn-bg: #e5a93b;
    --theme-btn-text: #0b0d19;
    --theme-btn-sec-bg: transparent;
    --theme-btn-sec-text: #e5a93b;
    --theme-border-radius: 20px;
  }

  /* Beer Theme */
  .theme-beer {
    --theme-bg: #032b12;
    --theme-card-bg: rgba(2, 43, 18, 0.85);
    --theme-card-border: 1px solid rgba(255, 204, 0, 0.25);
    --theme-font: 'Space Grotesk', sans-serif;
    --theme-text: #ffffff;
    --theme-text-secondary: #9edc9e;
    --theme-accent: #dc2626;
    --theme-accent-glow: rgba(220, 38, 38, 0.4);
    --theme-btn-bg: #008200;
    --theme-btn-text: #ffffff;
    --theme-btn-sec-bg: #dc2626;
    --theme-btn-sec-text: #ffffff;
    --theme-border-radius: 12px;
  }
  ```
- Add background effects layers:
  - Transit overlay pattern for `metro`.
  - Floating soft nebulas for `calm`.
  - Floating carbonation bubble generator for `beer`.
- Add CSS Card styles mapping for the new `BEER` card style:
  ```css
  .card-beer-style {
    background: linear-gradient(to bottom, #ffffff 20%, #ffde6a 20%, #f59e0b 100%) !important;
    border: 3px solid #ffcc00 !important;
    color: #041f0c !important;
    box-shadow: 0 15px 30px rgba(0,0,0,0.4), inset 0 0 15px rgba(255, 204, 0, 0.4) !important;
  }
  ```

### 3. Application Updates

#### [MODIFY] [App.tsx](file:///Users/thijsvandermeer/Downloads/bussenapp/App.tsx)
- Set default theme to `UITheme.CLASSIC` in settings initializer.
- Render dynamic ambient background layers on the root container based on active theme settings.
- Bind container CSS class dynamically: `.theme-${settings.theme}`.
- Refactor key card and profile elements in `App.tsx` (such as active player card panels, settings page blocks, buttons) to use `--theme-*` CSS variables instead of hardcoded tailwind slate classes.
- Update settings switcher layout to add an MCP Shadcn-style Tabs selector for UI Themes and a Card Style selector with the new `Beer` option.

## Verification Plan

### Manual Verification
- Deploy locally using `npm run dev`.
- Verify theme selection saves and restores properly on reload.
- Verify changing UI Theme dynamically updates fonts, backgrounds, buttons, and animations.
- Verify changing Card Style to `Beer` displays a beer liquid gradient with foam top.
