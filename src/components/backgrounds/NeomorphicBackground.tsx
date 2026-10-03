import React from 'react';

/**
 * NeomorphicBackground - Clean, solid matte clay canvas with zero haze.
 * Features sharp debossed concentric rings and an extruded clay plate.
 */
export const NeomorphicBackground: React.FC<{
  isLight?: boolean;
  accentColor?: string;
}> = React.memo(({ isLight = false, accentColor = '#38bdf8' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none isolate">
      {/* 1. Solid Matte Clay Canvas */}
      <div 
        className="absolute inset-0 transition-colors duration-500" 
        style={{ backgroundColor: isLight ? '#edf1f7' : '#171a23' }}
      />

      {/* 2. Architectural Debossed Concentric Reliefs (Zero haze, pure dual shadows) */}
      <div 
        className="absolute top-[12%] right-[5%] w-64 h-64 rounded-full border opacity-50 transition-all duration-500"
        style={{
          borderColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.04)',
          boxShadow: isLight
            ? 'inset 5px 5px 10px #caced6, inset -5px -5px 10px #ffffff'
            : 'inset 5px 5px 10px #0f1118, inset -5px -5px 10px #222634',
        }}
      />
      <div 
        className="absolute top-[16%] right-[8%] w-48 h-48 rounded-full border opacity-40 transition-all duration-500"
        style={{
          borderColor: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.03)',
          boxShadow: isLight
            ? 'inset 3px 3px 7px #caced6, inset -3px -3px 7px #ffffff'
            : 'inset 3px 3px 7px #0f1118, inset -3px -3px 7px #222634',
        }}
      />
      {/* Dynamic Accent Energy Relief */}
      <div 
        className="absolute top-[20%] right-[11%] w-32 h-32 rounded-full border opacity-40 transition-all duration-500"
        style={{
          borderColor: accentColor,
          boxShadow: isLight
            ? `inset 2px 2px 5px #caced6, inset -2px -2px 5px #ffffff, 0 0 10px ${accentColor}26`
            : `inset 2px 2px 5px #0f1118, inset -2px -2px 5px #222634, 0 0 10px ${accentColor}26`,
        }}
      />

      {/* 3. Floating Convex Clay Plate (Bottom Left) */}
      <div 
        className="absolute bottom-[10%] -left-12 w-56 h-56 rounded-3xl border opacity-40 transform -rotate-12 transition-all duration-500"
        style={{
          background: isLight 
            ? 'linear-gradient(145deg, #f5f8fc, #e2e8f2)' 
            : 'linear-gradient(145deg, #1e222e, #171a23)',
          borderColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.04)',
          boxShadow: isLight
            ? '6px 6px 14px #caced6, -6px -6px 14px #ffffff'
            : '6px 6px 14px #0f1118, -6px -6px 14px #242938',
        }}
      />
    </div>
  );
});
