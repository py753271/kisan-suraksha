'use client';

import React from 'react';
import { WifiOff, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfflineFallbackPage() {
  return (
    <div className="w-full min-h-screen bg-ks-bg text-ks-text flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-ks-surface border border-ks-border rounded-3xl p-6 shadow-ks-lg flex flex-col items-center text-center gap-6">
        
        <div className="p-4 bg-critical-red/10 rounded-full text-critical-red animate-pulse">
          <WifiOff className="w-12 h-12" />
        </div>

        <div>
          <h2 className="font-heading font-black text-xl">
            You are Offline
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1 max-w-xs">
            We cannot establish connection to the remote weather server right now. Displaying cached parameters below.
          </p>
        </div>

        <div className="border-t border-ks-border/60 w-full my-1" />

        {/* Offline Emergency Numbers */}
        <div className="w-full text-left flex flex-col gap-2.5">
          <span className="text-[10px] uppercase font-bold text-ks-text-secondary tracking-wider block">
            Offline Emergency Helpline
          </span>
          <div className="bg-critical-red/10 border border-critical-red/20 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-critical-red">Central Disaster Desk</p>
              <p className="text-xs text-ks-text-secondary">Direct Telephone dial</p>
            </div>
            <a
              href="tel:112"
              className="touch-target bg-critical-red hover:bg-critical-red/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>Call 112</span>
            </a>
          </div>
        </div>

        <div className="border-t border-ks-border/60 w-full my-1" />

        <Link
          href="/dashboard"
          className="touch-target px-6 py-3 border border-ks-border hover:bg-ks-border/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer w-full justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Cached Dashboard</span>
        </Link>

      </div>
    </div>
  );
}
