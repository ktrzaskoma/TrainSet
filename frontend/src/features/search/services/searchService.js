import { scheduleService } from '../../../shared/services/api';

export const searchService = {
  getStops: scheduleService.getStops,
  getStopsInRouteOrder: scheduleService.getStopsInRouteOrder,
  getIntermediateStops: scheduleService.getIntermediateStops,
  searchConnections: scheduleService.searchConnections,
  getDelays: scheduleService.getDelays,
};
