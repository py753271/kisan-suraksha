import { Request, Response } from 'express';
import SOSService from '../services/sos.service';
import ShelterService from '../services/shelter.service';
import ContactService from '../services/contact.service';
import ResourceService from '../services/resource.service';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticationError } from '../utils/errors';

export class EmergencyController {
  private sosService: SOSService;
  private shelterService: ShelterService;
  private contactService: ContactService;
  private resourceService: ResourceService;

  constructor(
    sosService = new SOSService(),
    shelterService = new ShelterService(),
    contactService = new ContactService(),
    resourceService = new ResourceService()
  ) {
    this.sosService = sosService;
    this.shelterService = shelterService;
    this.contactService = contactService;
    this.resourceService = resourceService;
  }

  createSOS = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const sos = await this.sosService.createSOS(req.user.id, req.body);
    sendSuccess(res, sos, undefined, 'SOS distress beacon created successfully', HTTP_STATUS.CREATED);
  };

  getSOSRequests = async (_req: Request, res: Response): Promise<void> => {
    const list = await this.sosService.getSOSRequests();
    sendSuccess(res, list, undefined, 'SOS active distress requests list retrieved');
  };

  getSOSById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const sos = await this.sosService.getSOSById(id);
    sendSuccess(res, sos, undefined, 'SOS request details retrieved successfully');
  };

  getContacts = async (req: Request, res: Response): Promise<void> => {
    const filters = {
      stateId: req.query.stateId ? String(req.query.stateId) : undefined,
      districtId: req.query.districtId ? String(req.query.districtId) : undefined,
      serviceType: req.query.serviceType ? String(req.query.serviceType) : undefined,
    };
    const list = await this.contactService.getContacts(filters);
    sendSuccess(res, list, undefined, 'Emergency helpline contacts lists compiled');
  };

  getShelters = async (_req: Request, res: Response): Promise<void> => {
    const list = await this.shelterService.getSheltersList();
    sendSuccess(res, list, undefined, 'Emergency shelters directory compiled');
  };

  getNearbyShelters = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const limit = Number(req.query.limit || 5);

    const list = await this.shelterService.getNearestShelters(lon, lat, limit);
    sendSuccess(res, list, undefined, 'Proximity nearest shelters search compiled');
  };

  getResources = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const limit = Number(req.query.limit || 5);

    const list = await this.resourceService.getNearbyResources(lon, lat, limit);
    sendSuccess(res, list, undefined, 'Proximity nearby rescue resources list compiled');
  };
}

export default EmergencyController;
