'use client';

import { useState } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
  }>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false
  });

  const getGeoLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation not supported', loading: false }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false
        });
      },
      (err) => {
        let msg = 'Failed to get location';
        if (err.code === 1) msg = 'Location access denied';
        setLocation({
          latitude: null,
          longitude: null,
          error: msg,
          loading: false
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return { ...location, getGeoLocation };
}
