'use client';

import React, { useState, useEffect } from 'react';
import { useCropAdvisoriesQuery } from '@/hooks/useQueries';
import DashboardLayout from '@/layouts/DashboardLayout';
import CropAdvisoryCard from '@/components/organisms/CropAdvisoryCard';
import { Card } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { BookOpen } from 'lucide-react';

export default function CropAdvisoryPage() {
  const [lat, setLat] = useState(22.3);
  const [lon, setLon] = useState(70.7);
  const [cropType, setCropType] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLat = localStorage.getItem('ks_location_lat');
      const storedLon = localStorage.getItem('ks_location_lng');
      if (storedLat && storedLon) {
        setLat(Number(storedLat));
        setLon(Number(storedLon));
      }
    }
  }, []);

  const { data: advisories = [], isLoading } = useCropAdvisoriesQuery(lat, lon);

  const filtered = cropType === 'all'
    ? advisories
    : advisories.filter((item: any) =>
        item.cropName?.toLowerCase() === cropType.toLowerCase()
      );

  const handleFilter = (type: string) => {
    setCropType(type);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title */}
        <div>
          <h2 className="font-heading font-black text-2xl text-ks-text flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-green" />
            <span>Agronomic Advisory Board</span>
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1">
            Dynamic crop management recommendations updated daily based on local temperature, wind velocities, and storm models.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {[
            { code: 'all', label: 'All Crops' },
            { code: 'cotton', label: 'Cotton' },
            { code: 'paddy', label: 'Paddy' },
            { code: 'wheat', label: 'Wheat' },
            { code: 'vegetables', label: 'Vegetables' }
          ].map(item => (
            <button
              key={item.code}
              onClick={() => handleFilter(item.code)}
              className={`touch-target px-5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer shrink-0 transition ${
                cropType === item.code
                  ? 'bg-primary-green text-white border-primary-green shadow-ks-sm'
                  : 'border-ks-border hover:bg-ks-border/20 text-ks-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Advisory List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length > 0 ? (
              filtered.map((advisory: any) => (
                <CropAdvisoryCard
                  key={advisory.id}
                  advisory={{
                    id: advisory.id,
                    cropType: advisory.cropName,
                    stage: advisory.stage,
                    weatherTrigger: advisory.season,
                    title: `${advisory.cropName} Advisory (${advisory.stage})`,
                    advice: advisory.advisoryText,
                    severity: advisory.calculatedRiskLevel?.toLowerCase() === 'high' ? 'danger' : advisory.calculatedRiskLevel?.toLowerCase() === 'moderate' ? 'warning' : 'info',
                    icon: advisory.calculatedRiskLevel?.toLowerCase() === 'high' ? 'shield-alert' : 'info',
                  }}
                />
              ))
            ) : (
              <Card className="col-span-full text-center py-12 text-ks-text-secondary">
                No active advisory alerts found for this crop category today.
              </Card>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
