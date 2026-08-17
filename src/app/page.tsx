'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Shield, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { SearchBox } from '@/components/molecules/SearchBox';

export default function WelcomePage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { getGeoLocation, latitude, longitude, loading, error } = useGeolocation();

  const handleLanguageSelect = (lang: 'en' | 'hi' | 'gu') => {
    setLanguage(lang);
  };

  const handleGpsLocation = () => {
    getGeoLocation();
  };

  // If GPS fetches successfully, store configuration and proceed
  React.useEffect(() => {
    if (latitude && longitude) {
      localStorage.setItem('ks_location_lat', String(latitude));
      localStorage.setItem('ks_location_lng', String(longitude));
      localStorage.setItem('ks_location_name', 'Rajkot, Gujarat (GPS)');
      localStorage.setItem('ks_state', 'GJ');
      router.push('/dashboard');
    }
  }, [latitude, longitude, router]);

  const handleVillageSelect = (name: string) => {
    localStorage.setItem('ks_location_name', name);
    // Find matching state/district details (e.g. Bihar if Patna, Punjab if Bathinda, else Gujarat)
    if (name.includes('Patna') || name.includes('Danapur') || name.includes('Maner')) {
      localStorage.setItem('ks_state', 'BR');
    } else if (name.includes('Bathinda') || name.includes('Maur') || name.includes('Bhucho')) {
      localStorage.setItem('ks_state', 'PB');
    } else {
      localStorage.setItem('ks_state', 'GJ');
    }
    router.push('/dashboard');
  };

  return (
    <div className="w-full min-h-screen bg-ks-bg text-ks-text flex flex-col justify-center items-center p-4">
      {/* Container Box */}
      <div className="w-full max-w-md bg-ks-surface border border-ks-border rounded-3xl p-6 md:p-8 shadow-ks-lg flex flex-col gap-6">
        
        {/* Brand Stamp */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-4 bg-primary-green/10 rounded-full">
            <Shield className="w-12 h-12 text-primary-green fill-primary-green/10" />
          </div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-primary-green leading-none">
            {t('appTitle')}
          </h1>
          <p className="text-xs text-ks-text-secondary font-semibold max-w-xs">
            {t('welcomeMessage')}
          </p>
        </div>

        {/* Language Selection Gate */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ks-text-secondary">
            {t('languageGateTitle')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'gu', label: 'ગુજરાતી' }
            ].map(item => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleLanguageSelect(item.code as 'en' | 'hi' | 'gu')}
                className={`touch-target py-3 rounded-xl font-bold border transition text-sm select-none cursor-pointer ${
                  language === item.code
                    ? 'bg-primary-green text-white border-primary-green shadow-ks-sm'
                    : 'border-ks-border hover:bg-ks-border/20 text-ks-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-ks-border/60 my-1" />

        {/* Location selector */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-ks-text-secondary">
            {t('selectVillage')}
          </label>

          {/* Search suggestions */}
          <SearchBox onSelect={handleVillageSelect} />

          <div className="flex items-center justify-center gap-3">
            <span className="h-px bg-ks-border/60 flex-1" />
            <span className="text-[10px] font-bold text-ks-text-secondary uppercase">{t('or')}</span>
            <span className="h-px bg-ks-border/60 flex-1" />
          </div>

          {/* GPS Detector button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGpsLocation}
            isLoading={loading}
            className="w-full flex items-center justify-center gap-2 border-2"
          >
            <Navigation className="w-5 h-5 text-primary-green" />
            <span>{t('currentLocationBtn')}</span>
          </Button>

          {error && (
            <div className="bg-critical-red/10 border border-critical-red/20 rounded-xl p-3 flex gap-2 items-center text-critical-red">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-semibold leading-snug">{error}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
