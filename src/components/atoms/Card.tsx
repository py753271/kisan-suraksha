'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-ks-surface text-ks-text rounded-2xl p-5 border border-ks-border shadow-ks-sm transition-all duration-200',
        hoverable && 'hover:shadow-ks-md hover:-translate-y-0.5 cursor-pointer active:scale-99',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
