import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { UITheme } from '../../../types';

export interface ScrollIndicatorContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  theme?: UITheme;
  scrollClassName?: string;
  gradientFrom?: string;
  fadeSize?: number;
  arrowSize?: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScrollCallback?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const getThemeScrollColors = (theme: UITheme = UITheme.CLASSIC) => {
  switch (theme) {
    case UITheme.METRO:
      return {
        accent: 'var(--theme-accent, #fb7185)',
        gradientFrom: 'rgba(13, 13, 13, 0.95)',
        glow: 'rgba(251, 113, 133, 0.35)',
      };
    case UITheme.CALM:
      return {
        accent: 'var(--theme-accent, #fb7185)',
        gradientFrom: 'rgba(15, 23, 42, 0.95)',
        glow: 'var(--theme-accent-glow, rgba(251, 113, 133, 0.35))',
      };
    case UITheme.BEER:
      return {
        accent: 'var(--theme-accent, #ff3333)',
        gradientFrom: 'rgba(2, 32, 12, 0.95)',
        glow: 'var(--theme-accent-glow, rgba(255, 51, 51, 0.4))',
      };
    case UITheme.STARS:
      return {
        accent: '#e2e8f0',
        gradientFrom: 'rgba(1, 0, 5, 0.95)',
        glow: 'rgba(226, 232, 240, 0.25)',
      };
    case UITheme.CLASSIC:
    default:
      return {
        accent: 'var(--theme-accent, #ef4444)',
        gradientFrom: 'rgba(15, 23, 42, 0.95)',
        glow: 'rgba(239, 68, 68, 0.35)',
      };
  }
};

export const ScrollIndicatorContainer: React.FC<ScrollIndicatorContainerProps> = ({
  children,
  orientation = 'vertical',
  theme = UITheme.CLASSIC,
  className = '',
  scrollClassName = '',
  gradientFrom,
  fadeSize = 16,
  arrowSize = 13,
  scrollRef,
  onScrollCallback,
  style,
  ...rest
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const activeRef = scrollRef || localRef;

  const [canStart, setCanStart] = useState(false);
  const [canEnd, setCanEnd] = useState(false);

  const checkScroll = useCallback(() => {
    const el = activeRef.current;
    if (!el) return;

    if (orientation === 'horizontal') {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      const start = hasOverflow && el.scrollLeft > 4;
      const end = hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanStart(prev => prev !== start ? start : prev);
      setCanEnd(prev => prev !== end ? end : prev);
    } else {
      const hasOverflow = el.scrollHeight > el.clientHeight + 2;
      const start = hasOverflow && el.scrollTop > 4;
      const end = hasOverflow && el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setCanStart(prev => prev !== start ? start : prev);
      setCanEnd(prev => prev !== end ? end : prev);
    }
  }, [activeRef, orientation]);

  useEffect(() => {
    checkScroll();
    const el = activeRef.current;
    if (!el) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        checkScroll();
      });
      observer.observe(el);
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) observer?.observe(child);
      });
    }

    const onResize = () => checkScroll();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [checkScroll, activeRef, children]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScroll();
    if (onScrollCallback) onScrollCallback(e);
  };

  const themeColors = getThemeScrollColors(theme);
  const effectiveGradientFrom = gradientFrom || themeColors.gradientFrom;

  const maskImage = orientation === 'horizontal'
    ? canStart && canEnd
      ? `linear-gradient(to right, transparent 0px, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent 100%)`
      : canEnd
      ? `linear-gradient(to right, black calc(100% - ${fadeSize}px), transparent 100%)`
      : canStart
      ? `linear-gradient(to right, transparent 0px, black ${fadeSize}px)`
      : undefined
    : canStart && canEnd
    ? `linear-gradient(to bottom, transparent 0px, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent 100%)`
    : canEnd
    ? `linear-gradient(to bottom, black calc(100% - ${fadeSize}px), transparent 100%)`
    : canStart
    ? `linear-gradient(to bottom, transparent 0px, black ${fadeSize}px)`
    : undefined;

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`} style={style} {...rest}>
      {/* Start Indicator (Left or Top) */}
      {canStart && (
        orientation === 'horizontal' ? (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 flex items-center pl-0.5 pr-2.5 transition-opacity duration-200"
            style={{ background: `linear-gradient(to right, ${effectiveGradientFrom}, transparent)` }}
          >
            <ChevronLeft
              size={arrowSize}
              style={{
                color: themeColors.accent,
                filter: `drop-shadow(0 0 4px ${themeColors.glow})`,
              }}
            />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex justify-center pt-0.5 pb-2.5 transition-opacity duration-200"
            style={{ background: `linear-gradient(to bottom, ${effectiveGradientFrom}, transparent)` }}
          >
            <ChevronUp
              size={arrowSize}
              style={{
                color: themeColors.accent,
                filter: `drop-shadow(0 0 4px ${themeColors.glow})`,
              }}
            />
          </div>
        )
      )}

      {/* Scrollable Container */}
      <div
        ref={activeRef}
        onScroll={handleScroll}
        className={`${orientation === 'horizontal' ? 'overflow-x-auto no-scrollbar' : 'overflow-y-auto custom-scrollbar'} ${scrollClassName}`}
        style={{
          WebkitMaskImage: maskImage,
          maskImage,
        }}
      >
        {children}
      </div>

      {/* End Indicator (Right or Bottom) */}
      {canEnd && (
        orientation === 'horizontal' ? (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 flex items-center pr-0.5 pl-2.5 transition-opacity duration-200"
            style={{ background: `linear-gradient(to left, ${effectiveGradientFrom}, transparent)` }}
          >
            <ChevronRight
              size={arrowSize}
              style={{
                color: themeColors.accent,
                filter: `drop-shadow(0 0 4px ${themeColors.glow})`,
              }}
            />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-0.5 pt-2.5 transition-opacity duration-200"
            style={{ background: `linear-gradient(to top, ${effectiveGradientFrom}, transparent)` }}
          >
            <ChevronDown
              size={arrowSize}
              style={{
                color: themeColors.accent,
                filter: `drop-shadow(0 0 4px ${themeColors.glow})`,
              }}
            />
          </div>
        )
      )}
    </div>
  );
};
