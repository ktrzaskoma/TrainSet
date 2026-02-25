import { ticketingService, scheduleService, userService } from '../../../shared/services/api';

export const ticketsService = {
  purchaseTicket: ticketingService.purchaseTicket,
  getUserTickets: ticketingService.getUserTickets,
  getTicketByNumber: ticketingService.getTicketByNumber,
  getTicketsByTrip: ticketingService.getTicketsByTrip,
  getAllTickets: ticketingService.getAllTickets,
  getTicketDelays: ticketingService.getTicketDelays,
  
  getIntermediateStops: scheduleService.getIntermediateStops,
  
  purchaseTicketViaUser: userService.purchaseTicket,
};
