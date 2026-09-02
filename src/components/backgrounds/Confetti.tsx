import React, { useState, useEffect } from 'react';

export const Confetti: React.FC = React.memo(() => {
  const [particles, setParticles] = useState<{ id: number, left: string, color: string, delay: string, duration: string }[]>([]);

  useEffect(() => {
    const colors = ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#ec4899'];
    const newParticles = Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm shadow-lg"
          style={{
            top: `${-10 - Math.random() * 10}%`,
            left: p.left,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} linear forwards`,
            animationDelay: p.delay
          }}
        />
      ))}
    </div>
  );
});
