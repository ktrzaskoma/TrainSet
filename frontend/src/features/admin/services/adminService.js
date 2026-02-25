import { gatewayApi } from '../../../shared/services/api';

export const adminService = {
  getAllDelays: async () => {
    const response = await gatewayApi.get('/schedule/delays');
    return response.data;
  },
  getDelayReasons: async () => {
    const response = await gatewayApi.get('/schedule/delays/reasons');
    return response.data;
  },
  createDelay: async (delayData) => {
    const response = await gatewayApi.post('/schedule/delays', delayData);
    return response.data;
  },
  updateDelay: async (delayId, delayData) => {
    const response = await gatewayApi.put(`/schedule/delays/${delayId}`, delayData);
    return response.data;
  },
  resolveDelay: async (delayId) => {
    const response = await gatewayApi.post(`/schedule/delays/${delayId}/resolve`);
    return response.data;
  },
  deleteDelay: async (delayId) => {
    const response = await gatewayApi.delete(`/schedule/delays/${delayId}`);
    return response.data;
  },
  adjustDelay: async (delayId, minutes) => {
    const response = await gatewayApi.post(`/schedule/delays/${delayId}/adjust?minutes=${minutes}`);
    return response.data;
  },

  uploadGtfs: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await gatewayApi.post('/schedule/gtfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },
  getActiveUpload: async () => {
    const response = await gatewayApi.get('/schedule/gtfs/upload/active');
    return response.data;
  },
  getTripsGrouped: async () => {
    const response = await gatewayApi.get('/schedule/trips/grouped');
    return response.data;
  },
  getTripStops: async (tripId, serviceId) => {
    const response = await gatewayApi.get(`/schedule/trips/${tripId}/stops`, {
      params: { serviceId }
    });
    return response.data;
  },
  getStopsInRouteOrder: async () => {
    const response = await gatewayApi.get('/schedule/stops/route-order');
    return response.data;
  },

  getCancellationReasons: async () => {
    const response = await gatewayApi.get('/schedule/cancellations/reasons');
    return response.data;
  },
  getAllCancellations: async () => {
    const response = await gatewayApi.get('/schedule/cancellations');
    return response.data;
  },
  getActiveCancellations: async () => {
    const response = await gatewayApi.get('/schedule/cancellations/active');
    return response.data;
  },
  createCancellation: async (cancellationData) => {
    const response = await gatewayApi.post('/schedule/cancellations', cancellationData);
    return response.data;
  },
  updateCancellation: async (id, cancellationData) => {
    const response = await gatewayApi.put(`/schedule/cancellations/${id}`, cancellationData);
    return response.data;
  },
  reinstateCancellation: async (id) => {
    const response = await gatewayApi.put(`/schedule/cancellations/${id}/reinstate`);
    return response.data;
  },
  deleteCancellation: async (id) => {
    const response = await gatewayApi.delete(`/schedule/cancellations/${id}`);
    return response.data;
  },

  getAllTickets: async () => {
    const response = await gatewayApi.get('/ticketing/ticket/all');
    return response.data;
  },
  getTicketsByTrip: async (tripId) => {
    const response = await gatewayApi.get(`/ticketing/ticket/trip/${tripId}`);
    return response.data;
  },
  getTicketByNumber: async (ticketNumber) => {
    const response = await gatewayApi.get(`/ticketing/ticket/${ticketNumber}`);
    return response.data;
  },

  getUsers: async () => {
    const response = await gatewayApi.get('/user/users');
    return response.data;
  },
  getUser: async (userId) => {
    const response = await gatewayApi.get(`/user/users/${userId}`);
    return response.data;
  },
  createUser: async (userData) => {
    const response = await gatewayApi.post('/user/users', userData);
    return response.data;
  },
  purchaseTicket: async (ticketData) => {
    const response = await gatewayApi.post('/user/tickets', ticketData);
    return response.data;
  },

  sendNotification: async (notificationData) => {
    const response = await gatewayApi.post('/notification/notifications', notificationData);
    return response.data;
  },
  getUserNotifications: async (userId) => {
    const response = await gatewayApi.get(`/notification/notifications/user/${userId}`);
    return response.data;
  }
};
