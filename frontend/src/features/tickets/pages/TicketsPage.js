import React, { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../../../shared/services/api';
import { ticketsService } from '../services/ticketsService';
import { useAuth } from '../../auth/context/AuthContext';

const TicketsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [ticketType, setTicketType] = useState('NORMAL');
  const [ticketFilter, setTicketFilter] = useState('ACTIVE'); // 'ACTIVE' or 'INACTIVE'

  const loadIntermediateStops = useCallback(async (connection) => {
    if (connection.tripId && connection.fromStopId && connection.toStopId) {
      try {
        const stops = await ticketsService.getIntermediateStops(
          connection.tripId,
          connection.fromStopId,
          connection.toStopId
        );
        // Save intermediate stops to localStorage
        localStorage.setItem('intermediateStops', JSON.stringify(stops));
      } catch (err) {
        console.error('Error loading intermediate stops:', err);
      }
    }
  }, []);

  const loadSelectedConnection = useCallback(() => {
    const connection = localStorage.getItem('selectedConnection');
    const savedStops = localStorage.getItem('intermediateStops');
    
    if (connection) {
      const parsedConnection = JSON.parse(connection);
      setSelectedConnection(parsedConnection);
      
      // Try to load saved intermediate stops first
      if (savedStops) {
        try {
          JSON.parse(savedStops);
        } catch (err) {
          console.error('Error parsing saved intermediate stops:', err);
          // Fallback to loading from API
          loadIntermediateStops(parsedConnection);
        }
      } else {
        // Load intermediate stops from API if not saved
      loadIntermediateStops(parsedConnection);
      }
      
      // Don't clear the connection here - it will be cleared after successful purchase
    }
  }, [loadIntermediateStops]);

  // Load selected connection on component mount
  useEffect(() => {
    loadSelectedConnection();
  }, [loadSelectedConnection]);

  // Load user tickets only when logged in
  useEffect(() => {
    if (isAuthenticated) {
      loadUserTickets();
    }
  }, [isAuthenticated]);

  const handlePurchaseTicket = async () => {
    if (!selectedConnection) {
      setError({ message: 'Nie wybrano połączenia do zakupu' });
      return;
    }

    if (!user) {
      setError({ message: 'Musisz być zalogowany, aby kupić bilet' });
      return;
    }

    // Check if user is admin
    if (user.role === 'ADMIN') {
      setError({ message: 'Administratorzy nie mogą kupować biletów' });
      return;
    }

    // Validate that we have a user ID
    const userId = user.userId || user.id;
    if (!userId) {
      console.error('User object missing ID:', user);
      setError({ message: 'Błąd: Brak ID użytkownika. Spróbuj zalogować się ponownie.' });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Przygotuj dane do zakupu biletu
      const ticketData = {
        userId: userId,
        userEmail: user.email,
        tripId: selectedConnection.tripId,
        fromStopId: selectedConnection.fromStopId,
        toStopId: selectedConnection.toStopId,
        fromStopName: selectedConnection.fromStopName,
        toStopName: selectedConnection.toStopName,
        travelDate: selectedConnection.date || new Date().toISOString().split('T')[0],
        type: ticketType
      };

      console.log('Purchasing ticket with data:', ticketData);
      const purchasedTicket = await ticketsService.purchaseTicket(ticketData);
      console.log('Ticket purchased successfully:', purchasedTicket);

      setSuccess({ message: `Bilet zakupiony pomyślnie! Numer biletu: ${purchasedTicket.ticketNumber}` });
      
      // Wyczyść wybrane połączenie
      setSelectedConnection(null);
      setTicketType('NORMAL'); // Reset to default
      
      // Usuń dane z localStorage
      localStorage.removeItem('selectedConnection');
      localStorage.removeItem('intermediateStops');
      
      // Odśwież listę biletów użytkownika
      await loadUserTickets();
    } catch (err) {
      console.error('Ticket purchase error:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadUserTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError({ message: 'Nie znaleziono ID użytkownika' });
        return;
      }
      
      // Używamy ticketing service do pobrania biletów użytkownika
      const ticketsData = await ticketsService.getUserTickets(userId);
      setTickets(ticketsData || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const calculateTicketInfo = () => {
    if (!selectedConnection || !selectedConnection.departureTime || !selectedConnection.arrivalTime) {
      return { category: 'N/A', categoryName: 'N/A', price: 0, discountPrice: 0 };
    }

    // Parse times
    const [depHours, depMinutes] = selectedConnection.departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = selectedConnection.arrivalTime.split(':').map(Number);
    
    let durationMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
    
    // Handle overnight trips
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    let category, categoryName, price;
    
    if (durationMinutes <= 19) {
      category = 'SHORT';
      categoryName = 'I strefa czasowa (do 19 minut)';
      price = 4.00;
    } else if (durationMinutes <= 38) {
      category = 'MEDIUM';
      categoryName = 'II strefa czasowa (do 38 minut)';
      price = 6.50;
    } else {
      category = 'LONG';
      categoryName = 'III strefa czasowa (powyżej 38 minut)';
      price = 9.00;
    }

    const discountPrice = price * 0.5;

    return { category, categoryName, price, discountPrice, durationMinutes };
  };

  const getTicketTimeZone = (ticket) => {
    // Calculate duration from ticket times
    if (!ticket.departureTime || !ticket.arrivalTime) {
      return 'N/A';
    }

    const parseTime = (timeStr) => {
      if (typeof timeStr === 'string') {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      }
      return 0;
    };

    const depMinutes = parseTime(ticket.departureTime);
    const arrMinutes = parseTime(ticket.arrivalTime);
    
    let durationMinutes = arrMinutes - depMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    if (durationMinutes <= 19) {
      return 'I strefa (do 19 min czasu podróży)';
    } else if (durationMinutes <= 38) {
      return 'II strefa (do 38 min czasu podróży)';
    } else {
      return 'III strefa (powyżej 38 min czasu podróży)';
    }
  };

  return (
    <div className="space-y-8">
      {/* Selected Connection Display */}
      {selectedConnection && (
        <div className="space-y-4">
          <div className="card max-w-4xl mx-auto bg-primary-50 border-primary-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Wybrane Połączenie Kolejowe</h3>
              <p className="text-primary-700">Gotowy do zakupu biletu na to połączenie</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedConnection.departureTime?.substring(0, 5) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedConnection.fromStopName}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="flex-1 h-0.5 bg-gray-300"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedConnection.arrivalTime?.substring(0, 5) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedConnection.toStopName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel zakupu biletu */}
          {isAuthenticated && (
            <div className="card max-w-4xl mx-auto bg-white border-2 border-primary-200">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Zakup Biletu</h4>
                  <p className="text-gray-600">Potwierdź zakup biletu na wybrane połączenie</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Numer pociągu</div>
                    <div className="font-semibold text-gray-900">{selectedConnection.tripId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Data podróży</div>
                    <div className="font-semibold text-gray-900">
                      {selectedConnection.date ? new Date(selectedConnection.date).toLocaleDateString('pl-PL') : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Ticket Type Selection */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {/* Ticket Category Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          {calculateTicketInfo().categoryName}
                        </div>
                        <div className="text-xs text-blue-700 mt-0.5">
                          Czas podróży: ~{calculateTicketInfo().durationMinutes} minut
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Rodzaj biletu</label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="NORMAL">Bilet normalny</option>
                      <option value="DISCOUNT">Bilet ulgowy (50% zniżki)</option>
                    </select>
                  </div>

                  {/* Price Display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Cena biletu:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {ticketType === 'NORMAL' 
                          ? calculateTicketInfo().price.toFixed(2) 
                          : calculateTicketInfo().discountPrice.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                </div>

                {user && user.role === 'ADMIN' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <span className="text-sm text-amber-800 font-medium">Administratorzy nie mogą kupować biletów</span>
                  </div>
                ) : (
                <button
                  onClick={handlePurchaseTicket}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-lg flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      <span>Kupowanie biletu...</span>
                    </>
                  ) : (
                    <span>Kup bilet</span>
                  )}
                </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-green-700">{success.message}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-red-700">{error.message}</span>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {isAuthenticated && (
        <div className="space-y-4">
          {tickets.length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setTicketFilter('ACTIVE')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  ticketFilter === 'ACTIVE'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Aktywne bilety
              </button>
              <button
                onClick={() => setTicketFilter('INACTIVE')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  ticketFilter === 'INACTIVE'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Nieaktywne bilety
              </button>
            </div>
          )}
          
          {tickets.filter(ticket => 
            ticketFilter === 'ACTIVE' ? ticket.status === 'ACTIVE' : ticket.status !== 'ACTIVE'
          ).length > 0 ? (
            <div className="grid gap-4 max-w-3xl mx-auto">
              {tickets.filter(ticket => 
                ticketFilter === 'ACTIVE' ? ticket.status === 'ACTIVE' : ticket.status !== 'ACTIVE'
              ).map((ticket) => {
                // Determine if ticket has issues (delay or cancellation)
                const hasDelay = ticket.hasDelay && ticket.delayMinutes > 0;
                const isCancelled = ticket.cancelled || false; // Prepare for future backend support
                
                return (
                  <div 
                    key={ticket.ticketNumber} 
                    className={`card p-6 py-7 transition-all duration-200 ${
                      isCancelled 
                        ? 'border-2 border-red-300 bg-red-50 shadow-lg' 
                        : hasDelay 
                        ? 'border-2 border-orange-300 bg-orange-50 shadow-lg' 
                        : 'border-gray-200'
                    }`}
                  >
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Kod biletu:</span>
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {ticket.ticketNumber}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Od:</span> {ticket.fromStopName}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Do:</span> {ticket.toStopName}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Data:</span> {formatDate(ticket.travelDate)}
                          </div>
                          
                          {/* Scheduled times with delay indication */}
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Odjazd:</span>{' '}
                            {hasDelay && ticket.actualDepartureTime ? (
                              <>
                                <span className="line-through text-gray-400">
                                  {ticket.departureTime ? (typeof ticket.departureTime === 'string' ? ticket.departureTime.substring(0, 5) : ticket.departureTime) : 'N/A'}
                                </span>
                                {' '}
                                <span className="font-semibold text-orange-700">
                                  {typeof ticket.actualDepartureTime === 'string' ? ticket.actualDepartureTime.substring(0, 5) : ticket.actualDepartureTime}
                                </span>
                              </>
                            ) : (
                              <span>
                                {ticket.departureTime ? (typeof ticket.departureTime === 'string' ? ticket.departureTime.substring(0, 5) : ticket.departureTime) : 'N/A'}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Przyjazd:</span>{' '}
                            {hasDelay && ticket.actualArrivalTime ? (
                              <>
                                <span className="line-through text-gray-400">
                                  {ticket.arrivalTime ? (typeof ticket.arrivalTime === 'string' ? ticket.arrivalTime.substring(0, 5) : ticket.arrivalTime) : 'N/A'}
                                </span>
                                {' '}
                                <span className="font-semibold text-orange-700">
                                  {typeof ticket.actualArrivalTime === 'string' ? ticket.actualArrivalTime.substring(0, 5) : ticket.actualArrivalTime}
                                </span>
                              </>
                            ) : (
                              <span>
                                {ticket.arrivalTime ? (typeof ticket.arrivalTime === 'string' ? ticket.arrivalTime.substring(0, 5) : ticket.arrivalTime) : 'N/A'}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Rodzaj:</span>{' '}
                            {ticket.type === 'NORMAL' ? 'Bilet normalny' : 'Bilet ulgowy'}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Strefa czasowa:</span>{' '}
                            {getTicketTimeZone(ticket)}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-sm font-semibold ${
                              ticket.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {ticket.status === 'ACTIVE' ? 'Aktywny' : 'Nieaktywny'}
                            </span>
                          </div>

                          {/* Cancellation Details */}
                          {isCancelled && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                              <div>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="text-red-600 font-medium text-sm">Odwołano</span>
                                </div>
                                {ticket.cancellationReason && (
                                  <div className="mt-1 flex items-center flex-wrap gap-2">
                                    <span className="text-red-600 font-medium text-sm">Przyczyna:</span>
                                    <span className="text-red-800 font-semibold text-sm">{ticket.cancellationReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Delay Information */}
                          {hasDelay && !isCancelled && (
                            <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                              <div>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="text-orange-600 font-medium text-sm">Opóźnienie:</span>
                                  <span className="text-orange-800 font-semibold text-sm">{ticket.delayMinutes} min</span>
                                </div>
                                {ticket.delayReason && (
                                  <div className="mt-1 flex items-center flex-wrap gap-2">
                                    <span className="text-orange-600 font-medium text-sm">Przyczyna:</span>
                                    <span className="text-orange-800 font-semibold text-sm">{ticket.delayReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tickets.length > 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {ticketFilter === 'ACTIVE' ? 'Brak aktywnych biletów' : 'Brak nieaktywnych biletów'}
              </h3>
              {ticketFilter === 'ACTIVE' && (
                <p className="text-gray-600">
                  Nie masz aktualnie aktywnych biletów.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nie masz jeszcze biletów</h3>
              <p className="text-gray-600">
                Kup nowy bilet, aby rozpocząć.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
