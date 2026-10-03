import React from 'react';

export interface NeomorphicBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'inset' | 'raised' | 'accent';
  led?: boolean;
  ledColor?: string;
}

/**
 * NeomorphicBadge - Tactile status badge with debossed socket and luminous LED point.
 * Follows shadcn/ui Badge composition pattern.
 */
export const NeomorphicBadge = React.forwardRef<HTMLDivElement, NeomorphicBadgeProps>(({
  children,
  variant = 'inset',
  led = false,
  ledColor = '#38bdf8',
  className = '',
  ...props
}, ref) => {
  const variantStyles = {
    inset: 'bg-[#14161e] border border-white/[0.04] text-slate-300 shadow-[inset_2px_2px_5px_#0f1118,inset_-2px_-2px_5px_#222634]',
    raised: 'bg-[#1e222e] border border-white/[0.05] text-slate-200 shadow-[3px_3px_8px_#101219,-3px_-3px_8px_#262c3b]',
    accent: 'bg-[#14161e] border border-[#38bdf8]/30 text-[#38bdf8] shadow-[inset_2px_2px_5px_#0f1118,inset_-2px_-2px_5px_#222634]',
  };

  return (
    <div
      ref={ref}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {led && (
        <span 
          className="w-2 h-2 rounded-full shrink-0 border border-white/40"
          style={{
            backgroundColor: ledColor,
          }}
        />
      )}
      {children}
    </div>
  );
});

NeomorphicBadge.displayName = 'NeomorphicBadge';
