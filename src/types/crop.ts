export type CropSeverity = 'info' | 'warning' | 'danger';

export interface CropAdvisory {
  id: string;
  cropType: string;
  stage: string;
  weatherTrigger: string;
  title: string;
  advice: string;
  severity: CropSeverity;
  icon: string;
}
