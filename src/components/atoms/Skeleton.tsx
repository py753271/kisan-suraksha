'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rect' }) => {
  return (
    <div
      className={cn(
        'bg-ks-border/40 animate-pulse',
        variant === 'text' && 'h-4 w-3/4 rounded',
        variant === 'rect' && 'h-32 w-full rounded-2xl',
        variant === 'circle' && 'h-12 w-12 rounded-full',
        className
      )}
    />
  );
};
