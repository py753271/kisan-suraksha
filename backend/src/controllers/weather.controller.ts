import { Request, Response } from 'express';
import WeatherService from '../services/weather.service';
import { sendSuccess } from '../utils/response';

export class WeatherController {
  private weatherService: WeatherService;

  constructor(weatherService = new WeatherService()) {
    this.weatherService = weatherService;
  }

  getCurrent = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const units = String(req.query.units || 'metric');
    const lang = String(req.query.lang || 'en');

    const weather = await this.weatherService.getCurrentWeather(lat, lon, units, lang);
    sendSuccess(res, weather, undefined, 'Current weather retrieved successfully');
  };

  getHourly = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const units = String(req.query.units || 'metric');
    const lang = String(req.query.lang || 'en');

    const forecast = await this.weatherService.getHourlyForecast(lat, lon, units, lang);
    sendSuccess(res, forecast, undefined, 'Hourly weather forecast retrieved successfully');
  };

  getDaily = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const units = String(req.query.units || 'metric');
    const lang = String(req.query.lang || 'en');

    const forecast = await this.weatherService.getDailyForecast(lat, lon, units, lang);
    sendSuccess(res, forecast, undefined, 'Daily weather forecast retrieved successfully');
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const startDate = new Date(String(req.query.startDate));
    const endDate = new Date(String(req.query.endDate));

    const history = await this.weatherService.getWeatherHistory(lat, lon, startDate, endDate);
    sendSuccess(res, history, undefined, 'Weather history logs retrieved successfully');
  };

  getSummary = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const lang = String(req.query.lang || 'en');

    const summary = await this.weatherService.getWeatherSummary(lat, lon, lang);
    sendSuccess(res, summary, undefined, 'Weather alert narrative summary compiled successfully');
  };
}

export default WeatherController;
