'use client';

import React from 'react';
import { Card } from '../atoms/Card';
import { RiskIndicator } from '../molecules/RiskIndicator';
import { CurrentWeather } from '@/types/weather';
import { Sun, CloudRain, Cloud, Wind, Droplets, Compass } from 'lucide-react';

interface WeatherCardProps {
  weather: CurrentWeather;
  locationName: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, locationName }) => {
  const getIcon = (code: string) => {
    switch (code) {
      case 'rain_patchy':
      case 'cloud-rain':
        return <CloudRain className="w-12 h-12 text-brand-blue" />;
      case 'sun':
        return <Sun className="w-12 h-12 text-warning-yellow" />;
      case 'wind':
        return <Wind className="w-12 h-12 text-ks-text-secondary" />;
      default:
        return <Cloud className="w-12 h-12 text-ks-text-secondary" />;
    }
  };

  return (
    <Card className="flex flex-col gap-5 w-full">
      {/* Location Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-heading font-bold text-lg text-primary-green">
            {locationName}
          </h3>
          <p className="text-xs text-ks-text-secondary">
            Last Updated: {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getIcon(weather.conditionCode)}
          <span className="text-3xl font-bold font-heading">{weather.temp}°C</span>
        </div>
      </div>

      <div className="border-t border-ks-border/60 my-1" />

      {/* Weather Attributes Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-brand-blue" />
          <div>
            <p className="text-[10px] text-ks-text-secondary uppercase">Humidity</p>
            <p className="text-sm font-semibold">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary-green" />
          <div>
            <p className="text-[10px] text-ks-text-secondary uppercase">Wind Speed</p>
            <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-danger-orange" />
          <div>
            <p className="text-[10px] text-ks-text-secondary uppercase">Wind Dir</p>
            <p className="text-sm font-semibold">{weather.windDirection}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-warning-yellow" />
          <div>
            <p className="text-[10px] text-ks-text-secondary uppercase">UV Index</p>
            <p className="text-sm font-semibold">{weather.uvIndex}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-ks-border/60 my-1" />

      {/* Safety Risk Indicator */}
      <RiskIndicator score={weather.riskScore} level={weather.riskLevel} />
    </Card>
  );
};
export default WeatherCard;
