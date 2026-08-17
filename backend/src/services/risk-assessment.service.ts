export class RiskAssessmentService {
  calculateRisk(params: { temp: number; humidity: number; alerts: any[] }): 'Low' | 'Moderate' | 'High' | 'Critical' {
    // 1. Critical Alert Triggers
    const hasCriticalAlert = params.alerts.some(
      (a) => a.severity.toLowerCase() === 'severe' || a.severity.toLowerCase() === 'extreme'
    );
    if (hasCriticalAlert) return 'Critical';

    // 2. High Risk Triggers
    const hasModerateAlert = params.alerts.some((a) => a.severity.toLowerCase() === 'moderate');
    if (hasModerateAlert || params.temp > 40) return 'High';

    // 3. Moderate Risk Triggers
    if (params.temp > 35 || params.humidity > 85) return 'Moderate';

    return 'Low';
  }
}

export default RiskAssessmentService;
