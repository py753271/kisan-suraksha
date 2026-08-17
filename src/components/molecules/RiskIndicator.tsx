'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';

interface RiskIndicatorProps {
  score: number; // 0 to 100
  level: 'safe' | 'warning' | 'danger' | 'critical';
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ score, level }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase text-ks-text-secondary tracking-wider">
          Village Risk Score
        </span>
        <span className="text-xs font-bold text-ks-text">
          {score} / 100
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-3 w-full bg-ks-border/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            level === 'safe' && 'bg-success-green',
            level === 'warning' && 'bg-warning-yellow',
            level === 'danger' && 'bg-danger-orange',
            level === 'critical' && 'bg-critical-red animate-pulse'
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Status Label */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className={cn(
            'w-3 h-3 rounded-full inline-block',
            level === 'safe' && 'bg-success-green',
            level === 'warning' && 'bg-warning-yellow',
            level === 'danger' && 'bg-danger-orange',
            level === 'critical' && 'bg-critical-red animate-ping'
          )}
        />
        <span className="text-sm font-bold">
          {level === 'safe' && t('riskSafe')}
          {level === 'warning' && t('riskWarning')}
          {level === 'danger' && t('riskDanger')}
          {level === 'critical' && t('riskCritical')}
        </span>
      </div>
    </div>
  );
};
