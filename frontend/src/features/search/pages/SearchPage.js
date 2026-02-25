import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '../../../shared/services/api';
import { searchService } from '../services/searchService';
import { useAuth } from '../../auth/context/AuthContext';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stops, setStops] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionsIntermediateStops, setConnectionsIntermediateStops] = useState({});
  const [expandedConnections, setExpandedConnections] = useState({});
  const [searchForm, setSearchForm] = useState({
    fromStopId: '',
    toStopId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  const [searchInputs, setSearchInputs] = useState({
    fromStopName: '',
    toStopName: ''
  });
  const [showSuggestions, setShowSuggestions] = useState({
    from: false,
    to: false
  });


  // Load stops on component mount
  useEffect(() => {
    loadStops();
  }, []);

  // Check for pre-filled search data from cancelled ticket
  useEffect(() => {
    const fromStopId = localStorage.getItem('searchFromStop');
    const toStopId = localStorage.getItem('searchToStop');
    const fromStopName = localStorage.getItem('searchFromStopName');
    const toStopName = localStorage.getItem('searchToStopName');
    
    if (fromStopId && toStopId) {
      setSearchForm(prev => ({
        ...prev,
        fromStopId: fromStopId,
        toStopId: toStopId
      }));
      setSearchInputs({
        fromStopName: fromStopName || '',
        toStopName: toStopName || ''
      });
      
      // Clear localStorage after loading
      localStorage.removeItem('searchFromStop');
      localStorage.removeItem('searchToStop');
      localStorage.removeItem('searchFromStopName');
      localStorage.removeItem('searchToStopName');
    }
  }, []);

  // Update station names when stops are loaded and form has stopIds
  useEffect(() => {
    if (stops.length > 0 && searchForm.fromStopId && !searchInputs.fromStopName) {
      const fromStop = stops.find(s => s.stopId === searchForm.fromStopId);
      if (fromStop) {
        setSearchInputs(prev => ({ ...prev, fromStopName: fromStop.stopName }));
      }
    }
    if (stops.length > 0 && searchForm.toStopId && !searchInputs.toStopName) {
      const toStop = stops.find(s => s.stopId === searchForm.toStopId);
      if (toStop) {
        setSearchInputs(prev => ({ ...prev, toStopName: toStop.stopName }));
      }
    }
  }, [stops, searchForm.fromStopId, searchForm.toStopId, searchInputs.fromStopName, searchInputs.toStopName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.station-autocomplete')) {
        setShowSuggestions({ from: false, to: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadStops = async () => {
    try {
      setLoading(true);
      const stopsData = await searchService.getStopsInRouteOrder();
      setStops(stopsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.fromStopId || !searchForm.toStopId) {
      setError({ message: 'Proszę wybrać stację początkową i docelową' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const connectionsData = await searchService.searchConnections(
        searchForm.fromStopId,
        searchForm.toStopId,
        searchForm.date,
        searchForm.time
      );
      setConnections(connectionsData);
      
      // Load intermediate stops for each connection
      const stopsMap = {};
      for (const connection of connectionsData) {
        if (connection.tripId && connection.fromStopId && connection.toStopId) {
          try {
      const stops = await searchService.getIntermediateStops(
        connection.tripId,
              connection.fromStopId,
              connection.toStopId
            );
            stopsMap[connection.tripId] = stops;
          } catch (err) {
            console.error('Error loading intermediate stops:', err);
            stopsMap[connection.tripId] = [];
          }
        }
      }
      setConnectionsIntermediateStops(stopsMap);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStationInputChange = (field, value) => {
    setSearchInputs(prev => ({
      ...prev,
      [field]: value
    }));
    setShowSuggestions(prev => ({
      ...prev,
      [field === 'fromStopName' ? 'from' : 'to']: value.length > 0
    }));
  };

  const handleSelectStation = (field, stop) => {
    if (field === 'from') {
      setSearchForm(prev => ({ ...prev, fromStopId: stop.stopId }));
      setSearchInputs(prev => ({ ...prev, fromStopName: stop.stopName }));
      setShowSuggestions(prev => ({ ...prev, from: false }));
    } else {
      setSearchForm(prev => ({ ...prev, toStopId: stop.stopId }));
      setSearchInputs(prev => ({ ...prev, toStopName: stop.stopName }));
      setShowSuggestions(prev => ({ ...prev, to: false }));
    }
  };

  const getFilteredStops = (searchText) => {
    if (!searchText) return stops;
    return stops.filter(stop => 
      stop.stopName.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const adjustTime = (field, direction) => {
    const currentTime = searchForm[field];
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    let newMinutes = minutes + (direction === 'up' ? 1 : -1);
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (hours + 1) % 24;
    } else if (newMinutes < 0) {
      newMinutes = 59;
      newHours = hours === 0 ? 23 : hours - 1;
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    setSearchForm(prev => ({
      ...prev,
      [field]: newTime
    }));
  };

  const searchEarlierConnections = async () => {
    if (!searchForm.fromStopId || !searchForm.toStopId) return;
    
    // Adjust time by -30 minutes
    const [hours, minutes] = searchForm.time.split(':').map(Number);
    let newMinutes = minutes - 30;
    let newHours = hours;
    let dayOffset = 0;
    
    if (newMinutes < 0) {
      newMinutes += 60;
      newHours -= 1;
      if (newHours < 0) {
        newHours = 23;
        dayOffset = -1; // Previous day
      }
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    
    // Adjust date if needed
    let newDate = searchForm.date;
    if (dayOffset !== 0) {
      const currentDate = new Date(searchForm.date + 'T00:00:00');
      currentDate.setDate(currentDate.getDate() + dayOffset);
      newDate = currentDate.toISOString().split('T')[0];
    }
    
    setSearchForm(prev => ({ ...prev, time: newTime, date: newDate }));
    
    try {
      setLoading(true);
      setError(null);
      const connectionsData = await searchService.searchConnections(
        searchForm.fromStopId,
        searchForm.toStopId,
        newDate,
        newTime
      );
      setConnections(connectionsData);
      
      // Load intermediate stops for each connection
      const stopsMap = {};
      for (const connection of connectionsData) {
        if (connection.tripId && connection.fromStopId && connection.toStopId) {
          try {
            const stops = await searchService.getIntermediateStops(
              connection.tripId,
              connection.fromStopId,
              connection.toStopId
            );
            stopsMap[connection.tripId] = stops;
          } catch (err) {
            console.error('Error loading intermediate stops:', err);
            stopsMap[connection.tripId] = [];
          }
        }
      }
      setConnectionsIntermediateStops(stopsMap);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const searchLaterConnections = async () => {
    if (!searchForm.fromStopId || !searchForm.toStopId) return;
    
    // Adjust time by +30 minutes
    const [hours, minutes] = searchForm.time.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;
    let dayOffset = 0;
    
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours += 1;
      if (newHours >= 24) {
        newHours = 0;
        dayOffset = 1; // Next day
      }
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    
    // Adjust date if needed
    let newDate = searchForm.date;
    if (dayOffset !== 0) {
      const currentDate = new Date(searchForm.date + 'T00:00:00');
      currentDate.setDate(currentDate.getDate() + dayOffset);
      newDate = currentDate.toISOString().split('T')[0];
    }
    
    setSearchForm(prev => ({ ...prev, time: newTime, date: newDate }));
    
    try {
      setLoading(true);
      setError(null);
      const connectionsData = await searchService.searchConnections(
        searchForm.fromStopId,
        searchForm.toStopId,
        newDate,
        newTime
      );
      setConnections(connectionsData);
      
      // Load intermediate stops for each connection
      const stopsMap = {};
      for (const connection of connectionsData) {
        if (connection.tripId && connection.fromStopId && connection.toStopId) {
          try {
            const stops = await searchService.getIntermediateStops(
              connection.tripId,
              connection.fromStopId,
              connection.toStopId
            );
            stopsMap[connection.tripId] = stops;
          } catch (err) {
            console.error('Error loading intermediate stops:', err);
            stopsMap[connection.tripId] = [];
          }
        }
      }
      setConnectionsIntermediateStops(stopsMap);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };

  const toggleConnectionDetails = (index) => {
    setExpandedConnections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectTrain = (connection) => {
    // Add date to connection for ticket purchase
    const connectionWithDate = {
      ...connection,
      date: searchForm.date
      // fromStopId and toStopId should already be in connection from backend
    };
    // Store selected connection in localStorage for ticket purchase
    localStorage.setItem('selectedConnection', JSON.stringify(connectionWithDate));
    // Navigate to tickets page
    navigate('/tickets');
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
          Witaj w{' '}
          <span className="text-gray-900">Train</span>
          <span className="text-primary-600">set</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
           Wyszukuj połączenia, kupuj bilety
          i bądź na bieżąco z każdą zmianą w rozkładzie.
        </p>
      </div>

      {/* Search Section */}
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Wyszukiwanie połączenia</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="relative station-autocomplete">
              <label className="label">Stacja początkowa</label>
              <input
                type="text"
                value={searchInputs.fromStopName}
                onChange={(e) => handleStationInputChange('fromStopName', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, from: true }))}
                className="input-field"
                placeholder="Wybierz lub wpisz nazwę stacji"
                required
              />
              {showSuggestions.from && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredStops(searchInputs.fromStopName).length > 0 ? (
                    getFilteredStops(searchInputs.fromStopName).map((stop) => (
                      <div
                        key={stop.stopId}
                        onClick={() => handleSelectStation('from', stop)}
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors"
                      >
                        <span className="text-sm text-gray-900">{stop.stopName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Nie znaleziono stacji
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative station-autocomplete">
              <label className="label">Stacja docelowa</label>
              <input
                type="text"
                value={searchInputs.toStopName}
                onChange={(e) => handleStationInputChange('toStopName', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, to: true }))}
                className="input-field"
                placeholder="Wybierz lub wpisz nazwę stacji"
                required
              />
              {showSuggestions.to && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredStops(searchInputs.toStopName).length > 0 ? (
                    getFilteredStops(searchInputs.toStopName).map((stop) => (
                      <div
                        key={stop.stopId}
                        onClick={() => handleSelectStation('to', stop)}
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors"
                      >
                        <span className="text-sm text-gray-900">{stop.stopName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Nie znaleziono stacji
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Data podróży</label>
              <input
                type="date"
                name="date"
                value={searchForm.date}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Czas odjazdu</label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={searchForm.time}
                  onChange={handleInputChange}
                  className="input-field pr-12"
                  required
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => adjustTime('time', 'up')}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    title="Zwiększ czas o 1 minutę"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTime('time', 'down')}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    title="Zmniejsz czas o 1 minutę"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 text-lg py-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Wyszukiwanie...</span>
              </>
            ) : (
              <span>Wyszukaj Połączenia</span>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-700">{error.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Najbliższe Połączenia
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Left Arrow Button */}
            <button
              onClick={searchEarlierConnections}
              disabled={loading}
              className="flex-shrink-0 w-20 h-20 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:hover:scale-100"
              title="Wyszukaj połączenia 30 minut wcześniej"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Connections Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection, index) => (
              <div key={index} className={`card ${connection.cancelled ? 'border-red-300 bg-red-50' : connection.hasDelay ? 'border-orange-300 bg-orange-50' : ''}`}>
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div className="text-center">
                        <div className="text-base font-medium text-gray-500 mb-1">Odjazd</div>
                        <div className={`text-2xl font-bold ${connection.cancelled ? 'text-red-600' : connection.hasDelay ? 'text-orange-600' : 'text-gray-900'}`}>
                          {formatTime(connection.departureTime)}
                        </div>
                        <div className="text-base text-gray-700 font-medium mt-1">
                          {connection.fromStopName}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-base font-medium text-gray-500 mb-1">Przyjazd</div>
                        <div className={`text-2xl font-bold ${connection.cancelled ? 'text-red-600' : connection.hasDelay ? 'text-orange-600' : 'text-gray-900'}`}>
                          {formatTime(connection.arrivalTime)}
                        </div>
                        <div className="text-base text-gray-700 font-medium mt-1">
                          {connection.toStopName}
                        </div>
                      </div>
                    </div>
                    
                    
                    {connection.cancelled && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-red-600 font-medium text-sm">Odwołano</span>
                          </div>
                          {connection.cancellationReason && (
                            <div className="mt-1 flex items-center flex-wrap gap-2">
                              <span className="text-red-600 font-medium text-sm">Przyczyna:</span>
                              <span className="text-red-800 font-semibold text-sm">{connection.cancellationReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!connection.cancelled && connection.hasDelay && (
                      <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-orange-600 font-medium text-sm">Opóźnienie:</span>
                            <span className="text-orange-800 font-semibold text-sm">{connection.delayMinutes} min</span>
                          </div>
                          {connection.delayReason && (
                            <div className="mt-1 flex items-center flex-wrap gap-2">
                              <span className="text-orange-600 font-medium text-sm">Przyczyna:</span>
                              <span className="text-orange-800 font-semibold text-sm">{connection.delayReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expandable Details */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleConnectionDetails(index)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                        >
                          <span>{expandedConnections[index] ? 'Ukryj' : 'Pokaż'} przystanki na trasie</span>
                          <span>{expandedConnections[index] ? '▲' : '▼'}</span>
                        </button>
                      </div>
                      
                      {expandedConnections[index] && connectionsIntermediateStops[connection.tripId] && connectionsIntermediateStops[connection.tripId].length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="space-y-1.5">
                            {/* Start stop */}
                            <div className="flex items-center justify-between py-1 px-2 bg-green-50 rounded">
                              <span className="text-xs font-medium text-gray-800">{connection.fromStopName}</span>
                              <span className="text-xs font-semibold text-gray-900">{formatTime(connection.departureTime)}</span>
                            </div>
                            
                            {/* Intermediate stops */}
                            {connectionsIntermediateStops[connection.tripId].map((stop, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1 px-2 bg-blue-50 rounded">
                                <span className="text-xs text-gray-700">{stop.stopName}</span>
                                <span className="text-xs text-gray-600">{stop.arrivalTime ? formatTime(stop.arrivalTime) : '—'}</span>
                              </div>
                            ))}
                            
                            {/* End stop */}
                            <div className="flex items-center justify-between py-1 px-2 bg-green-50 rounded">
                              <span className="text-xs font-medium text-gray-800">{connection.toStopName}</span>
                              <span className="text-xs font-semibold text-gray-900">{formatTime(connection.arrivalTime)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!connection.cancelled && (!user || user.role !== 'ADMIN') && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
                      <button 
                        onClick={() => {
                          if (!user) {
                            // Przekieruj do logowania
                            navigate('/login');
                          } else {
                            handleSelectTrain(connection);
                          }
                        }}
                        className="btn-primary"
                      >
                        Kup Bilet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
            
            {/* Right Arrow Button */}
            <button
              onClick={searchLaterConnections}
              disabled={loading}
              className="flex-shrink-0 w-20 h-20 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:hover:scale-100"
              title="Wyszukaj połączenia 30 minut później"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {connections.length === 0 && !loading && !error && searchForm.fromStopId && searchForm.toStopId && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono połączeń</h3>
          <p className="text-gray-600">
            Spróbuj dostosować kryteria wyszukiwania lub wybrać inne stacje.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
