'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAlertsQuery } from '@/hooks/useQueries';
import DashboardLayout from '@/layouts/DashboardLayout';
import GovernmentAlertCard from '@/components/organisms/GovernmentAlertCard';
import { Card } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Search, Filter, AlertOctagon } from 'lucide-react';

export default function LiveAlertsTimeline() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lat, setLat] = useState(22.3);
  const [lon, setLon] = useState(70.7);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

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

  const { data: alerts = [], isLoading } = useAlertsQuery(lat, lon);

  const filteredAlerts = alerts.filter((alert: any) => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(search.toLowerCase()) ||
      alert.description?.toLowerCase().includes(search.toLowerCase());

    const mappedSeverity = alert.severity?.name?.toLowerCase() || 'moderate';
    const matchesSeverity =
      severityFilter === 'all' ||
      (severityFilter === 'critical' && mappedSeverity === 'extreme') ||
      (severityFilter === 'danger' && mappedSeverity === 'severe') ||
      (severityFilter === 'warning' && (mappedSeverity === 'moderate' || mappedSeverity === 'minor'));

    return matchesSearch && matchesSeverity;
  });

  if (authLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title */}
        <div>
          <h2 className="font-heading font-black text-2xl text-ks-text">
            Official Live Alerts Feed
          </h2>
          <p className="text-xs text-ks-text-secondary mt-1">
            Chronological warning updates verified by CWC, IMD, and National Disaster Control authorities.
          </p>
        </div>

        {/* Filters Panel */}
        <Card className="flex flex-col md:flex-row gap-4 p-4 items-center">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 w-4 h-4 text-ks-text-secondary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search warnings, districts, hazards..."
              className="w-full pl-9 pr-4 py-2.5 bg-ks-bg border border-ks-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green touch-target"
            />
          </div>

          {/* Severity selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-ks-text-secondary" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-ks-bg text-ks-text border border-ks-border rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none cursor-pointer touch-target w-full md:w-auto"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (Extreme)</option>
              <option value="danger">Danger (Severe)</option>
              <option value="warning">Warning (Moderate/Minor)</option>
            </select>
          </div>
        </Card>

        {/* Timeline body */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert: any) => (
                <GovernmentAlertCard
                  key={alert.id}
                  alert={{
                    id: alert.id,
                    category: (alert.category?.name || 'Rain'),
                    severity: (alert.severity?.name?.toLowerCase() === 'extreme' ? 'critical' : alert.severity?.name?.toLowerCase() === 'severe' ? 'danger' : 'warning'),
                    title: alert.title,
                    description: alert.description,
                    instructions: alert.instructions || '',
                    source: alert.source?.name || 'Government Feed',
                    timestamp: alert.effectiveTime || new Date().toISOString(),
                    affectedAreas: alert.affectedRegions || [],
                  }}
                />
              ))
            ) : (
              <Card className="text-center py-12 flex flex-col items-center gap-2 justify-center text-ks-text-secondary">
                <AlertOctagon className="w-10 h-10 text-ks-text-secondary/55" />
                <p className="font-semibold text-sm">No matching active alerts found for your search criteria.</p>
              </Card>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
