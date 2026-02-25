import axios from 'axios';

// Gateway API Base URL - all requests go through the gateway
const GATEWAY_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance for gateway
export const gatewayApi = axios.create({
  baseURL: GATEWAY_API_URL,
  withCredentials: true, // Enable cookies for session management
  headers: {
    'Content-Type': 'application/json',
  },
});

// Schedule API - routes through gateway
export const scheduleService = {
  // Get all stops
  getStops: async () => {
    const response = await gatewayApi.get('/schedule/stops');
    return response.data;
  },

  // Get stops in route order
  getStopsInRouteOrder: async () => {
    const response = await gatewayApi.get('/schedule/stops/route-order');
    return response.data;
  },

  // Get intermediate stops for a trip
  getIntermediateStops: async (tripId, fromStopId, toStopId) => {
    const response = await gatewayApi.get('/schedule/intermediate-stops', {
      params: { tripId, fromStopId, toStopId }
    });
    return response.data;
  },

  // Search connections
  searchConnections: async (fromStopId, toStopId, date, time) => {
    const response = await gatewayApi.get('/schedule/connections', {
      params: { fromStopId, toStopId, date, time }
    });
    return response.data;
  },

  // Get delays for a trip and stop
  getDelays: async (tripId, stopId) => {
    const response = await gatewayApi.get(`/schedule/delays/trip/${tripId}/stop/${stopId}`);
    return response.data;
  },

  // Get all delays
  getAllDelays: async () => {
    const response = await gatewayApi.get('/schedule/delays');
    return response.data;
  },

  // Get delay reasons
  getDelayReasons: async () => {
    const response = await gatewayApi.get('/schedule/delay-reasons');
    return response.data;
  },

  // Create delay
  createDelay: async (delayData) => {
    const response = await gatewayApi.post('/schedule/delays', delayData);
    return response.data;
  },

  // Update delay
  updateDelay: async (delayId, delayData) => {
    const response = await gatewayApi.put(`/schedule/delays/${delayId}`, delayData);
    return response.data;
  },

  // Resolve delay
  resolveDelay: async (delayId) => {
    const response = await gatewayApi.post(`/schedule/delays/${delayId}/resolve`);
    return response.data;
  },

  // Delete delay
  deleteDelay: async (delayId) => {
    const response = await gatewayApi.delete(`/schedule/delays/${delayId}`);
    return response.data;
  },

  // Adjust delay
  adjustDelay: async (delayId, minutes) => {
    const response = await gatewayApi.post(`/schedule/delays/${delayId}/adjust?minutes=${minutes}`);
    return response.data;
  },

  // Upload GTFS data
  uploadGtfs: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Important: Let the browser set Content-Type with boundary
    const response = await gatewayApi.post('/schedule/gtfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  // Get all trips grouped
  getTripsGrouped: async () => {
    const response = await gatewayApi.get('/schedule/trips/grouped');
    return response.data;
  },

  // Get all stops for a specific trip
  getTripStops: async (tripId, serviceId) => {
    const response = await gatewayApi.get(`/schedule/trips/${tripId}/stops`, {
      params: { serviceId }
    });
    return response.data;
  },

  // Cancellations
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

};

// Ticketing API - routes through gateway
export const ticketingService = {
  // Purchase ticket
  purchaseTicket: async (ticketData) => {
    const response = await gatewayApi.post('/ticketing/ticket/purchase', ticketData);
    return response.data;
  },

  // Get user tickets
  getUserTickets: async (userId) => {
    const response = await gatewayApi.get(`/ticketing/ticket/user/${userId}`);
    return response.data;
  },

  // Get ticket by number
  getTicketByNumber: async (ticketNumber) => {
    const response = await gatewayApi.get(`/ticketing/ticket/${ticketNumber}`);
    return response.data;
  },

  // Get tickets by trip
  getTicketsByTrip: async (tripId) => {
    const response = await gatewayApi.get(`/ticketing/ticket/trip/${tripId}`);
    return response.data;
  },

  // Get all tickets (admin only)
  getAllTickets: async () => {
    const response = await gatewayApi.get('/ticketing/ticket/all');
    return response.data;
  },

  // Get ticket delays
  getTicketDelays: async (ticketNumber) => {
    const response = await gatewayApi.get(`/ticketing/ticket/${ticketNumber}/delays`);
    return response.data;
  }
};

// User API - routes through gateway
export const userService = {
  // Get all users
  getUsers: async () => {
    const response = await gatewayApi.get('/user/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (userId) => {
    const response = await gatewayApi.get(`/user/users/${userId}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await gatewayApi.post('/user/users', userData);
    return response.data;
  },

  // Purchase ticket (through user service)
  purchaseTicket: async (ticketData) => {
    const response = await gatewayApi.post('/user/tickets', ticketData);
    return response.data;
  }
};

// Auth API - routes through gateway
export const authService = {
  // Register new user
  register: async (registerData) => {
    const response = await gatewayApi.post('/user/api/auth/register', registerData);
    return response.data;
  },

  // Login user
  login: async (loginData) => {
    const response = await gatewayApi.post('/user/api/auth/login', loginData);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await gatewayApi.post('/user/api/auth/logout', {});
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await gatewayApi.get('/user/api/auth/current-user');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await gatewayApi.put('/user/api/auth/update-profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await gatewayApi.put('/user/api/auth/change-password', passwordData);
    return response.data;
  }
};

// Notification API - routes through gateway
export const notificationService = {
  // Send notification
  sendNotification: async (notificationData) => {
    const response = await gatewayApi.post('/notification/notifications', notificationData);
    return response.data;
  },

  // Get user notifications
  getUserNotifications: async (userId) => {
    const response = await gatewayApi.get(`/notification/notifications/user/${userId}`);
    return response.data;
  }
};

// Error handling utility
// Mapowanie kodów HTTP na polskie komunikaty
const getHttpErrorMessage = (status) => {
  const errorMessages = {
    400: 'Nieprawidłowe dane w żądaniu',
    401: 'Brak autoryzacji. Zaloguj się ponownie',
    403: 'Brak dostępu do tego zasobu',
    404: 'Nie znaleziono żądanego zasobu',
    409: 'Konflikt danych. Operacja nie może być wykonana',
    422: 'Błąd walidacji danych',
    429: 'Zbyt wiele żądań. Spróbuj ponownie później',
    500: 'Błąd serwera. Spróbuj ponownie później',
    502: 'Błąd bramy sieciowej',
    503: 'Serwis tymczasowo niedostępny',
    504: 'Przekroczono czas oczekiwania na odpowiedź'
  };
  
  return errorMessages[status] || 'Wystąpił błąd podczas komunikacji z serwerem';
};

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data;
    const status = error.response.status;
    
    console.log('API Error Response:', data); // Debug log
    
    // Handle empty response with status 409 (Conflict) - cancelled trip
    if ((data === '' || data === null || data === undefined) && status === 409) {
      return {
        message: 'Wybrane połączenie zostało już odwołane!',
        status: status
      };
    }
    
    // Handle validation errors (field-specific errors)
    if (data && typeof data === 'object' && !data.message && !data.error) {
      // This is likely a validation error with field mappings
      const fieldErrors = Object.entries(data)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      return {
        message: fieldErrors || 'Błąd walidacji danych',
        status: status,
        validationErrors: data
      };
    }
    
    // Check for various error formats from backend
    let errorMessage = data?.message || data?.error || data?.msg;
    
    // If backend didn't provide a message, use string data or default HTTP message
    if (!errorMessage) {
      if (typeof data === 'string' && data.trim() !== '') {
        errorMessage = data;
      } else {
        errorMessage = getHttpErrorMessage(status);
      }
    }
    
    return {
      message: errorMessage,
      status: status
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Błąd sieci. Sprawdź połączenie internetowe',
      status: 0
    };
  } else {
    // Something else happened
    return {
      message: 'Wystąpił nieoczekiwany błąd',
      status: 0
    };
  }
};