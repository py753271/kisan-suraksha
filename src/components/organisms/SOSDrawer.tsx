'use client';

import React, { useState, useEffect } from 'react';
import { Phone, AlertTriangle, X, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContactsQuery, useSOSMutation } from '@/hooks/useQueries';

export const SOSDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const [savedState, setSavedState] = useState('GJ');
  const [lat, setLat] = useState(22.3);
  const [lon, setLon] = useState(70.7);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = localStorage.getItem('ks_state') || 'GJ';
      setSavedState(state);
      const storedLat = localStorage.getItem('ks_location_lat');
      const storedLon = localStorage.getItem('ks_location_lng');
      if (storedLat && storedLon) {
        setLat(Number(storedLat));
        setLon(Number(storedLon));
      }
    }
  }, [isOpen]);

  const { data: contacts = [], isLoading } = useContactsQuery(savedState);
  const sosMutation = useSOSMutation();

  const triggerSOSSignal = async () => {
    try {
      await sosMutation.mutateAsync({
        latitude: lat,
        longitude: lon,
        disasterType: 'General Emergency',
        notes: 'SOS Distress request triggered manually from farmer dashboard application.',
      });
      setSosSent(true);
    } catch (err) {
      console.error('Failed to trigger SOS signal', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
      {/* Drawer Body */}
      <div className="bg-ks-surface text-ks-text rounded-t-3xl w-full max-w-lg p-6 shadow-ks-lg flex flex-col gap-6 animate-slide-up">
        <div className="flex justify-between items-center border-b border-ks-border pb-3">
          <div className="flex items-center gap-2 text-critical-red">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <h2 className="font-heading font-bold text-lg">
              {t('emergencySOS')} Help
            </h2>
          </div>
          <button onClick={onClose} className="touch-target p-2 hover:bg-ks-border/20 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-ks-text-secondary" />
          </button>
        </div>

        {/* Action Button */}
        <div className="bg-critical-red/10 border border-critical-red/20 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-critical-red">
            Immediate National Help Line (112)
          </p>
          <a
            href="tel:112"
            className="touch-target bg-critical-red hover:bg-critical-red/90 text-white font-bold flex items-center justify-center gap-3 py-4 rounded-xl shadow-ks-sm text-lg"
          >
            <Phone className="w-6 h-6 fill-white" />
            <span>Call 112 Now</span>
          </a>
        </div>

        {/* Dispatch SOS Distress Signal (Prisma + API Integration) */}
        <div className="bg-ks-border/10 border border-ks-border/30 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-ks-text">Broadcast Emergency Beacon</p>
              <p className="text-xs text-ks-text-secondary">Will transmit your GPS coordinates [{lat.toFixed(4)}, {lon.toFixed(4)}] to active agencies.</p>
            </div>
            <button
              onClick={triggerSOSSignal}
              disabled={sosMutation.isPending || sosSent}
              className={`touch-target px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-ks-sm cursor-pointer select-none transition ${
                sosSent
                  ? 'bg-primary-green text-white cursor-default'
                  : 'bg-critical-red text-white hover:bg-critical-red/95'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sosMutation.isPending ? 'Sending...' : sosSent ? 'Distress Sent' : 'Trigger SOS'}</span>
            </button>
          </div>
        </div>

        {/* List of other helplines */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-ks-text-secondary uppercase tracking-wider">
            Regional Emergency Contacts
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-ks-text-secondary animate-pulse">Loading regional contacts...</div>
            ) : contacts.length > 0 ? (
              contacts.map((contact: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-ks-border/10 p-3 rounded-xl border border-ks-border">
                  <div>
                    <p className="font-semibold text-sm">{contact.name}</p>
                    <p className="text-xs text-ks-text-secondary">{contact.phoneNumber || contact.number}</p>
                  </div>
                  <a
                    href={`tel:${contact.phoneNumber || contact.number}`}
                    className="touch-target px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-ks-text-secondary">No local contacts found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSDrawer;
