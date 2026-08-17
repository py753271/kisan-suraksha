export class MappingService {
  mapIMDWeather(rawData: any): any {
    return {
      temp: Number(rawData.temp),
      humidity: Number(rawData.humidity),
      feelsLike: Number(rawData.feelsLike || rawData.temp),
      condition: String(rawData.condition || 'Clear'),
      conditionCode: String(rawData.conditionCode || '1000'),
      pressure: Number(rawData.pressure || 1013),
      windSpeed: Number(rawData.windSpeed || 10),
      windDirection: String(rawData.windDirection || 'NW'),
      uvIndex: Number(rawData.uvIndex || 5),
      rainProbability: Number(rawData.rainProbability || 0),
      sunrise: String(rawData.sunrise || '06:00 AM'),
      sunset: String(rawData.sunset || '07:00 PM'),
      riskLevel: String(rawData.riskLevel || 'Low'),
      riskScore: Number(rawData.riskScore || 20),
      timestamp: new Date(),
    };
  }

  mapNDMAAlert(rawAlert: any): any {
    return {
      title: String(rawAlert.title),
      description: String(rawAlert.description),
      instructions: String(rawAlert.instructions || ''),
      status: 'Active',
      effectiveTime: new Date(rawAlert.effectiveTime || Date.now()),
      expiryTime: new Date(rawAlert.expiryTime || Date.now() + 86400000), // Default 1 day
      affectedArea: rawAlert.affectedArea || null,
      affectedRegions: rawAlert.affectedRegions || null,
    };
  }
}

export default MappingService;
