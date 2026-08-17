'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Compass } from 'lucide-react';

// Dynamically import Leaflet Map component with no Server-Side Rendering
const MapComponent = dynamic(
  () => import('@/features/maps/MapComponent'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full rounded-2xl" />
  }
);

export default function InteractiveMapPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Page Title */}
        <div>
          <h2 className="font-heading font-black text-2xl text-ks-text">
            Interactive Hazard GIS Map
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1">
            Visual overlay coordinates of cyclone trajectories, high-risk river levels, and precipitation radar grids.
          </p>
        </div>

        {/* Map Box */}
        <MapComponent />

        {/* Legend description card */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary-green" />
            <h4 className="font-heading font-bold text-sm text-ks-text">
              GIS Layer Guide
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#E53935]/40 border border-[#E53935] inline-block" />
              <span>Red Zones: Immediate Evacuation / Critical danger</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#FB8C00]/40 border border-[#FB8C00] inline-block" />
              <span>Orange Zones: Prepare & Secure livestock/equipment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#FFC107]/40 border border-[#FFC107] inline-block" />
              <span>Yellow Zones: Monitor weather broadcasts</span>
            </div>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
