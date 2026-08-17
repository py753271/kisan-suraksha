export type AlertCategory =
  | 'Rain'
  | 'Flood'
  | 'Cyclone'
  | 'Earthquake'
  | 'Heatwave'
  | 'Cold Wave'
  | 'Thunderstorm'
  | 'Lightning'
  | 'Landslide';

export type AlertSeverity = 'warning' | 'danger' | 'critical';

export interface NaturalHazardAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  instructions: string;
  source: string;
  timestamp: string;
  affectedAreas: string[];
}
