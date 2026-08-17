export class RuleEngineService {
  evaluate(condition: any, params: { temp: number; humidity: number; windSpeed: number; alerts: any[] }): boolean {
    if (!condition || typeof condition !== 'object') {
      return true; // No conditions set means rule passes
    }

    // 1. Temperature checks
    if (condition.tempGte !== undefined && params.temp < condition.tempGte) return false;
    if (condition.tempLte !== undefined && params.temp > condition.tempLte) return false;

    // 2. Humidity checks
    if (condition.humidityGte !== undefined && params.humidity < condition.humidityGte) return false;
    if (condition.humidityLte !== undefined && params.humidity > condition.humidityLte) return false;

    // 3. Wind speed checks
    if (condition.windSpeedGte !== undefined && params.windSpeed < condition.windSpeedGte) return false;

    // 4. Alert constraints
    if (condition.requireAlertCategory) {
      const hasCat = params.alerts.some(
        (a) => a.category.toLowerCase() === condition.requireAlertCategory.toLowerCase()
      );
      if (!hasCat) return false;
    }

    if (condition.requireAlertSeverity) {
      const hasSev = params.alerts.some(
        (a) => a.severity.toLowerCase() === condition.requireAlertSeverity.toLowerCase()
      );
      if (!hasSev) return false;
    }

    return true;
  }
}

export default RuleEngineService;
