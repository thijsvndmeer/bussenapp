import React, { useState, useEffect, useMemo } from 'react';

export const CalmBackground: React.FC<{ accentColor?: string }> = React.memo(({ accentColor }) => {
  const { color1, color2 } = useMemo(() => {
    let hue1 = 43; // Default calm hue
    if (accentColor) {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = accentColor.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      if (result) {
        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
          const d = max - min;
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        hue1 = Math.round(h * 360);
      }
    }
    const hue2 = (hue1 + 180) % 360;
    return {
      color1: `radial-gradient(circle at center, hsla(${hue1}, 80%, 55%, 0.5), transparent 70%)`,
      color2: `radial-gradient(circle at center, hsla(${hue2}, 80%, 55%, 0.4), transparent 70%)`
    };
  }, [accentColor]);

  const isInBufferZone = (x: number, y: number) => {
    return x >= 20 && x <= 80 && y >= 15 && y <= 75;
  };

  const getURCoords = () => {
    let x = 0, y = 0;
    let count = 0;
    do {
      x = Math.random() * 45 + 55;
      y = Math.random() * 45;
      count++;
    } while (isInBufferZone(x, y) && count < 100);
    return { x, y };
  };

  const getBLCoords = () => {
    let x = 0, y = 0;
    let count = 0;
    do {
      x = Math.random() * 45;
      y = Math.random() * 45 + 55;
      count++;
    } while (isInBufferZone(x, y) && count < 100);
    return { x, y };
  };

  const [pos1, setPos1] = useState(() => getURCoords());
  const [pos2, setPos2] = useState(() => getBLCoords());

  useEffect(() => {
    const updatePositions = () => {
      setPos1(getURCoords());
      setPos2(getBLCoords());
    };

    const interval = setInterval(updatePositions, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[100px] transition-transform duration-[10000ms] ease-in-out opacity-60" 
        style={{ 
          backgroundImage: color1,
          left: 0,
          top: 0,
          transform: `translate3d(calc(${pos1.x}vw - 400px), calc(${pos1.y}vh - 400px), 0)`,
        }} 
      />
      <div 
        className="absolute w-[900px] h-[900px] rounded-full blur-[120px] transition-transform duration-[10000ms] ease-in-out opacity-50" 
        style={{ 
          backgroundImage: color2,
          left: 0,
          top: 0,
          transform: `translate3d(calc(${pos2.x}vw - 450px), calc(${pos2.y}vh - 450px), 0)`,
        }} 
      />
    </div>
  );
});
