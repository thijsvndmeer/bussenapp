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

interface ShootingStar {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

export const GalaxyBackground: React.FC = React.memo(() => {
  // 1. Micro cosmic dust (whisper-soft ambient pinpricks)
  const microStars = useMemo<Star[]>(() => {
    return Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      x: Math.round(Math.random() * 96 + 2),
      y: Math.round(Math.random() * 96 + 2),
      size: Math.random() < 0.8 ? 0.7 : 0.9,
      opacity: Math.random() * 0.35 + 0.15,
      duration: Math.random() * 4 + 3.5,
      delay: Math.random() * 6,
      color: '#e2e8f0',
    }));
  }, []);

  // 2. Mid-field twinkling celestial stars
  const midStars = useMemo<Star[]>(() => {
    const palette = ['#ffffff', '#f8fafc', '#f1f5f9', '#e9d5ff', '#c084fc'];
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      x: Math.round(Math.random() * 96 + 2),
      y: Math.round(Math.random() * 96 + 2),
      size: Math.random() < 0.7 ? 1.2 : 1.5,
      opacity: Math.random() * 0.45 + 0.3,
      duration: Math.random() * 3.5 + 2.5,
      delay: Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));
  }, []);

  // 3. Crisp diamond stars with optical starlight glint
  const diamondStars = useMemo<Star[]>(() => {
    return [
      { id: 101, x: 18, y: 22, size: 1.8, opacity: 0.85, duration: 4.2, delay: 0.5, color: '#fef08a' },
      { id: 102, x: 78, y: 16, size: 1.8, opacity: 0.8, duration: 5.0, delay: 1.8, color: '#e9d5ff' },
      { id: 103, x: 84, y: 74, size: 1.8, opacity: 0.9, duration: 4.6, delay: 2.3, color: '#ffffff' },
      { id: 104, x: 24, y: 82, size: 1.8, opacity: 0.75, duration: 3.8, delay: 3.1, color: '#d8b4fe' },
      { id: 105, x: 52, y: 48, size: 1.8, opacity: 0.85, duration: 4.8, delay: 1.2, color: '#fef9c3' },
    ];
  }, []);

  // Rare, elegant luxury celestial comets
  const shootingStars = useMemo<ShootingStar[]>(() => [
    { id: 1, top: 12, left: 18, delay: 2.5, duration: 7.0 },
    { id: 2, top: 62, left: 55, delay: 6.8, duration: 8.2 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none isolate" style={{ contain: 'strict' }}>
      {/* 1. Deep Obsidian Celestial Void */}
      <div 
        className="absolute inset-0 bg-[#010005]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 12%, rgba(59, 18, 108, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse at 88% 82%, rgba(22, 18, 62, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 12% 75%, rgba(10, 14, 35, 0.18) 0%, transparent 50%)
          `
        }}
      />

      {/* 2. Velvety, Low-Opacity Celestial Smoke (Luxury Restraint) */}
      <div 
        className="absolute -top-36 left-1/4 w-[520px] h-[520px] rounded-full blur-[140px] opacity-[0.08] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <div 
        className="absolute -bottom-48 right-1/4 w-[560px] h-[560px] rounded-full blur-[150px] opacity-[0.07] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* 3. Luxury Astrolabe Celestial Orbit Rings */}
      <div className="astrolabe absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] pointer-events-none">
        {/* Outer Orbit Ring */}
        <div 
          className="absolute inset-0 rounded-full border border-purple-500/10 opacity-30 animate-galaxy-spin"
          style={{ animationDuration: '90s', willChange: 'transform' }}
        />
        {/* Mid Astronomical Coordinate Ring */}
        <div 
          className="absolute inset-10 rounded-full border border-dashed border-white/5 opacity-25 animate-galaxy-spin"
          style={{ animationDuration: '140s', animationDirection: 'reverse', willChange: 'transform' }}
        />
        {/* Inner Starlight Halo */}
        <div 
          className="absolute inset-24 rounded-full border border-purple-400/10 opacity-20"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(192, 132, 252, 0.05) 90deg, transparent 180deg, rgba(216, 180, 254, 0.04) 270deg, transparent 360deg)',
          }}
        />
      </div>

      {/* 4. Tier 1: Micro Stardust */}
      {microStars.map((star) => (
        <div
          key={`micro-${star.id}`}
          className="absolute rounded-full"
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

      {/* 5. Tier 2: Mid Twinkling Field */}
      {midStars.map((star) => (
        <div
          key={`mid-${star.id}`}
          className="absolute rounded-full animate-star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: star.size > 1.3 ? `0 0 3px ${star.color}` : 'none',
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
            willChange: 'transform, opacity',
            contain: 'strict',
          } as React.CSSProperties}
        />
      ))}

      {/* 6. Tier 3: Luxury Diamond Core Stars with Starlight Glints */}
      {diamondStars.map((star) => (
        <div
          key={`diamond-${star.id}`}
          className="absolute animate-star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
            willChange: 'transform, opacity',
            contain: 'strict',
          } as React.CSSProperties}
        >
          {/* Core point */}
          <div 
            className="rounded-full"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 6px ${star.color}, 0 0 12px rgba(192, 132, 252, 0.4)`,
            }}
          />
          {/* Delicate cross glint */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-[0.5px] bg-white/40 pointer-events-none"
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-[0.5px] bg-white/40 pointer-events-none"
          />
        </div>
      ))}

      {/* 7. Needle-Thin Luxury Comets */}
      {shootingStars.map((ss) => (
        <div
          key={ss.id}
          className="absolute h-[1px] rounded-full opacity-0 animate-shooting-star"
          style={{
            top: `${ss.top}%`,
            left: `${ss.left}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(216,180,254,0.4), transparent)',
            boxShadow: '0 0 3px #ffffff',
            animationDelay: `${ss.delay}s`,
            animationDuration: `${ss.duration}s`,
          }}
        />
      ))}
    </div>
  );
});
