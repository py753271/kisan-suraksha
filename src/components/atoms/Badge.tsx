'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  severity?: 'safe' | 'warning' | 'danger' | 'critical' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, severity = 'info', className }) => {
  return (
    <span
      className={cn(
        'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center uppercase tracking-wider',
        severity === 'safe' && 'bg-success-green/10 text-success-green border border-success-green/20',
        severity === 'warning' && 'bg-warning-yellow/15 text-yellow-700 dark:text-warning-yellow border border-warning-yellow/30',
        severity === 'danger' && 'bg-danger-orange/15 text-danger-orange border border-danger-orange/30',
        severity === 'critical' && 'bg-critical-red text-white border border-critical-red/20 font-bold animate-pulse',
        severity === 'info' && 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
        className
      )}
    >
      {children}
    </span>
  );
};
