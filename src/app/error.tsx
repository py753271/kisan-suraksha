'use client';

import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';

export default function ErrorBoundaryPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Captured Render Error:', error);
  }, [error]);

  return (
    <div className="w-full min-h-screen bg-ks-bg text-ks-text flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-ks-surface border border-ks-border rounded-3xl p-6 shadow-ks-lg flex flex-col items-center text-center gap-6">
        
        <div className="p-4 bg-critical-red/10 rounded-full text-critical-red animate-pulse">
          <AlertTriangle className="w-12 h-12" />
        </div>

        <div>
          <h2 className="font-heading font-black text-xl">
            Internal Server Error (500)
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1 max-w-xs">
            A fatal exception occurred during rendering. Please retry or navigate back.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => reset()}
            className="touch-target px-6 py-3 bg-primary-green hover:bg-primary-green/90 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer w-full justify-center shadow-ks-sm"
          >
            <span>Try Again</span>
          </button>
          
          <a
            href="/dashboard"
            className="touch-target px-6 py-3 border border-ks-border hover:bg-ks-border/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer w-full justify-center"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </a>
        </div>

      </div>
    </div>
  );
}
