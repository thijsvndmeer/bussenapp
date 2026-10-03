import React from 'react';

export interface NeomorphicSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

/**
 * NeomorphicSwitch - Tactile debossed groove track with sliding convex knob.
 * Follows shadcn/ui Switch interaction pattern and accessibility.
 */
export const NeomorphicSwitch: React.FC<NeomorphicSwitchProps> = React.memo(({
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
  label,
  id,
}) => {
  const toggle = () => {
    if (disabled) return;
    onCheckedChange(!checked);
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171a23] ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: '#14161e',
          boxShadow: 'inset 3px 3px 6px #0f1118, inset -3px -3px 6px #242937',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full transition-transform duration-200 ease-in-out flex items-center justify-center ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
          style={{
            background: checked
              ? 'linear-gradient(145deg, #38bdf8, #0284c7)'
              : 'linear-gradient(145deg, #262c3b, #1a1e28)',
            boxShadow: checked
              ? '2px 2px 6px #0f1118, -2px -2px 6px #252b39'
              : '2px 2px 5px #0f1118, -2px -2px 5px #252b39',
          }}
        />
      </button>
      {label && (
        <span 
          onClick={toggle}
          className={`text-sm select-none cursor-pointer font-medium ${
            disabled ? 'text-slate-500' : 'text-slate-300 hover:text-white'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
});

NeomorphicSwitch.displayName = 'NeomorphicSwitch';
