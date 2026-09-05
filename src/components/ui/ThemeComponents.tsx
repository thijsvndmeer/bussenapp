import React from 'react';
import { UITheme } from '../../../types';

export const ThemeLabel: React.FC<{ 
  text: string; 
  theme: UITheme; 
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'fancy';
  align?: 'left' | 'center' | 'right';
}> = React.memo(({ text, theme, size = 'sm', variant = 'fancy', align = 'left' }) => {
  const isLg = size === 'lg';
  const isSm = size === 'sm';
  const isSimple = variant === 'simple';
  
  const textSizeClass = isLg ? 'text-2xl sm:text-3xl' : isSm ? 'text-[10px]' : 'text-sm';

  if (theme === UITheme.METRO) {
    return (
      <div className={`relative flex flex-col ${align === 'center' ? 'items-center' : 'items-start'} ${isLg ? 'gap-3' : 'gap-1.5'}`}>
        <div 
          className={`relative z-10 font-mono font-black uppercase tracking-[0.2em] ${textSizeClass}`} 
          style={{ color: 'var(--theme-accent)' }}
        >
          <span className="opacity-40 mr-1.5">{isLg ? '>>' : '>'}</span>
          {text}
          {isLg && <span className="inline-block ml-4 w-3 h-6 bg-[var(--theme-accent)] animate-pulse" />}
        </div>
        {!isSimple && (
          <div className="flex w-full items-center gap-1">
            <div className={`h-px bg-[var(--theme-accent)] opacity-40 ${isLg ? 'w-24' : 'w-8'}`} />
            <div className="w-1 h-1 bg-[var(--theme-accent)] rounded-full opacity-60" />
            <div className="flex-1 h-px bg-[var(--theme-accent)] opacity-10" />
          </div>
        )}
      </div>
    );
  }

  if (theme === UITheme.CALM) {
    return (
      <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
        <div 
          className={`${textSizeClass} font-light italic uppercase`}
          style={{ 
            color: 'var(--theme-accent)',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          {text}
        </div>
      </div>
    );
  }

  if (theme === UITheme.BEER) {
    if (isSimple) {
      return (
        <div 
          className={`${textSizeClass} font-black uppercase tracking-[0.15em] ${align === 'center' ? 'text-center' : 'text-left'}`}
          style={{ color: 'var(--theme-accent)' }}
        >
          {text}
        </div>
      );
    }
    return (
      <div className={`relative inline-flex flex-col ${align === 'center' ? 'items-center' : 'items-start'}`}>
        <div 
          className={`px-4 sm:px-6 py-1 bg-[var(--theme-accent)] ${textSizeClass} font-black uppercase tracking-[0.15em] shadow-[4px_4px_0_rgba(0,0,0,0.3)]`}
          style={{ color: '#fff', transform: 'rotate(-1deg)' }}
        >
          {text}
        </div>
      </div>
    );
  }

  if (theme === UITheme.STARS) {
    return (
      <div className={`relative flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} ${isLg ? 'py-3' : 'py-1'}`}>
        <div 
          className={`${textSizeClass} font-black uppercase tracking-[0.25em] flex items-center gap-1.5`}
          style={{ 
            color: '#f3e8ff',
            textShadow: '0 0 10px rgba(192, 132, 252, 0.8), 0 0 20px rgba(56, 189, 248, 0.4)'
          }}
        >
          <span>{text}</span>
        </div>
        {!isSimple && (
          <div className="flex w-full items-center gap-1 mt-1 opacity-60">
            <div className={`h-px bg-gradient-to-r from-purple-400 via-cyan-400 to-transparent ${isLg ? 'w-32' : 'w-16'}`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative z-[60] ${isLg ? 'py-4' : 'py-2'} ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <div 
        className={`${textSizeClass} font-black uppercase tracking-[0.3em]`}
        style={{ 
          color: 'var(--theme-accent)',
          textShadow: '0 0 12px var(--theme-accent-glow), 0 0 20px rgba(251,113,133,0.3)'
        }}
      >
        {text}
      </div>
    </div>
  );
});

export const ThemeHeader: React.FC<{ 
  text: string; 
  theme: UITheme; 
  className?: string; 
  as?: 'h1' | 'h2' | 'p' 
}> = React.memo(({ text, theme, className = "", as: Component = 'h2' }) => {
  if (theme === UITheme.STARS) {
    return (
      <Component 
        className={`font-black tracking-wider uppercase bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(192,132,252,0.6)] ${className}`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {text}
      </Component>
    );
  }
  if (theme === UITheme.METRO) {
    return (
      <Component 
        className={`font-mono font-black uppercase tracking-tighter border-l-4 border-[var(--theme-accent)] pl-4 ${className}`}
        style={{ color: 'var(--theme-text)' }}
      >
        {text}
      </Component>
    );
  }
  if (theme === UITheme.CALM) {
    return (
      <Component 
        className={`font-light italic tracking-[0.15em] uppercase ${className}`}
        style={{ color: 'var(--theme-text)', fontFamily: "'Outfit', sans-serif" }}
      >
        {text}
      </Component>
    );
  }
  if (theme === UITheme.BEER) {
    return (
      <Component 
        className={`font-black uppercase tracking-tight ${className}`}
        style={{ color: 'var(--theme-text)', textShadow: '3px 3px 0 var(--theme-accent)' }}
      >
        {text}
      </Component>
    );
  }
  return (
    <Component 
      className={`font-black text-white drop-shadow-2xl neon-text ${className}`}
    >
      {text}
    </Component>
  );
});
