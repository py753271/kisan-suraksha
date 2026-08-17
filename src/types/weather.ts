export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  rainProbability: number;
  sunrise: string;
  sunset: string;
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
  riskScore: number;
  timestamp: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  icon: string;
  rainChance: number;
}

export interface ForecastDay {
  day: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  rainChance: number;
}
