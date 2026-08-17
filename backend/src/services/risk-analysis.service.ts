export class RiskAnalysisService {
  categorizeRisk(confidence: number, payload: any): 'Low' | 'Moderate' | 'High' | 'Critical' {
    if (confidence > 0.90 && payload.severity === 'Extreme') {
      return 'Critical';
    }
    if (confidence > 0.80 && (payload.severity === 'Severe' || payload.riskScore > 75)) {
      return 'High';
    }
    if (confidence > 0.70 || payload.riskScore > 40) {
      return 'Moderate';
    }
    return 'Low';
  }
}

export default RiskAnalysisService;
