import React from 'react';

/**
 * NeomorphicCard - Tactile extruded clay card container with dual soft shadows.
 * Follows shadcn/ui Card anatomy and composition pattern.
 */
export const NeomorphicCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'raised' | 'inset' | 'flat' }
>(({ className = '', variant = 'raised', children, ...props }, ref) => {
  const variantClasses = {
    raised: 'bg-[#1e222e] border border-white/[0.05] shadow-[6px_6px_12px_#101219,-6px_-6px_12px_#262c3b]',
    inset: 'bg-[#14161e] border border-white/[0.03] shadow-[inset_3px_3px_6px_#0f1118,inset_-3px_-3px_6px_#222634]',
    flat: 'bg-[#1a1d27] border border-white/[0.04]',
  };

  return (
    <div
      ref={ref}
      className={`rounded-3xl p-5 transition-all text-slate-100 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
NeomorphicCard.displayName = 'NeomorphicCard';

export const NeomorphicCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props} />
));
NeomorphicCardHeader.displayName = 'NeomorphicCardHeader';

export const NeomorphicCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-bold leading-none tracking-tight text-white ${className}`} {...props} />
));
NeomorphicCardTitle.displayName = 'NeomorphicCardTitle';

export const NeomorphicCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`pt-0 ${className}`} {...props} />
));
NeomorphicCardContent.displayName = 'NeomorphicCardContent';
