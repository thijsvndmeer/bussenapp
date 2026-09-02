import React, { useMemo } from 'react';

export const BeerBackground: React.FC = React.memo(() => {
  const bubbles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 5 + 3}px`,
    duration: `${Math.random() * 4 + 4}s`,
    delay: `${Math.random() * 5}s`
  })), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map(b => (
        <div 
          key={b.id} 
          className="bubble-elem" 
          style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
});
