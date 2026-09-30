import { Request, Response } from 'express';
import LayerService from '../services/layer.service';
import SpatialService from '../services/spatial.service';
import MapService from '../services/map.service';
import { sendSuccess } from '../utils/response';

export class MapController {
  private layerService: LayerService;
  private spatialService: SpatialService;
  private mapService: MapService;

  constructor(
    layerService = new LayerService(),
    spatialService = new SpatialService(),
    mapService = new MapService()
  ) {
    this.layerService = layerService;
    this.spatialService = spatialService;
    this.mapService = mapService;
  }

  getLayer = async (req: Request, res: Response): Promise<void> => {
    const layerName = String(req.params.layerName);
    const layer = await this.layerService.getLayer(layerName);
    sendSuccess(res, layer, undefined, 'GIS Map layer overlay retrieved successfully');
  };

  getBoundary = async (req: Request, res: Response): Promise<void> => {
    const type = String(req.params.type);
    const code = String(req.query.code);
    const boundary = await this.mapService.getBoundary(type, code);
    sendSuccess(res, boundary, undefined, 'Administrative region boundary GeoJSON retrieved');
  };

  getNearestShelters = async (req: Request, res: Response): Promise<void> => {
    const lon = Number(req.query.lon);
    const lat = Number(req.query.lat);
    const limit = Number(req.query.limit || 5);

    const shelters = await this.spatialService.getNearestShelters(lon, lat, limit);
    sendSuccess(res, shelters, undefined, 'Nearest emergency shelters compiled successfully');
  };

  reverseGeocode = async (req: Request, res: Response): Promise<void> => {
    const lon = Number(req.query.lon);
    const lat = Number(req.query.lat);

    const administrativeDetails = await this.spatialService.reverseGeocode(lon, lat);
    sendSuccess(res, administrativeDetails, undefined, 'Reverse geocoding boundaries lookup compiled');
  };

  searchLocations = async (req: Request, res: Response): Promise<void> => {
    const q = String(req.query.q || '');
    const limit = Number(req.query.limit || 10);

    const locations = await this.mapService.searchLocations(q, limit);
    sendSuccess(res, locations, undefined, 'Locations search results compiled successfully');
  };
}

export default MapController;
