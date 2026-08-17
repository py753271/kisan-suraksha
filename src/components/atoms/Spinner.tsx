'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export const Spinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'w-8 h-8 border-4 border-ks-border border-t-primary-green rounded-full animate-spin',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};
