'use client';

import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { CropAdvisory } from '@/types/crop';
import { Volume2, VolumeX, ShieldAlert, CloudRain, Info, Wind } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useLanguage } from '@/contexts/LanguageContext';

interface CropAdvisoryCardProps {
  advisory: CropAdvisory;
}

export const CropAdvisoryCard: React.FC<CropAdvisoryCardProps> = ({ advisory }) => {
  const { speak, stop, isSpeaking } = useSpeech();
  const { language, t } = useLanguage();

  const getIcon = (name: string) => {
    switch (name) {
      case 'shield-alert':
        return <ShieldAlert className="w-5 h-5 text-critical-red" />;
      case 'cloud-rain':
        return <CloudRain className="w-5 h-5 text-brand-blue" />;
      case 'wind':
        return <Wind className="w-5 h-5 text-danger-orange" />;
      default:
        return <Info className="w-5 h-5 text-primary-green" />;
    }
  };

  const handleAudio = () => {
    if (isSpeaking) {
      stop();
    } else {
      // Speak title and advise content
      speak(`${advisory.title}. ${advisory.advice}`, language);
    }
  };

  return (
    <Card className="flex flex-col gap-3 relative hover:shadow-ks-md transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2">
          {getIcon(advisory.icon)}
          <span className="text-xs font-bold text-ks-text-secondary uppercase tracking-wider">
            {advisory.cropType} — {advisory.stage}
          </span>
        </div>
        <Badge severity={advisory.severity === 'info' ? 'info' : advisory.severity === 'warning' ? 'warning' : 'danger'}>
          {advisory.severity}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <h4 className="font-heading font-bold text-base text-ks-text">
          {advisory.title}
        </h4>
        <p className="text-sm text-ks-text-secondary leading-relaxed">
          {advisory.advice}
        </p>
      </div>

      <div className="border-t border-ks-border/60 my-1" />

      {/* Voice Assistant Trigger */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-ks-text-secondary">
          Trigger: {advisory.weatherTrigger}
        </span>
        <button
          onClick={handleAudio}
          className="touch-target px-4 py-2 border border-ks-border rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-ks-border/20 cursor-pointer"
          aria-label={isSpeaking ? 'Stop speaking details' : 'Speak advisory details out loud'}
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
    </Card>
  );
};
export default CropAdvisoryCard;
