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
  // Delicate, refined diamond pinprick stars
  const stars = useMemo<Star[]>(() => {
    const starColors = ['#ffffff', '#f8fafc', '#e2e8f0', '#fef08a', '#e9d5ff'];
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      x: Math.round(Math.random() * 96 + 2),
      y: Math.round(Math.random() * 96 + 2),
      size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 1.8 : 2.4,
      opacity: Math.random() * 0.5 + 0.25,
      duration: Math.random() * 3 + 2.5,
      delay: Math.random() * 5,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
  }, []);

  // Rare, elegant celestial comets
  const shootingStars = useMemo<ShootingStar[]>(() => [
    { id: 1, top: 15, left: 20, delay: 1.5, duration: 6.5 },
    { id: 2, top: 55, left: 60, delay: 5.2, duration: 7.5 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none isolate" style={{ contain: 'strict' }}>
      {/* 1. Deep Obsidian Void Base */}
      <div 
        className="absolute inset-0 bg-[#010006]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 10%, rgba(67, 24, 118, 0.16) 0%, transparent 60%),
            radial-gradient(ellipse at 85% 85%, rgba(30, 27, 75, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse at 10% 70%, rgba(15, 23, 42, 0.25) 0%, transparent 50%)
          `
        }}
      />

      {/* 2. Mysterious Ambient Celestial Smoke (Low Opacity, Minimalist) */}
      <div 
        className="absolute -top-32 left-1/4 w-[550px] h-[550px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <div 
        className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[130px] opacity-12 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* 3. Subtle Astrolabe Center Halo */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-purple-500/5 opacity-20 animate-galaxy-spin pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168, 85, 247, 0.08) 120deg, transparent 240deg, rgba(216, 180, 254, 0.06) 360deg)',
          animationDuration: '60s',
          willChange: 'transform',
        }}
      />

      {/* 4. Fine Diamond Starlight Field */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: star.size > 1.5 ? `0 0 5px ${star.color}` : 'none',
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
            willChange: 'transform, opacity',
            contain: 'strict',
          } as React.CSSProperties}
        />
      ))}

      {/* 5. Minimalist Diamond Comets */}
      {shootingStars.map((ss) => (
        <div
          key={ss.id}
          className="absolute h-[1px] rounded-full opacity-0 animate-shooting-star"
          style={{
            top: `${ss.top}%`,
            left: `${ss.left}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(216,180,254,0.4), transparent)',
            boxShadow: '0 0 4px #ffffff',
            animationDelay: `${ss.delay}s`,
            animationDuration: `${ss.duration}s`,
          }}
        />
      ))}
    </div>
  );
});
