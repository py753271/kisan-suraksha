'use client';

import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { NaturalHazardAlert } from '@/types/alert';
import { Volume2, VolumeX, Share2 } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';

interface GovernmentAlertCardProps {
  alert: NaturalHazardAlert;
}

export const GovernmentAlertCard: React.FC<GovernmentAlertCardProps> = ({ alert }) => {
  const { speak, stop, isSpeaking } = useSpeech();
  const { language, t } = useLanguage();

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      speak(`${alert.title}. Alert details: ${alert.description}. Immediate action: ${alert.instructions}`, language);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(
      `🚨 *KISAN SURAKSHA WARNING* 🚨\n\n*${alert.title}*\n_${alert.source}_\n\n*Details:* ${alert.description}\n\n*Action Required:* ${alert.instructions}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <Card
      className={cn(
        'border-l-4 border-y-0 border-r-0 flex flex-col gap-4',
        alert.severity === 'warning' && 'border-l-warning-yellow bg-warning-yellow/5',
        alert.severity === 'danger' && 'border-l-danger-orange bg-danger-orange/5',
        alert.severity === 'critical' && 'border-l-critical-red bg-critical-red/5'
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-ks-text-secondary tracking-wider block">
            {alert.source} • {new Date(alert.timestamp).toLocaleDateString()}
          </span>
          <h4 className="font-heading font-bold text-base text-ks-text mt-1">
            {alert.title}
          </h4>
        </div>
        <Badge severity={alert.severity}>
          {alert.severity}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-ks-text leading-relaxed font-medium">
          {alert.description}
        </p>
        {alert.instructions && (
          <div className="bg-ks-border/20 border border-ks-border rounded-xl p-3 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ks-text-secondary block">
              Immediate Safety Steps
            </span>
            <p className="text-xs text-ks-text leading-normal font-semibold mt-1">
              {alert.instructions}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-ks-border/60 my-1" />

      <div className="flex justify-between items-center gap-2">
        <span className="text-[10px] text-ks-text-secondary font-medium">
          Areas: {alert.affectedAreas.join(', ')}
        </span>
        <div className="flex items-center gap-2">
          {/* WhatsApp Share Button */}
          <button
            onClick={handleShare}
            className="touch-target p-2.5 border border-ks-border rounded-xl hover:bg-ks-border/20 cursor-pointer flex items-center justify-center transition"
            aria-label="Share alert on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-ks-text-secondary" />
          </button>

          {/* Voice Broadcast Button */}
          <button
            onClick={handleAudio}
            className="touch-target px-4 py-2 border border-ks-border rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-ks-border/20 cursor-pointer"
            aria-label={isSpeaking ? 'Stop speaking details' : 'Speak alert details out loud'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-critical-red animate-pulse" />
                <span className="text-critical-red">Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-primary-green" />
                <span>{t('readOutLoud')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};
export default GovernmentAlertCard;
