import { ValidationError } from '../utils/errors';

export class ValidationService {
  validateResponse(response: any, provider: string): void {
    if (!response) {
      throw new ValidationError(`Empty API response received from provider: ${provider}`);
    }

    if (typeof response !== 'object') {
      throw new ValidationError(`Invalid non-JSON response structure received from provider: ${provider}`);
    }

    // Basic structure validations
    if (provider === 'IMD') {
      if (response.temp === undefined || response.humidity === undefined) {
        throw new ValidationError('IMD response payload is missing required meteorological properties.');
      }
    } else if (provider === 'NDMA' || provider === 'CWC') {
      if (!Array.isArray(response.alerts)) {
        throw new ValidationError(`${provider} response payload is missing alerts array.`);
      }
    }
  }
}

export default ValidationService;
