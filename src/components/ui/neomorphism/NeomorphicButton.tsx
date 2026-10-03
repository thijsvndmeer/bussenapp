import React from 'react';

export interface NeomorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inset' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  led?: boolean;
  ledColor?: string;
  active?: boolean;
}

/**
 * NeomorphicButton - Physical tactile key with dual-shadow convex volume
 * and 150ms spring depression to debossed socket on press.
 * Adapted from shadcn/ui button architecture.
 */
export const NeomorphicButton = React.forwardRef<HTMLButtonElement, NeomorphicButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  led = false,
  ledColor = '#38bdf8',
  active = false,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-2xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5 font-bold',
    icon: 'w-10 h-10 p-0 rounded-2xl flex items-center justify-center',
  };

  const getVariantStyles = () => {
    if (disabled) {
      return 'opacity-40 cursor-not-allowed bg-[#171a23] text-slate-500 shadow-none border border-white/[0.02]';
    }

    if (active || variant === 'inset') {
      return 'bg-[#14161e] text-[#38bdf8] border border-white/[0.03] shadow-[inset_3px_3px_7px_#0f1118,inset_-3px_-3px_7px_#222634]';
    }

    switch (variant) {
      case 'accent':
        return 'bg-gradient-to-br from-[#1e2738] to-[#161c28] text-[#38bdf8] border border-[#38bdf8]/30 shadow-[6px_6px_14px_#101219,-6px_-6px_14px_#262c3b] hover:border-[#38bdf8]/60 hover:shadow-[7px_7px_14px_#0e1016,-7px_-7px_14px_#2b3243] active:scale-[0.975] active:shadow-[inset_3px_3px_7px_#0f1118,inset_-3px_-3px_7px_#222634]';
      case 'danger':
        return 'bg-gradient-to-br from-[#2a1a1f] to-[#1c1417] text-[#fb7185] border border-[#fb7185]/30 shadow-[6px_6px_14px_#101219,-6px_-6px_14px_#262c3b] hover:border-[#fb7185]/60 hover:shadow-[7px_7px_14px_#0e1016,-7px_-7px_14px_#2b3243] active:scale-[0.975] active:shadow-[inset_3px_3px_7px_#0f1118,inset_-3px_-3px_7px_#222634]';
      case 'secondary':
        return 'bg-[#151821] text-slate-300 border border-white/[0.04] shadow-[inset_2px_2px_5px_#0f1118,inset_-2px_-2px_5px_#242937] hover:text-white hover:border-white/[0.08] active:scale-[0.98]';
      case 'primary':
      default:
        return 'bg-gradient-to-br from-[#222736] to-[#1a1e28] text-slate-100 border border-white/[0.06] shadow-[6px_6px_14px_#101219,-6px_-6px_14px_#262c3b] hover:border-white/[0.12] hover:shadow-[7px_7px_14px_#0e1016,-7px_-7px_14px_#2a3141] active:scale-[0.975] active:shadow-[inset_3px_3px_7px_#0f1118,inset_-3px_-3px_7px_#222634]';
    }
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]/50 ${sizeClasses[size]} ${getVariantStyles()} ${className}`}
      {...props}
    >
      {led && (
        <span 
          className="w-2 h-2 rounded-full shrink-0 transition-all duration-300 border border-white/30"
          style={{
            backgroundColor: active ? ledColor : '#475569',
          }}
        />
      )}
      {children}
    </button>
  );
});

NeomorphicButton.displayName = 'NeomorphicButton';
