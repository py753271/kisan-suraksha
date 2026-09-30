'use client';

import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { usePreferencesQuery } from '@/hooks/useQueries';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/atoms/Card';
import { Accessibility, Eye, Bell, Check, Loader2 } from 'lucide-react';

export default function AccessibilitySettingsPage() {
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    simpleLanguage,
    setSimpleLanguage
  } = useAccessibility();

  const { data: preferences = [], isLoading: prefLoading } = usePreferencesQuery();

  const isSmsEnabled = preferences.find((p: any) => p.channel === 'SMS')?.isEnabled ?? true;
  const isEmailEnabled = preferences.find((p: any) => p.channel === 'EMAIL')?.isEnabled ?? false;
  const isPushEnabled = preferences.find((p: any) => p.channel === 'PUSH')?.isEnabled ?? true;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-heading font-black text-2xl text-ks-text flex items-center gap-2">
              <Accessibility className="w-8 h-8 text-primary-green" />
              <span>Accessibility & Safety settings</span>
            </h2>
            <p className="text-xs text-ks-text-secondary mt-1">
              Customize layout size, color contrasts, and early warning communications channels.
            </p>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Text Size Scale Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-green" />
              <h4 className="font-heading font-bold text-sm text-ks-text">
                Text Font Size
              </h4>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { code: 'normal', label: 'Default / Medium (16px)' },
                { code: 'large', label: 'Large (18px)' },
                { code: 'xlarge', label: 'Extra Large (20px)' }
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => setTextSize(item.code as 'normal' | 'large' | 'xlarge')}
                  className={`touch-target text-left w-full px-4 py-3 rounded-xl border text-sm font-semibold cursor-pointer transition ${
                    textSize === item.code
                      ? 'bg-primary-green text-white border-primary-green shadow-ks-sm font-bold'
                      : 'border-ks-border hover:bg-ks-border/20 text-ks-text'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Accessibility switches */}
          <Card className="flex flex-col gap-5 justify-center">
            
            {/* High contrast switch */}
            <div className="flex justify-between items-center bg-ks-border/10 p-4 border border-ks-border rounded-2xl">
              <div>
                <p className="font-bold text-sm text-ks-text">High Contrast Mode</p>
                <p className="text-xs text-ks-text-secondary mt-0.5 max-w-xs">
                  Transforms site background to pitch black with bright yellow accents for reading in bright daylight.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`touch-target w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                  highContrast ? 'bg-primary-green' : 'bg-ks-border'
                }`}
                aria-label="Toggle High Contrast Mode"
              >
                <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Simple vocabulary mode switch */}
            <div className="flex justify-between items-center bg-ks-border/10 p-4 border border-ks-border rounded-2xl">
              <div>
                <p className="font-bold text-sm text-ks-text">Jargon-Free Simple Mode</p>
                <p className="text-xs text-ks-text-secondary mt-0.5 max-w-xs">
                  Simplifies complex scientific weather jargon into clear, regional warnings and crop suggestions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSimpleLanguage(!simpleLanguage)}
                className={`touch-target w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                  simpleLanguage ? 'bg-primary-green' : 'bg-ks-border'
                }`}
                aria-label="Toggle simplified vocabulary"
              >
                <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${
                  simpleLanguage ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </Card>
        </div>

        {/* Notifications Channel Settings (Phase 9 Real API Client Integration) */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-green" />
            <h4 className="font-heading font-bold text-sm text-ks-text">
              Emergency Broadcast Alert Channels
            </h4>
          </div>
          {prefLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { code: 'SMS', label: 'SMS Warnings', desc: 'Direct phone texts', active: isSmsEnabled },
                { code: 'EMAIL', label: 'Email Advisories', desc: 'In-depth PDFs summaries', active: isEmailEnabled },
                { code: 'PUSH', label: 'Push Notifications', desc: 'Instant desktop popups', active: isPushEnabled },
              ].map(item => (
                <div
                  key={item.code}
                  className={`flex flex-col gap-2 p-4 border border-ks-border rounded-2xl relative ${
                    item.active ? 'bg-primary-green/5 border-primary-green' : 'bg-ks-surface'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-ks-text">{item.label}</span>
                    {item.active && (
                      <span className="p-1 bg-primary-green rounded-full text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-ks-text-secondary">{item.desc}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
}
