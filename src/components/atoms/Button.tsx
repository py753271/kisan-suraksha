'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'touch-target px-6 py-3 font-semibold rounded-xl transition duration-150 ease-in-out cursor-pointer flex items-center justify-center gap-2 select-none active:scale-98',
        'focus:outline-none focus:ring-4 focus:ring-brand-blue/40 disabled:opacity-50 disabled:cursor-not-allowed',
        // Variants configuration
        variant === 'primary' && 'bg-primary-green hover:bg-primary-green/95 text-white',
        variant === 'secondary' && 'bg-secondary-green hover:bg-secondary-green/95 text-white',
        variant === 'danger' && 'bg-critical-red hover:bg-critical-red/95 text-white font-bold animate-pulse',
        variant === 'outline' && 'border-2 border-ks-border hover:bg-ks-border/20 text-ks-text',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
};
