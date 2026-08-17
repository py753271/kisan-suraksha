'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="w-full min-h-screen bg-ks-bg text-ks-text flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-ks-surface border border-ks-border rounded-3xl p-6 shadow-ks-lg flex flex-col items-center text-center gap-6">
        
        <div className="p-4 bg-brand-blue/10 rounded-full text-brand-blue animate-bounce">
          <Compass className="w-12 h-12" />
        </div>

        <div>
          <h2 className="font-heading font-black text-xl">
            Page Not Found (404)
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1 max-w-xs">
            The page you are trying to visit does not exist or has been relocated.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="touch-target px-6 py-3 bg-primary-green hover:bg-primary-green/90 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer w-full justify-center shadow-ks-sm animate-fade-in"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

      </div>
    </div>
  );
}
