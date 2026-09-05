import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../../services/haptics';

export interface SlideMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackdropClick?: () => void;
  children: React.ReactNode | ((helpers: { close: () => void }) => React.ReactNode);
  className?: string;
  backdropClassName?: string;
  closeOnBackdropClick?: boolean;
}

export const SlideMenuModal: React.FC<SlideMenuModalProps> = ({
  isOpen,
  onClose,
  onBackdropClick,
  children,
  className = 'w-full max-w-sm m-4 flex flex-col max-h-[85vh]',
  backdropClassName = 'bg-black/80 backdrop-blur-md',
  closeOnBackdropClick = true,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isClosing) return;
    triggerHaptic('tick');
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 130);
  };

  const handleAnimationStart = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'slideLeftEnter') {
      triggerHaptic('tick');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${backdropClassName} ${
        isClosing ? 'animate-backdrop-fade-out pointer-events-none' : 'animate-backdrop-fade-in'
      }`}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          if (onBackdropClick) {
            onBackdropClick();
          } else {
            handleClose();
          }
        }
      }}
    >
      <div
        onAnimationStart={handleAnimationStart}
        className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden ${
          isClosing ? 'animate-slide-left-exit' : 'animate-slide-left-enter'
        } ${className}`}
      >
        {typeof children === 'function' ? children({ close: handleClose }) : children}
      </div>
    </div>
  );
};
