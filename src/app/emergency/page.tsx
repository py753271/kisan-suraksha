'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useContactsQuery } from '@/hooks/useQueries';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Phone, AlertTriangle } from 'lucide-react';

export default function EmergencyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [savedState, setSavedState] = useState('GJ');
  const [stateName, setStateName] = useState('Gujarat');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = localStorage.getItem('ks_state') || 'GJ';
      setSavedState(state);
      setStateName(
        state === 'GJ' ? 'Gujarat' : state === 'BR' ? 'Bihar' : state === 'PB' ? 'Punjab' : 'Local state'
      );
    }
  }, []);

  const { data: contacts = [], isLoading } = useContactsQuery(savedState);

  if (authLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h2 className="font-heading font-black text-2xl text-ks-text text-critical-red flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
            <span>Emergency Relief Center</span>
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1">
            Immediate emergency rescue calls, district control centers, and panchayat officer hotlines.
          </p>
        </div>

        {/* Primary Call Box */}
        <Card className="border-2 border-critical-red bg-critical-red/5 p-6 flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-critical-red/10 rounded-full">
            <Phone className="w-12 h-12 text-critical-red" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-critical-red">
              National Disaster & Police Emergency (112)
            </h3>
            <p className="text-xs text-ks-text-secondary max-w-sm mt-1">
              Tap the button below to immediately call the centralized national help desk. Active 24/7.
            </p>
          </div>
          <a
            href="tel:112"
            className="touch-target bg-critical-red hover:bg-critical-red/90 text-white font-bold px-8 py-4 rounded-xl shadow-ks-lg text-lg flex items-center gap-2 active:scale-98"
          >
            <Phone className="w-5 h-5 fill-white" />
            <span>Call 112 Now</span>
          </a>
        </Card>

        {/* State contacts list */}
        <div className="flex flex-col gap-3">
          <h4 className="font-heading font-bold text-sm text-ks-text-secondary uppercase tracking-wider">
            Verified Helplines for {stateName} State
          </h4>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.length > 0 ? (
                contacts.map((contact: any, idx: number) => (
                  <Card key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{contact.name}</p>
                      <p className="text-xs text-ks-text-secondary mt-0.5">{contact.phoneNumber || contact.number}</p>
                    </div>
                    <a
                      href={`tel:${contact.phoneNumber || contact.number}`}
                      className="touch-target bg-primary-green hover:bg-primary-green/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-ks-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full text-center py-6 text-ks-text-secondary">
                  No state helplines configured for the selected region.
                </Card>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
