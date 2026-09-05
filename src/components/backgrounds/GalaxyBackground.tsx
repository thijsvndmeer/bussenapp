import React, { useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

interface DiamondStar {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
  name: string;
}

interface ShootingStar {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

export const GalaxyBackground: React.FC = React.memo(() => {
  // 1. Micro cosmic dust (dense stardust field providing vast astronomical depth)
  const microStars = useMemo<Star[]>(() => {
    // 88 deterministic-seeded pinpricks across sky with natural clustering
    const coords: [number, number][] = [
      [3, 8], [7, 24], [11, 48], [14, 82], [18, 93], [22, 12], [25, 67], [29, 34],
      [32, 78], [35, 19], [38, 55], [42, 91], [45, 6], [48, 62], [51, 28], [54, 84],
      [57, 15], [61, 47], [64, 73], [67, 31], [71, 95], [74, 18], [77, 61], [81, 88],
      [84, 11], [87, 43], [91, 79], [94, 25], [97, 64], [5, 41], [9, 72], [13, 16],
      [16, 58], [21, 38], [27, 86], [31, 14], [36, 49], [40, 81], [44, 33], [47, 71],
      [52, 97], [56, 39], [59, 82], [63, 17], [66, 60], [69, 93], [73, 35], [76, 75],
      [79, 13], [83, 52], [86, 89], [89, 29], [93, 67], [96, 45], [2, 85], [17, 3],
      [34, 4], [62, 5], [78, 4], [23, 98], [49, 96], [85, 98], [15, 45], [72, 53],
      // Milky Way dense spine cluster
      [20, 28], [24, 32], [28, 36], [32, 40], [36, 44], [40, 48], [44, 52], [48, 56],
      [52, 60], [56, 64], [60, 68], [64, 72], [68, 76], [72, 80], [76, 84], [80, 88],
      [26, 38], [34, 46], [42, 54], [50, 62], [58, 70], [66, 78], [12, 65], [88, 35]
    ];

    return coords.map(([x, y], i) => ({
      id: i,
      x,
      y,
      size: (i % 4 === 0 ? 0.65 : i % 4 === 1 ? 0.8 : i % 4 === 2 ? 0.9 : 1.0),
      opacity: 0.16 + (i % 6) * 0.07,
      duration: 4.2 + (i % 5) * 0.8,
      delay: (i % 8) * 0.7,
      color: i % 5 === 0 ? '#ffffff' : i % 5 === 1 ? '#f8fafc' : i % 5 === 2 ? '#e2e8f0' : i % 5 === 3 ? '#e9d5ff' : '#fef9c3',
    }));
  }, []);

  // 2. Mid-field living twinkling celestial stars
  const midStars = useMemo<Star[]>(() => {
    const coords: [number, number, string, number][] = [
      [6, 18, '#ffffff', 1.4],
      [15, 32, '#fef08a', 1.5],
      [28, 8, '#e9d5ff', 1.3],
      [33, 42, '#f8fafc', 1.4],
      [46, 21, '#ffffff', 1.5],
      [58, 11, '#c084fc', 1.3],
      [69, 27, '#fef9c3', 1.4],
      [82, 14, '#ffffff', 1.6],
      [93, 33, '#e9d5ff', 1.3],
      [8, 62, '#ffffff', 1.4],
      [19, 84, '#d8b4fe', 1.5],
      [26, 71, '#fef08a', 1.3],
      [37, 88, '#ffffff', 1.4],
      [53, 76, '#e9d5ff', 1.5],
      [65, 85, '#ffffff', 1.4],
      [78, 68, '#c084fc', 1.5],
      [88, 82, '#fef08a', 1.3],
      [94, 61, '#ffffff', 1.5],
      [12, 94, '#f8fafc', 1.4],
      [48, 92, '#ffffff', 1.3],
      [75, 45, '#e9d5ff', 1.4],
      [24, 52, '#ffffff', 1.3],
      [85, 38, '#fef9c3', 1.5],
      [4, 46, '#c084fc', 1.4],
      [91, 19, '#ffffff', 1.4],
      [62, 94, '#d8b4fe', 1.3],
      [31, 63, '#ffffff', 1.4],
      [70, 16, '#fef08a', 1.3]
    ];

    return coords.map(([x, y, color, size], i) => ({
      id: i,
      x,
      y,
      size,
      opacity: 0.45 + (i % 3) * 0.18,
      duration: 3.5 + (i % 5) * 0.7,
      delay: (i % 6) * 0.9,
      color,
    }));
  }, []);

  // 3. Crisp diamond navigational beacons with delicate 4-point optical diffraction glints
  // Strategically anchored in the outer thirds and margins to frame gameplay elegantly
  const diamondStars = useMemo<DiamondStar[]>(() => [
    { id: 101, x: 12, y: 14, size: 2.2, opacity: 0.95, duration: 4.8, delay: 0.4, color: '#ffffff', name: 'Polaris' },
    { id: 102, x: 86, y: 16, size: 2.2, opacity: 0.9, duration: 5.4, delay: 1.6, color: '#e9d5ff', name: 'Vega' },
    { id: 103, x: 92, y: 66, size: 2.4, opacity: 0.95, duration: 4.6, delay: 2.2, color: '#ffffff', name: 'Sirius' },
    { id: 104, x: 8, y: 78, size: 2.0, opacity: 0.85, duration: 4.2, delay: 3.0, color: '#fef08a', name: 'Arcturus' },
    { id: 105, x: 22, y: 40, size: 1.9, opacity: 0.85, duration: 5.0, delay: 1.1, color: '#d8b4fe', name: 'Spica' },
    { id: 106, x: 84, y: 42, size: 1.9, opacity: 0.88, duration: 4.9, delay: 2.7, color: '#fef9c3', name: 'Altair' },
    { id: 107, x: 38, y: 9, size: 1.8, opacity: 0.8, duration: 5.8, delay: 0.8, color: '#ffffff', name: 'Deneb' },
    { id: 108, x: 68, y: 89, size: 2.0, opacity: 0.88, duration: 4.4, delay: 3.5, color: '#c084fc', name: 'Rigel' },
  ], []);

  // 4. Rare, needle-thin luxury celestial comets sweeping at cosmic intervals
  const shootingStars = useMemo<ShootingStar[]>(() => [
    { id: 1, top: 8, left: 16, delay: 4.0, duration: 8.5 },
    { id: 2, top: 26, left: 58, delay: 12.0, duration: 10.0 },
    { id: 3, top: 56, left: 18, delay: 20.0, duration: 11.0 },
    { id: 4, top: 72, left: 48, delay: 28.5, duration: 12.5 },
  ], []);

  // 5. Constellation star junction coordinates (rendered as perfect round CSS circles, aspect-ratio safe)
  const constellationNodes = useMemo<[number, number][]>(() => [
    // Cassiopeia
    [6, 16], [12, 11], [20, 16], [30, 10], [38, 18],
    // Cygnus
    [86, 14], [80, 26], [74, 38], [68, 22], [92, 28],
    // Ursa Major
    [4, 46], [8, 58], [15, 66], [22, 64], [30, 60], [34, 80], [25, 82],
    // Orion
    [70, 60], [84, 58], [75, 70], [77, 71], [79, 72], [69, 84], [83, 86]
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none isolate" style={{ contain: 'strict' }}>
      {/* 1. Deep Obsidian Base (True OLED Black Void) */}
      <div 
        className="absolute inset-0 bg-[#010005]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(22, 8, 44, 0.20) 0%, transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(12, 8, 28, 0.22) 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, rgba(10, 6, 24, 0.18) 0%, transparent 50%)
          `
        }}
      />

      {/* 2. Whispering Cosmic Dust (Subtle Ethereal Corner Vignettes - Never Washing Out Void) */}
      <div 
        className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full blur-[140px] opacity-14 animate-nebula-1 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.30) 0%, rgba(76, 29, 149, 0.08) 50%, transparent 75%)',
        }}
      />
      <div 
        className="absolute -bottom-40 -right-20 w-[650px] h-[650px] rounded-full blur-[150px] opacity-12 animate-nebula-2 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.24) 0%, rgba(30, 27, 75, 0.06) 50%, transparent 75%)',
        }}
      />
      <div 
        className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-10 animate-nebula-3 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(192, 132, 252, 0.18) 0%, transparent 65%)',
        }}
      />

      {/* 3. Milky Way Core Stardust Stream (Diagonal Celestial River) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(135deg, transparent 20%, rgba(147, 51, 234, 0.08) 42%, rgba(216, 180, 254, 0.12) 50%, rgba(99, 102, 241, 0.06) 58%, transparent 80%)',
        }}
      />

      {/* 4. Astrolabe Celestial Projection (Ultra-Subtle Horology Watermark) */}
      <div 
        className="astrolabe absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[720px] sm:h-[720px] pointer-events-none opacity-14"
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
          willChange: 'transform',
        }}
      >
        <svg 
          viewBox="0 0 500 500" 
          className="w-full h-full animate-galaxy-spin" 
          style={{ animationDuration: '220s' }}
        >
          {/* Outer Celestial Meridian Circle */}
          <circle cx="250" cy="250" r="230" fill="none" stroke="rgba(216, 180, 254, 0.28)" strokeWidth="0.75" />
          {/* Secondary Dashed Celestial Meridian */}
          <circle cx="250" cy="250" r="218" fill="none" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="0.5" strokeDasharray="3 6" />
          {/* 24 Hour Degree Ticks */}
          {Array.from({ length: 24 }).map((_, idx) => {
            const angle = (idx * 15) * (Math.PI / 180);
            const r1 = idx % 6 === 0 ? 208 : 213;
            const r2 = 230;
            const x1 = 250 + r1 * Math.cos(angle);
            const y1 = 250 + r1 * Math.sin(angle);
            const x2 = 250 + r2 * Math.cos(angle);
            const y2 = 250 + r2 * Math.sin(angle);
            return (
              <line 
                key={`astrolabe-tick-${idx}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={idx % 6 === 0 ? "rgba(233, 213, 255, 0.45)" : "rgba(192, 132, 252, 0.22)"}
                strokeWidth={idx % 6 === 0 ? "1" : "0.5"}
              />
            );
          })}
          {/* Tilted Ecliptic Orbit (Planetary Path) */}
          <ellipse cx="250" cy="250" rx="185" ry="120" fill="none" stroke="rgba(216, 180, 254, 0.22)" strokeWidth="0.75" transform="rotate(-23.4 250 250)" />
          {/* Concentric Declination Orbit Rings */}
          <circle cx="250" cy="250" r="145" fill="none" stroke="rgba(192, 132, 252, 0.16)" strokeWidth="0.5" />
          <circle cx="250" cy="250" r="85" fill="none" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="0.5" strokeDasharray="2 5" />
          {/* Polar Crosshairs */}
          <line x1="250" y1="20" x2="250" y2="480" stroke="rgba(192, 132, 252, 0.14)" strokeWidth="0.5" strokeDasharray="3 7" />
          <line x1="20" y1="250" x2="480" y2="250" stroke="rgba(192, 132, 252, 0.14)" strokeWidth="0.5" strokeDasharray="3 7" />
          {/* Polar Pivot Star */}
          <circle cx="250" cy="250" r="2.5" fill="rgba(233, 213, 255, 0.75)" />
        </svg>
      </div>

      {/* 5. Galactic Constellation Lines (Pure Astronomical Tracings - Zero Text) */}
      <div className="absolute inset-0 pointer-events-none animate-constellation">
        <svg 
          className="w-full h-full"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="constellation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(233, 213, 255, 0.45)" />
              <stop offset="50%" stopColor="rgba(192, 132, 252, 0.28)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.18)" />
            </linearGradient>
          </defs>

          {/* Cassiopeia */}
          <polyline
            points="6,16 12,11 20,16 30,10 38,18"
            fill="none"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Cygnus (The Northern Cross) */}
          <line
            x1="86" y1="14" x2="74" y2="38"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="68" y1="22" x2="92" y2="28"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Ursa Major (The Big Dipper) */}
          <polyline
            points="4,46 8,58 15,66 22,64"
            fill="none"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points="22,64 30,60 34,80 25,82"
            fill="none"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pointer line from Ursa Major toward Polaris (12, 14) */}
          <line
            x1="30" y1="60" x2="16" y2="24"
            stroke="rgba(192, 132, 252, 0.2)"
            strokeWidth="0.5"
            strokeDasharray="0.8 1.6"
            vectorEffect="non-scaling-stroke"
          />

          {/* Orion (The Hunter) */}
          <polyline
            points="70,60 84,58 79,72 83,86 69,84 75,70 70,60"
            fill="none"
            stroke="url(#constellation-grad)"
            strokeWidth="0.75"
            strokeDasharray="1.2 0.8"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points="75,70 77,71 79,72"
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pointer line from belt toward Sirius (92, 66) */}
          <line
            x1="79" y1="72" x2="89" y2="67"
            stroke="rgba(192, 132, 252, 0.2)"
            strokeWidth="0.5"
            strokeDasharray="0.8 1.6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Constellation Junction Stars (Crisp, Non-distorted HTML Elements) */}
        {constellationNodes.map(([cx, cy], i) => (
          <div
            key={`constell-star-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
              width: '2.5px',
              height: '2.5px',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(192, 132, 252, 0.6)',
            }}
          />
        ))}
      </div>

      {/* 6. Tier 1: Micro Stardust (Dense Deep-Space Pinpricks) */}
      {microStars.map((star) => (
        <div
          key={`micro-${star.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.opacity,
            contain: 'strict',
          }}
        />
      ))}

      {/* 6. Tier 2: Mid Living Twinkling Stars */}
      {midStars.map((star) => (
        <div
          key={`mid-${star.id}`}
          className="absolute rounded-full animate-star-twinkle pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: `0 0 4px ${star.color}`,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
            willChange: 'transform, opacity',
            contain: 'strict',
          } as React.CSSProperties}
        />
      ))}

      {/* 7. Tier 3: Luxury Diamond Core Stars with Optical Diffraction Glints */}
      {diamondStars.map((star) => (
        <div
          key={`diamond-${star.id}`}
          className="absolute animate-star-twinkle pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
            willChange: 'transform, opacity',
            contain: 'strict',
          } as React.CSSProperties}
        >
          {/* Glowing central core */}
          <div 
            className="rounded-full"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 5px #ffffff, 0 0 12px rgba(192, 132, 252, 0.55), 0 0 22px rgba(168, 85, 247, 0.25)`,
            }}
          />
          {/* Precision 4-point optical diffraction spike glint */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[0.75px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[14px] w-[0.75px] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            }}
          />
        </div>
      ))}

      {/* 8. Tier 4: Needle-Thin Luxury Celestial Comets */}
      {shootingStars.map((ss) => (
        <div
          key={`ss-${ss.id}`}
          className="absolute h-[1px] rounded-full opacity-0 animate-shooting-star pointer-events-none"
          style={{
            top: `${ss.top}%`,
            left: `${ss.left}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.4) 60%, rgba(255, 255, 255, 1) 100%)',
            boxShadow: '0 0 4px #ffffff, 0 0 8px rgba(192, 132, 252, 0.7)',
            animationDelay: `${ss.delay}s`,
            animationDuration: `${ss.duration}s`,
          }}
        />
      ))}
    </div>
  );
});


