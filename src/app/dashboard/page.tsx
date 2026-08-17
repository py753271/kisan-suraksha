'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  useWeatherQuery,
  useAlertsQuery,
  useCropAdvisoriesQuery,
} from '@/hooks/useQueries';
import DashboardLayout from '@/layouts/DashboardLayout';
import WeatherCard from '@/components/organisms/WeatherCard';
import GovernmentAlertCard from '@/components/organisms/GovernmentAlertCard';
import CropAdvisoryCard from '@/components/organisms/CropAdvisoryCard';
import SOSDrawer from '@/components/organisms/SOSDrawer';
import { Card } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { AlertTriangle, Navigation, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function FarmerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [locationName, setLocationName] = useState('Rajkot, Gujarat');
  const [lat, setLat] = useState(22.3);
  const [lon, setLon] = useState(70.7);
  const [sosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLat = localStorage.getItem('ks_location_lat');
      const storedLon = localStorage.getItem('ks_location_lng');
      const storedName = localStorage.getItem('ks_location_name');
      if (storedLat && storedLon) {
        setLat(Number(storedLat));
        setLon(Number(storedLon));
      }
      if (storedName) {
        setLocationName(storedName);
      }
    }
  }, []);

  const { data: weather, isLoading: weatherLoading } = useWeatherQuery(lat, lon);
  const { data: alerts = [], isLoading: alertsLoading } = useAlertsQuery(lat, lon);
  const { data: advisories = [], isLoading: advisoriesLoading } = useCropAdvisoriesQuery(lat, lon);

  const loading = weatherLoading || alertsLoading || advisoriesLoading || authLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['weather', lat, lon] });
    queryClient.invalidateQueries({ queryKey: ['alerts', lat, lon] });
    queryClient.invalidateQueries({ queryKey: ['cropAdvisories', lat, lon] });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-ks-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary-green animate-spin" />
          <p className="text-sm font-semibold text-ks-text-secondary">Restoring farmer session...</p>
        </div>
      </div>
    );
  }

  const mappedCurrentWeather = weather
    ? {
        temp: Number(weather.temp),
        feelsLike: Number(weather.feelsLike),
        condition: weather.condition,
        conditionCode: weather.conditionCode || 'clear-day',
        humidity: weather.humidity,
        pressure: weather.pressure || 1013,
        windSpeed: Number(weather.windSpeed),
        windDirection: weather.windDirection,
        uvIndex: weather.uvIndex,
        rainProbability: weather.rainProbability || 0,
        sunrise: weather.sunrise,
        sunset: weather.sunset,
        riskLevel: weather.riskLevel || 'safe',
        riskScore: weather.riskScore || 0,
        timestamp: weather.timestamp || new Date().toISOString(),
      }
    : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Quick Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading font-black text-2xl text-ks-text">
              Farmer Dashboard
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-ks-text-secondary mt-1">
              <Navigation className="w-3.5 h-3.5 text-primary-green" />
              <span className="font-bold">{locationName}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="touch-target px-4 py-2 border border-ks-border rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-ks-border/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-ks-text-secondary" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setSosOpen(true)}
              className="touch-target px-4 py-2 bg-critical-red hover:bg-critical-red/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-ks-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS Help</span>
            </button>
          </div>
        </div>

        {/* Dashboard grid layout */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left sidebar widgets */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {mappedCurrentWeather && (
                <WeatherCard weather={mappedCurrentWeather} locationName={locationName} />
              )}

              {/* Forecast preview card */}
              <Card className="flex flex-col gap-4">
                <h3 className="font-heading font-bold text-sm text-ks-text-secondary uppercase tracking-wider">
                  Climatic Overview
                </h3>
                <p className="text-xs text-ks-text-secondary leading-relaxed font-semibold">
                  Authoritative weather records synchronized directly from the Indian Meteorological Department (IMD) feed logs.
                </p>
              </Card>
            </div>

            {/* Main widgets area */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Warnings / Hazards Section */}
              <div className="flex flex-col gap-3">
                <h3 className="font-heading font-bold text-sm text-ks-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-critical-red" />
                  <span>Active Warnings for your Area</span>
                </h3>
                <div className="flex flex-col gap-4">
                  {alerts.length > 0 ? (
                    alerts.map((alert: any) => (
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
                    <Card className="text-center py-6 text-ks-text-secondary">
                      No active disaster alerts for your village today. Safe to work.
                    </Card>
                  )}
                </div>
              </div>

              {/* Crop Advisories Section */}
              <div className="flex flex-col gap-3">
                <h3 className="font-heading font-bold text-sm text-ks-text-secondary uppercase tracking-wider">
                  Agronomic Advisories
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisories.length > 0 ? (
                    advisories.map((advisory: any) => (
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
                    <Card className="col-span-2 text-center py-6 text-ks-text-secondary">
                      No advisories active for current stage.
                    </Card>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Emergency SOS overlay */}
      <SOSDrawer isOpen={sosOpen} onClose={() => setSosOpen(false)} />
    </DashboardLayout>
  );
}
