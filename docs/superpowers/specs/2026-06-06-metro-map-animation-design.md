# Spec: Standalone HTML Metro Map Animation

## Goal
Create a standalone `metro-map.html` page in the repository root. The page displays a futuristic metro map animation on a dark grid. Lines extend slowly and sequentially, starting and ending off-screen. Stations pop in as the extending lines reach their coordinates. The animation runs in an infinite auto-playing loop.

## Aesthetic Requirements
- **Theme**: Subtle dark mode.
- **Background**: Hex `#0b0c10` with a subtle dark grey/blue grid (`#141724` grid lines, 30px spacing).
- **Metro Lines**: Flat, solid, high-contrast muted colors. No blur filters, no drop shadows, no text labels.
  - Line 1 (Steel Blue): `#2b7a78`
  - Line 2 (Crimson): `#9a3652`
  - Line 3 (Gold): `#bda15d`
  - Line 4 (Muted Forest Green): `#3d7254`
- **Stations**: Simple circular icons with a concentric ring structure. Outer ring and inner dot are the *same* color as the line it belongs to (or one of the lines at an intersection). No text labels, no glow.
  - Inactive state: `opacity: 0; transform: scale(0);`
  - Active state: `opacity: 1; transform: scale(1);` (transitions slowly when reached).

## Technical Architecture
- **Single File**: A fully self-contained HTML file containing styles, SVG nodes, and JS controllers. No external CDNs or assets are needed.
- **Responsive Viewport**: SVG uses `viewBox="0 0 1000 600"` and scales to fit the viewport responsively.
- **Line Animation Method**:
  - SVG paths represent metro lines.
  - Lines start and end off-screen (positions outside `[0,0]` and `[1000,600]`).
  - Lines grow using SVG stroke-dasharray and stroke-dashoffset animations.
  - Sequential progression: Line 2 starts growing after Line 1 is fully drawn, and so forth.
- **Station Placement & Reveal**:
  - Stations are defined as percentages (0.0 to 1.0) along their respective parent path.
  - During animation, JS monitors path progression (by tracking/interpolating progress or using CSS transition timers).
  - JS queries points along the path using `path.getPointAtLength(distance)` to position the station circle elements dynamically, ensuring perfect alignment on any screen size.
  - A station fades/pops in when the drawing progress of its parent line exceeds the station's defined percentage.
- **Infinite Loop**:
  - Once all lines and stations are fully drawn, the map remains complete for a 4-second pause.
  - The map then fades out entirely over 1 second, resets all lines/stations to inactive states, and restarts the animation sequence.

## Component Specifications

### 1. HTML Shell
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>System Metro Map</title>
  <style>
    /* Reset and dark theme layout */
  </style>
</head>
<body>
  <div class="grid-background"></div>
  <svg id="metro-svg" viewBox="0 0 1000 600"></svg>
  <script>
    // Animation driver and path calculations
  </script>
</body>
</html>
```

### 2. Line Data Structure
We define 4 distinct metro lines, each starting and ending off-screen:
- **Steel Blue Line**: Starts at top-left `(-50, 100)`, runs horizontally to `(300, 100)`, diagonals down-right to `(500, 300)`, goes horizontally to `(1050, 300)`.
- **Crimson Line**: Starts at bottom-left `(-50, 500)`, runs horizontally to `(200, 500)`, diagonals up-right to `(400, 300)`, diagonals up-right to `(550, 150)`, goes horizontally to `(1050, 150)`.
- **Gold Line**: Starts at top-center `(500, -50)`, runs vertically down to `(500, 200)`, diagonals down-left to `(350, 350)`, runs vertically down to `(350, 650)`.
- **Forest Green Line**: Starts at bottom-center `(700, 650)`, runs vertically up to `(700, 450)`, diagonals up-left to `(500, 250)`, diagonals up-left to `(250, 250)`, goes horizontally to `(-50, 250)`.

### 3. Station Logic
Each line will have 3-5 stations mapped at fixed progress percentages along the path length:
- JS calculates the physical pixel coordinates of these stations using `path.getPointAtLength(progress * totalLength)`.
- Station elements (`<g class="station">` wrapping outer circle and inner circle) are generated dynamically at startup and appended to the SVG.
- During drawing, we measure line progress. If `currentLength >= station.length`, add `.active` class to the station.

### 4. Animation Timing
- Draw time per line: 3.5 seconds.
- Sequence delay between lines: 0.2 seconds.
- Total map reveal duration: ~15 seconds.
- Hold duration at end: 4 seconds.
- Fade out / Reset duration: 1.5 seconds.

## Verification Plan

### Manual Verification
- Open `metro-map.html` in browser.
- Verify lines start outside viewport bounds and end outside viewport bounds.
- Verify stations are not visible initially, and pop/fade in smoothly exactly when the leading edge of the line reaches them.
- Verify stations use the exact same color as their line.
- Verify no glow filters, shadow filters, or text labels are present.
- Verify loop completes, holds for 4 seconds, fades out, resets, and loops continuously.
