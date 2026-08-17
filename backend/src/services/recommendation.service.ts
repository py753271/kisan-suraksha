export class RecommendationService {
  getAdvisory(type: string, payload: any): string[] {
    const steps: string[] = [];

    if (type === 'WEATHER_TREND') {
      if (payload.trend === 'dry') {
        steps.push('Increase irrigation frequencies.', 'Apply mulching to preserve soil moisture.');
      } else {
        steps.push('Clear field drainage pathways to avoid waterlogging.', 'Postpone sowing schedules.');
      }
    } else if (type === 'CROP_RISK') {
      if (payload.riskType === 'Pest Outbreak') {
        steps.push('Deploy organic neem oil sprays.', 'Monitor crop undersides daily.');
      } else {
        steps.push('Apply preventive copper fungicides.', 'Avoid sprinkler irrigation.');
      }
    } else {
      steps.push('Plan harvesting schedules.', 'Prepare storage containers.');
    }

    return steps;
  }
}

export default RecommendationService;
