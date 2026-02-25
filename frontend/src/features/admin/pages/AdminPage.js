import React, { useState, useEffect } from 'react';
import { handleApiError } from '../../../shared/services/api';
import { adminService } from '../services/adminService';
import DelayEditModal from '../components/DelayEditModal';

const AdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gtfsSuccess, setGtfsSuccess] = useState(null);
  const [delaySuccess, setDelaySuccess] = useState(null);
  const [delayError, setDelayError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expandedTripGroups, setExpandedTripGroups] = useState(new Set());
  const [tripVariantStops, setTripVariantStops] = useState({});
  const [tripsCurrentPage, setTripsCurrentPage] = useState(1);
  const tripsPerPage = 10;
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [delays, setDelays] = useState([]);
  const [delayForm, setDelayForm] = useState({
    tripId: '',
    stopId: '',
    delayMinutes: 0,
    reasonCode: '',
    delayType: 'DEPARTURE'
  });
  const [delayReasons, setDelayReasons] = useState([]);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [activeSection, setActiveSection] = useState('gtfs');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingDelay, setEditingDelay] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [delayToResolve, setDelayToResolve] = useState(null);
  const [isReinstateModalOpen, setIsReinstateModalOpen] = useState(false);
  const [cancellationToReinstate, setCancellationToReinstate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stopSearchTerm, setStopSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]);
  
  // Tickets filtering and pagination
  const [ticketFilters, setTicketFilters] = useState({
    ticketNumber: '',
    userId: '',
    tripId: '',
    travelDate: ''
  });
  const [ticketCurrentPage, setTicketCurrentPage] = useState(1);
  const ticketItemsPerPage = 50;
  
  // Users state
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    userId: '',
    email: '',
    role: ''
  });
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const userItemsPerPage = 50;

  // Track expanded trip groups
  const [expandedTrips, setExpandedTrips] = useState(new Set());

  // Cancellations state
  const [cancellations, setCancellations] = useState([]);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [cancellationForm, setCancellationForm] = useState({
    tripId: '',
    reasonCode: ''
  });
  const [cancellationsSuccess, setCancellationsSuccess] = useState(null);
  const [cancellationsError, setCancellationsError] = useState(null);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [cancellationSearchTerm, setCancellationSearchTerm] = useState('');
  const [expandedCancellationTrips, setExpandedCancellationTrips] = useState(new Set());

  // Load active upload info from backend
  useEffect(() => {
    const loadActiveUpload = async () => {
      try {
        const uploadInfo = await adminService.getActiveUpload();
        if (uploadInfo) {
          // Convert backend format to frontend format
          setUploadedFileName({
            name: uploadInfo.filename,
            uploadedAt: uploadInfo.uploadDate,
            startDate: uploadInfo.startDate,
            endDate: uploadInfo.endDate
          });
        }
      } catch (error) {
        // No active upload or error - do nothing
        console.log('No active GTFS upload found');
      }
    };
    loadActiveUpload();
  }, []);

  // Toggle trip group expansion
  const toggleTripExpansion = (tripId) => {
    setExpandedTrips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  // Toggle cancellation trip group expansion
  const toggleCancellationTripExpansion = (tripId) => {
    setExpandedCancellationTrips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  // Load delays, stops and trips on component mount
  useEffect(() => {
    loadDelays();
    loadStops();
    loadTrips();
    loadDelayReasons();
    loadSavedFormData();
  }, []);

  // Load tickets when tickets section is active
  useEffect(() => {
    if (activeSection === 'tickets' && tickets.length === 0) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Load users when users section is active
  useEffect(() => {
    if (activeSection === 'users' && users.length === 0) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Load cancellations when cancellations section is active
  useEffect(() => {
    if (activeSection === 'cancellations') {
      loadCancellations();
      loadCancellationReasons();
    }
  }, [activeSection]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminPageData', JSON.stringify({
      delayForm,
      showDelayForm,
      activeSection
    }));
  }, [delayForm, showDelayForm, activeSection]);

  // Load saved form data from localStorage
  const loadSavedFormData = () => {
    const savedData = localStorage.getItem('adminPageData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.delayForm) {
          setDelayForm(parsedData.delayForm);
        }
        if (parsedData.showDelayForm !== undefined) {
          setShowDelayForm(parsedData.showDelayForm);
        }
        if (parsedData.activeSection) {
          setActiveSection(parsedData.activeSection);
        }
      } catch (err) {
        console.error('Error loading saved form data:', err);
      }
    }
  };

  const loadDelays = async () => {
    try {
      setLoading(true);
      console.log('Loading delays...');
      const delaysData = await adminService.getAllDelays();
      console.log('Loaded delays:', delaysData);
      setDelays(delaysData);
    } catch (err) {
      console.error('Error loading delays:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadDelayReasons = async () => {
    try {
      console.log('Loading delay reasons...');
      const reasonsData = await adminService.getDelayReasons();
      console.log('Loaded delay reasons:', reasonsData);
      console.log('Number of reasons:', reasonsData ? reasonsData.length : 0);
      if (reasonsData && reasonsData.length > 0) {
        console.log('First reason:', reasonsData[0]);
      }
      setDelayReasons(reasonsData || []);
    } catch (err) {
      console.error('Error loading delay reasons:', err);
      console.error('Error details:', err.response?.data);
      setDelayReasons([]);
    }
  };

  const loadStops = async () => {
    try {
      setLoading(true);
      await adminService.getStopsInRouteOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      const tripsData = await adminService.getTripsGrouped();
      setTrips(tripsData);
    } catch (err) {
      console.error('Error loading trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTripGroupExpansion = async (tripGroup) => {
    const tripId = tripGroup.tripId;
    
    if (expandedTripGroups.has(tripId)) {
      setExpandedTripGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });
    } else {
      setExpandedTripGroups(prev => new Set(prev).add(tripId));
      
      // Load stops for all variants if not already loaded
      for (const variant of tripGroup.variants) {
        const key = `${variant.tripId}_${variant.serviceId}`;
        if (!tripVariantStops[key]) {
          try {
            const stops = await adminService.getTripStops(variant.tripId, variant.serviceId);
            setTripVariantStops(prev => ({
              ...prev,
              [key]: stops
            }));
          } catch (err) {
            console.error('Error loading trip stops:', err);
          }
        }
      }
    }
  };

  const getFilteredTrips = () => {
    if (!tripSearchTerm) return trips;
    return trips.filter(trip => 
      trip.tripId.toLowerCase().includes(tripSearchTerm.toLowerCase())
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setError(null);
    setGtfsSuccess(null);
    
    // Usuń informacje o poprzednio wgranym pliku gdy wybierasz nowy
    setUploadedFileName(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError({ message: 'Proszę wybrać plik do wgrania' });
      return;
    }

    // Sprawdź czy plik ma rozszerzenie .zip
    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setError({ message: 'Plik musi mieć rozszerzenie .zip' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGtfsSuccess(null);
      
      const fileName = selectedFile.name;
      await adminService.uploadGtfs(selectedFile);
      setGtfsSuccess({ message: 'Rozkład jazdy został pomyślnie wgrany!' });
      
      // Pobierz informacje o wgranym pliku z backendu
      try {
        const uploadInfo = await adminService.getActiveUpload();
        if (uploadInfo) {
          setUploadedFileName({
            name: uploadInfo.filename,
            uploadedAt: uploadInfo.uploadDate,
            startDate: uploadInfo.startDate,
            endDate: uploadInfo.endDate
          });
        }
      } catch (err) {
        // Fallback - użyj informacji z wybranego pliku
        setUploadedFileName({
          name: fileName,
          uploadedAt: new Date().toISOString()
        });
      }
      
      // Odśwież listę stacji i przejazdów
      loadStops();
      loadTrips();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelayFormChange = (e) => {
    const { name, value } = e.target;
    setDelayForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDelay = async (e) => {
    e.preventDefault();
    if (!delayForm.tripId || !delayForm.stopId) {
      setDelayError({ message: 'Proszę wypełnić ID trasy i ID stacji' });
      return;
    }

    try {
      setLoading(true);
      setDelayError(null);
      setDelaySuccess(null);
      
      await adminService.createDelay(delayForm);
      
      setDelaySuccess({ message: 'Opóźnienie zostało utworzone!' });
      setDelayForm({
        tripId: '',
        stopId: '',
        delayMinutes: 0,
        reasonCode: '',
        delayType: 'DEPARTURE'
      });
      setShowDelayForm(false);
      loadDelays();
    } catch (err) {
      setDelayError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDelay = (delayId) => {
    setDelayToResolve(delayId);
    setIsResolveModalOpen(true);
  };

  const confirmResolveDelay = async () => {
    if (!delayToResolve) return;
    
    try {
      setLoading(true);
      setError(null);
      setDelaySuccess(null);
      
      await adminService.resolveDelay(delayToResolve);
      
      setDelaySuccess({ message: 'Opóźnienie zostało rozwiązane!' });
      setIsResolveModalOpen(false);
      setDelayToResolve(null);
      loadDelays();
    } catch (err) {
      setError(handleApiError(err));
      setIsResolveModalOpen(false);
      setDelayToResolve(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelResolveDelay = () => {
    setIsResolveModalOpen(false);
    setDelayToResolve(null);
  };

  const handleEditDelay = (delay) => {
    setEditingDelay(delay);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDelay(null);
  };

  const handleSaveDelay = () => {
    loadDelays();
    setDelaySuccess({ message: 'Opóźnienie zostało zaktualizowane!' });
  };

  // Filter and paginate delays
  const getFilteredDelays = () => {
    let filtered = delays;

    // Filter by trip ID
    if (searchTerm) {
      filtered = filtered.filter(delay => 
        delay.tripId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by stop ID
    if (stopSearchTerm) {
      filtered = filtered.filter(delay => 
        delay.stopId?.toLowerCase().includes(stopSearchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      console.log('Loading all tickets...');
      const ticketsData = await adminService.getAllTickets();
      console.log('Loaded tickets:', ticketsData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTicketFilterChange = (e) => {
    const { name, value } = e.target;
    setTicketFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setTicketCurrentPage(1); // Reset to first page when filters change
  };

  const resetTicketFilters = () => {
    setTicketFilters({
      ticketNumber: '',
      userId: '',
      tripId: '',
      travelDate: ''
    });
    setTicketCurrentPage(1);
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const matchesTicketNumber = !ticketFilters.ticketNumber || 
        ticket.ticketNumber.toLowerCase().includes(ticketFilters.ticketNumber.toLowerCase());
      
      const matchesUserId = !ticketFilters.userId || 
        ticket.userId.toString().includes(ticketFilters.userId);
      
      const matchesTripId = !ticketFilters.tripId || 
        ticket.tripId.toLowerCase().includes(ticketFilters.tripId.toLowerCase());
      
      const matchesTravelDate = !ticketFilters.travelDate || 
        (ticket.travelDate && ticket.travelDate.toString().includes(ticketFilters.travelDate));

      return matchesTicketNumber && matchesUserId && matchesTripId && matchesTravelDate;
    });
  };

  const getPaginatedTickets = () => {
    const filtered = getFilteredTickets();
    const startIndex = (ticketCurrentPage - 1) * ticketItemsPerPage;
    return filtered.slice(startIndex, startIndex + ticketItemsPerPage);
  };

  const ticketTotalPages = Math.ceil(getFilteredTickets().length / ticketItemsPerPage);

  // Cancellation functions
  const loadCancellations = async () => {
    try {
      setLoading(true);
      const cancellationsData = await adminService.getAllCancellations();
      setCancellations(cancellationsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCancellationReasons = async () => {
    try {
      const reasons = await adminService.getCancellationReasons();
      console.log('Loaded cancellation reasons:', reasons);
      console.log('Type of reasons:', typeof reasons);
      console.log('Is array:', Array.isArray(reasons));
      if (reasons && reasons.length > 0) {
        console.log('First reason:', reasons[0]);
        console.log('First reason type:', typeof reasons[0]);
        console.log('First reason keys:', Object.keys(reasons[0]));
      }
      setCancellationReasons(reasons);
    } catch (err) {
      console.error('Error loading cancellation reasons', err);
    }
  };

  const handleCancellationFormChange = (e) => {
    const { name, value } = e.target;
    setCancellationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancellationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setCancellationsError(null);
      setCancellationsSuccess(null);

      const cancellationData = {
        tripId: cancellationForm.tripId,
        reasonCode: cancellationForm.reasonCode || undefined
      };

      await adminService.createCancellation(cancellationData);
      
      setCancellationsSuccess({ message: 'Odwołanie trasy zostało utworzone!' });
      setCancellationForm({ tripId: '', reasonCode: '' });
      setShowCancellationForm(false);
      loadCancellations();
    } catch (err) {
      setCancellationsError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReinstateCancellation = (cancellation) => {
    setCancellationToReinstate(cancellation);
    setIsReinstateModalOpen(true);
  };

  const confirmReinstateCancellation = async () => {
    if (!cancellationToReinstate) return;

    try {
      setLoading(true);
      setError(null);
      setCancellationsSuccess(null);
      setIsReinstateModalOpen(false);
      
      await adminService.reinstateCancellation(cancellationToReinstate.id);
      
      setCancellationsSuccess({ message: 'Pociąg został przywrócony do rozkładu!' });
      loadCancellations();
      setCancellationToReinstate(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const cancelReinstateCancellation = () => {
    setIsReinstateModalOpen(false);
    setCancellationToReinstate(null);
  };

  const getFilteredCancellations = () => {
    // Only show active cancellations
    let filtered = cancellations.filter(cancellation => cancellation.status === 'ACTIVE');

    // Search filter
    if (cancellationSearchTerm) {
      filtered = filtered.filter(cancellation =>
        (cancellation.tripId || '').toLowerCase().includes(cancellationSearchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Users functions
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUserFilterChange = (e) => {
    const { name, value } = e.target;
    setUserFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setUserCurrentPage(1);
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      // Only show users, not admins
      if (user.role === 'ADMIN') return false;
      
      const matchesUserId = !userFilters.userId || 
        user.id.toString().includes(userFilters.userId);
      const matchesEmail = !userFilters.email || 
        user.email.toLowerCase().includes(userFilters.email.toLowerCase());
      const matchesRole = !userFilters.role || 
        user.role === userFilters.role;

      return matchesUserId && matchesEmail && matchesRole;
    });
  };

  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredUsers();
    const startIndex = (userCurrentPage - 1) * userItemsPerPage;
    const endIndex = startIndex + userItemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const userTotalPages = Math.ceil(getFilteredUsers().length / userItemsPerPage);


  const adminSections = [
    {
      id: 'gtfs',
      name: 'Rozkład Jazdy'
    },
    {
      id: 'delays',
      name: 'Opóźnienia'
    },
    {
      id: 'cancellations',
      name: 'Odwołania'
    },
    {
      id: 'tickets',
      name: 'Bilety'
    },
    {
      id: 'users',
      name: 'Użytkownicy'
    }
  ];

  const renderGTFSSection = () => (
    <div className="space-y-8">
      {/* Upload GTFS Section */}
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Wgraj Rozkład Jazdy</h2>
          <p className="text-gray-600">Wgraj plik GTFS (.zip) aby zaktualizować rozkład jazdy</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="label">Wybierz plik GTFS</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="gtfs-file"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Wybierz plik</span>
                    <input
                      id="gtfs-file"
                      name="gtfs-file"
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">lub przeciągnij tutaj</p>
                </div>
                <p className="text-xs text-gray-500">ZIP do 100MB</p>
              </div>
            </div>
          </div>

          {(selectedFile || uploadedFileName) && (
            <div className={`rounded-lg p-4 ${uploadedFileName ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                <div>
                    <p className={`text-sm font-medium ${uploadedFileName ? 'text-green-900' : 'text-blue-900'}`}>
                      {uploadedFileName ? uploadedFileName.name : selectedFile?.name}
                    </p>
                    {!uploadedFileName && selectedFile && (
                      <p className="text-sm text-blue-700">
                        {formatFileSize(selectedFile?.size || 0)}
                      </p>
                    )}
                    {uploadedFileName && uploadedFileName.uploadedAt && (
                      <>
                        <p className="text-xs text-green-700 mt-1">
                          Wgrano: {new Date(uploadedFileName.uploadedAt).toLocaleDateString('pl-PL')}
                        </p>
                        {uploadedFileName.startDate && uploadedFileName.endDate && (
                          <p className="text-xs text-green-700 mt-1">
                            Okres ważności: {new Date(uploadedFileName.startDate).toLocaleDateString('pl-PL')} - {new Date(uploadedFileName.endDate).toLocaleDateString('pl-PL')}
                          </p>
                        )}
                      </>
                    )}
                </div>
                </div>
                {!uploadedFileName && selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    const fileInput = document.getElementById('gtfs-file');
                    if (fileInput) {
                      fileInput.value = '';
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Usuń
                </button>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedFile || uploadedFileName}
            className="btn-primary w-full flex items-center justify-center space-x-2 text-lg py-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Wgrywanie...</span>
              </>
            ) : (
              <span>Wgraj Rozkład Jazdy</span>
            )}
          </button>
        </form>

        {/* Error Message */}
        {/* Success Message */}
        {gtfsSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">{gtfsSuccess.message}</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instrukcje</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
            <p>Przygotuj plik GTFS w formacie ZIP zawierający wszystkie wymagane pliki (stops.txt, routes.txt, trips.txt, stop_times.txt, calendar.txt lub calendar_dates.txt)</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
            <p>Kliknij "Wybierz plik" i wybierz przygotowany plik ZIP</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
            <p>Kliknij "Wgraj Rozkład Jazdy" aby rozpocząć proces importu</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
            <p>Poczekaj na zakończenie procesu - może to potrwać kilka minut w zależności od rozmiaru danych</p>
          </div>
        </div>
      </div>

      {/* Wgrane Przejazdy */}
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Wgrane Przejazdy</h2>
          <p className="text-gray-600">Lista wszystkich przejazdów dostępnych w systemie ({trips.length})</p>
        </div>

        {/* Search Filter */}
        {trips.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID trasy
            </label>
            <input
              type="text"
              placeholder=""
              value={tripSearchTerm}
              onChange={(e) => {
                setTripSearchTerm(e.target.value);
                setTripsCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Header */}
        {trips.length > 0 && (
          <div className="bg-gray-100 px-4 py-2 rounded-t-lg border border-gray-200 grid grid-cols-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <span className="text-left">ID trasy</span>
            <span className="text-center">Kierunek</span>
            <div className="flex items-center justify-end space-x-4">
              <span>Odjazd</span>
              <span>Przyjazd</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3 mt-3">
          {trips.length > 0 ? (
            <>
            {getFilteredTrips().slice((tripsCurrentPage - 1) * tripsPerPage, tripsCurrentPage * tripsPerPage).map((tripGroup) => (
              <div key={tripGroup.tripId} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleTripGroupExpansion(tripGroup)}
                  className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-3 items-center text-sm">
                    <span className="font-medium text-gray-900 text-left">{tripGroup.tripId}</span>
                    <div className="flex items-center justify-center space-x-2 text-gray-700">
                      <span>{tripGroup.variants[0].firstStopName}</span>
                      <span className="text-gray-400">→</span>
                      <span>{tripGroup.variants[0].lastStopName}</span>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                      <span className="font-medium text-gray-900">{tripGroup.variants[0].firstStopDepartureTime}</span>
                      <span className="font-medium text-gray-900">{tripGroup.variants[0].lastStopArrivalTime}</span>
                    </div>
                  </div>
                </button>

                {expandedTripGroups.has(tripGroup.tripId) && (
                  <div className="bg-gray-50 border-t border-gray-200 p-3">
                    {(() => {
                      const variant = tripGroup.variants[0];
                      const variantKey = `${variant.tripId}_${variant.serviceId}`;
                      const variantStops = tripVariantStops[variantKey] || [];
                      
                      return variantStops.length > 0 ? (
                        <div className="space-y-1">
                          {variantStops.map((stop, stopIdx) => (
                            <div key={stopIdx} className="flex items-center justify-between text-xs py-2 px-3 bg-white hover:bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400 font-mono w-6 text-right">{stopIdx + 1}.</span>
                                <span className="font-medium text-gray-900">{stop.stopName}</span>
                                <span className="text-gray-500 text-xs">({stop.stopId})</span>
                              </div>
                              <div className="text-gray-600 font-medium">
                                {stop.departureTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
                        <div className="text-center text-xs text-gray-500 py-2">
                          Ładowanie przystanków...
              </div>
                      );
                    })()}
            </div>
          )}
        </div>
            ))}

            {/* Pagination */}
            {(() => {
              const filteredTrips = getFilteredTrips();
              const totalPages = Math.ceil(filteredTrips.length / tripsPerPage);
              return filteredTrips.length > tripsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setTripsCurrentPage(Math.max(1, tripsCurrentPage - 1))}
                      disabled={tripsCurrentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Poprzednia
                    </button>
                    <button
                      onClick={() => setTripsCurrentPage(Math.min(totalPages, tripsCurrentPage + 1))}
                      disabled={tripsCurrentPage === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Następna
                    </button>
      </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Strona <span className="font-medium">{tripsCurrentPage}</span> z{' '}
                        <span className="font-medium">{totalPages}</span>
                        {' '}({filteredTrips.length} {filteredTrips.length === 1 ? 'przejazd' : filteredTrips.length < 5 ? 'przejazdy' : 'przejazdów'})
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setTripsCurrentPage(Math.max(1, tripsCurrentPage - 1))}
                          disabled={tripsCurrentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                        >
                          <span className="sr-only">Poprzednia</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          
                          if (totalPages <= maxVisible + 2) {
                            // Show all pages if there aren't many
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Always show first page
                            pages.push(1);
                            
                            // Calculate range around current page
                            let start = Math.max(2, tripsCurrentPage - 1);
                            let end = Math.min(totalPages - 1, tripsCurrentPage + 1);
                            
                            // Adjust if at beginning
                            if (tripsCurrentPage <= 3) {
                              start = 2;
                              end = Math.min(maxVisible, totalPages - 1);
                            }
                            
                            // Adjust if at end
                            if (tripsCurrentPage >= totalPages - 2) {
                              start = Math.max(2, totalPages - maxVisible + 1);
                              end = totalPages - 1;
                            }
                            
                            // Add ellipsis if needed
                            if (start > 2) {
                              pages.push('...');
                            }
                            
                            // Add middle pages
                            for (let i = start; i <= end; i++) {
                              pages.push(i);
                            }
                            
                            // Add ellipsis if needed
                            if (end < totalPages - 1) {
                              pages.push('...');
                            }
                            
                            // Always show last page
                            pages.push(totalPages);
                          }
                          
                          return pages.map((page, idx) => {
                            if (page === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 bg-white">
                                  ...
                                </span>
                              );
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => setTripsCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  page === tripsCurrentPage
                                    ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}
                        <button
                          onClick={() => setTripsCurrentPage(Math.min(totalPages, tripsCurrentPage + 1))}
                          disabled={tripsCurrentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                        >
                          <span className="sr-only">Następna</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
          </div>
          </div>
          </div>
              );
            })()}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Brak wgranych przejazdów. Wgraj plik GTFS aby zobaczyć dostępne przejazdy.</p>
          </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDelaysSection = () => (
    <div className="space-y-8">
      {/* Delay Management */}
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Zarządzanie opóźnieniami
          </h3>
          <button
            onClick={() => setShowDelayForm(!showDelayForm)}
            className="btn-primary"
          >
            {showDelayForm ? 'Anuluj' : 'Dodaj opóźnienie'}
          </button>
        </div>

        {/* Success Message */}
        {delaySuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">{delaySuccess.message}</span>
          </div>
        )}
        
        {delayError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-700">{delayError.message}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-700">{error.message || error}</span>
          </div>
        )}

        {/* Legend - Kody przyczyn */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Kody przyczyn opóźnień:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {delayReasons.map((reason) => (
              <div key={reason.code}>
                <span className="font-semibold">{reason.code}</span> - {reason.description}
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID trasy
              </label>
              <input
                type="text"
                placeholder=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID stacji
              </label>
              <input
                type="text"
                placeholder=""
                value={stopSearchTerm}
                onChange={(e) => setStopSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Create Delay Form */}
        {showDelayForm && (
          <form onSubmit={handleCreateDelay} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900">Utwórz Nowe Opóźnienie</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">ID Trasy</label>
                <input
                  type="text"
                  name="tripId"
                  value={delayForm.tripId}
                  onChange={handleDelayFormChange}
                  className="input-field"
                  placeholder="np. TR001"
                  required
                />
              </div>
              <div>
                <label className="label">ID Stacji</label>
                <input
                  type="text"
                  name="stopId"
                  value={delayForm.stopId}
                  onChange={handleDelayFormChange}
                  className="input-field"
                  placeholder="np. ST001"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Opóźnienie (minuty)</label>
                <input
                  type="number"
                  name="delayMinutes"
                  value={delayForm.delayMinutes}
                  onChange={handleDelayFormChange}
                  className="input-field"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="label">Typ Opóźnienia</label>
                <select
                  name="delayType"
                  value={delayForm.delayType}
                  onChange={handleDelayFormChange}
                  className="input-field"
                >
                  <option value="DEPARTURE">Odjazd</option>
                  <option value="ARRIVAL">Przyjazd</option>
                  <option value="BOTH">Oba</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Kod Przyczyny</label>
              <select
                name="reasonCode"
                value={delayForm.reasonCode}
                onChange={handleDelayFormChange}
                className="input-field"
              >
                <option value="">Wybierz kod przyczyny</option>
                {delayReasons.length > 0 ? (
                  delayReasons.map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.code} - {reason.description}
                    </option>
                  ))
                ) : (
                  <option disabled>Ładowanie przyczyn...</option>
                )}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Tworzenie...' : 'Utwórz Opóźnienie'}
            </button>
          </form>
        )}

        {/* Delays List */}
        <div className="space-y-4">
          {getFilteredDelays().length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                ID trasy
              </div>
              {Object.entries(
                getFilteredDelays().reduce((groups, delay) => {
                  const tripId = delay.tripId || 'Unknown';
                  if (!groups[tripId]) {
                    groups[tripId] = [];
                  }
                  groups[tripId].push(delay);
                  return groups;
                }, {})
              )
                .sort(([a], [b]) => a.localeCompare(b)) // Sortuj grupy alfabetycznie według tripId
                .map(([tripId, tripDelays]) => {
                  const isExpanded = expandedTrips.has(tripId);
                  
                  return (
                    <div key={tripId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleTripExpansion(tripId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                    <div className="flex items-center space-x-3">
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                      <h3 className="text-lg font-semibold text-gray-900">{tripId}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {tripDelays.length} {tripDelays.length === 1 ? 'opóźnienie' : 'opóźnień'}
                      </span>
                    </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Header Bar */}
                          <div className="bg-gray-100 rounded-lg border border-gray-200 mb-3">
                            <div className="grid grid-cols-[150px_150px_200px_1fr_150px] items-center gap-3 py-2 pl-3 pr-3">
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID trasy</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider -ml-2">ID stacji</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider -ml-2">Opóźnienie</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider -ml-2">Powód</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Akcje</span>
                            </div>
                          </div>
                          <div className="grid gap-3">
                      {tripDelays.map((delay, index) => (
                          <div key={delay.id || index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            <div className="grid grid-cols-[150px_150px_200px_1fr_150px] items-center gap-3">
                              {/* ID trasy */}
                              <div className="text-sm font-medium text-gray-900">
                                {delay.tripId}
                              </div>
                              
                              {/* ID stacji */}
                              <div className="text-sm font-medium text-gray-900 -ml-2">
                                {delay.stopId}
                              </div>
                              
                              {/* Opóźnienie */}
                              <div className="text-sm text-gray-700 -ml-2">
                                {delay.delayMinutes} min
                              </div>
                              
                              {/* Powód */}
                              <div className="text-sm text-gray-700 -ml-2">
                                {delay.reasonCode || '-'}
                              </div>
                              
                              {/* Akcje */}
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDelay(delay);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                                  title="Edytuj opóźnienie"
                                >
                                  Edytuj
                                </button>
                                {delay.status === 'ACTIVE' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResolveDelay(delay.id);
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                                    title="Rozwiąż opóźnienie"
                                  >
                                    Rozwiąż
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Brak opóźnień
              </h4>
              <p className="text-gray-600">
                {searchTerm || stopSearchTerm
                  ? 'Obecnie nie ma opóźnień spełniających kryteria wyszukiwania.'
                  : 'Obecnie nie ma opóźnień w bazie danych.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delay Edit Modal */}
      <DelayEditModal
        delay={editingDelay}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveDelay}
      />
              </div>
  );

  const renderCancellationsSection = () => (
    <div className="space-y-8">
      <div className="card max-w-4xl mx-auto">
        {/* Add Cancellation Button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Odwołania pociągów</h3>
                <button
            onClick={() => setShowCancellationForm(!showCancellationForm)}
            className={`btn-${showCancellationForm ? 'secondary' : 'primary'}`}
                >
            {showCancellationForm ? 'Anuluj' : 'Dodaj odwołanie'}
                </button>
        </div>

        {/* Success/Error Messages */}
        {/* Cancellations Success Message */}
        {cancellationsSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">{cancellationsSuccess.message}</span>
          </div>
        )}
        
        {/* Cancellations Error Message */}
        {cancellationsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-700">{cancellationsError.message}</span>
          </div>
        )}

        {/* Legend - Kody przyczyn */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Kody przyczyn odwołań:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {cancellationReasons.map((reason) => (
              <div key={reason.code}>
                <span className="font-semibold">{reason.code}</span> - {reason.description}
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Form */}
        {showCancellationForm && (
          <form onSubmit={handleCancellationSubmit} className="space-y-4 mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="label">ID Trasy</label>
              <input
                type="text"
                name="tripId"
                value={cancellationForm.tripId}
                onChange={handleCancellationFormChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Kod przyczyny</label>
              <select
                name="reasonCode"
                value={cancellationForm.reasonCode}
                onChange={handleCancellationFormChange}
                className="input-field"
              >
                <option value="">Wybierz kod przyczyny</option>
                {cancellationReasons.map((r) => (
                  <option key={r.code} value={r.code}>{r.code} - {r.description}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Tworzenie...' : 'Utwórz Odwołanie'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancellationForm(false)}
                className="btn-secondary"
              >
                Anuluj
              </button>
            </div>
          </form>
        )}

        {/* Search Controls */}
        <div className="mb-6">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID trasy
            </label>
            <input
              type="text"
              placeholder=""
              value={cancellationSearchTerm}
              onChange={(e) => setCancellationSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cancellations List */}
        <div className="space-y-4">
          {getFilteredCancellations().length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                ID trasy
              </div>
              {Object.entries(
                getFilteredCancellations().reduce((groups, cancellation) => {
                  const tripId = cancellation.tripId || 'Unknown';
                  if (!groups[tripId]) {
                    groups[tripId] = [];
                  }
                  groups[tripId].push(cancellation);
                  return groups;
                }, {})
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([tripId, tripCancellations]) => {
                  const isExpanded = expandedCancellationTrips.has(tripId);
                  
                  return (
                    <div key={tripId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleCancellationTripExpansion(tripId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-900">{tripId}</h3>
                        </div>
                    </button>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Header Bar */}
                          <div className="bg-gray-100 rounded-lg border border-gray-200 mb-3">
                            <div className="grid grid-cols-[150px_1fr_150px] items-center gap-3 py-2 pl-3 pr-3">
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID trasy</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider -ml-2">Powód</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Akcje</span>
                            </div>
                          </div>
                          <div className="grid gap-3">
                            {tripCancellations
                              .sort((a, b) => {
                                if (a.status !== b.status) {
                                  if (a.status === 'ACTIVE') return -1;
                                  if (b.status === 'ACTIVE') return 1;
                                }
                                return new Date(b.createdAt) - new Date(a.createdAt);
                              })
                              .map((cancellation, index) => (
                                <div key={cancellation.id || index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                  <div className="grid grid-cols-[150px_1fr_150px] items-center gap-3">
                                    {/* ID trasy */}
                                    <div className="text-sm font-medium text-gray-900">
                                      {cancellation.tripId}
                                    </div>
                                    
                                    {/* Powód (kod) */}
                                    <div className="text-sm text-gray-700 -ml-2">
                                      {cancellation.reasonCode || '-'}
                                    </div>
                                    
                                    {/* Akcje */}
                                    <div className="flex items-center justify-center">
                                      {cancellation.status === 'ACTIVE' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReinstateCancellation(cancellation);
                                          }}
                                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                                          title="Przywróć pociąg"
                                        >
                                          Przywróć
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Brak odwołań
              </h4>
              <p className="text-gray-600">
                {cancellationSearchTerm
                  ? 'Obecnie nie ma odwołań spełniających kryteria wyszukiwania.'
                  : 'Obecnie nie ma odwołań w bazie danych.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  const renderTicketsSection = () => (
    <div className="space-y-8">
        {/* Tickets Management */}
        <div className="card max-w-6xl mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Lista biletów
            </h3>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filter by Ticket Number */}
                <div>
                  <label className="label">Numer biletu</label>
                  <input
                    type="text"
                    name="ticketNumber"
                    value={ticketFilters.ticketNumber}
                    onChange={handleTicketFilterChange}
                    className="input-field w-full"
                    placeholder=""
                  />
                </div>

                {/* Filter by User ID */}
                <div>
                  <label className="label">ID użytkownika</label>
                  <input
                    type="text"
                    name="userId"
                    value={ticketFilters.userId}
                    onChange={handleTicketFilterChange}
                    className="input-field w-full"
                    placeholder=""
                  />
                </div>

                {/* Filter by Trip ID */}
                <div>
                  <label className="label">ID trasy</label>
                  <input
                    type="text"
                    name="tripId"
                    value={ticketFilters.tripId}
                    onChange={handleTicketFilterChange}
                    className="input-field w-full"
                    placeholder=""
                  />
                </div>

                {/* Filter by Travel Date */}
                <div>
                  <label className="label">Data podróży</label>
                  <input
                    type="date"
                    name="travelDate"
                    value={ticketFilters.travelDate}
                    onChange={handleTicketFilterChange}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={resetTicketFilters}
                  className="btn-secondary"
                >
                  Wyczyść filtry
                </button>
              </div>
            </div>

          {/* Error Message */}
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
          ) : tickets.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                    {/* Sticky Header */}
                    <div className="bg-gray-100 rounded-lg border border-gray-200 mb-3 sticky top-0 z-10">
                      <div className="grid grid-cols-6 items-center gap-4 px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Numer biletu</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Typ</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID użytkownika</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID trasy</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Data podróży</span>
                      </div>
                    </div>
                    
                    {/* Tickets List */}
                    <div className="space-y-2">
                      {getPaginatedTickets().map((ticket) => (
                        <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-6 items-center gap-4 px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full w-fit ${
                              ticket.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status === 'ACTIVE' ? 'Aktywny' : ticket.status}
                            </span>
                            <span className="text-sm text-gray-700">
                              {ticket.type === 'DISCOUNT' ? 'Ulgowy' : 'Normalny'}
                            </span>
                            <span className="text-sm text-gray-900">
                              {ticket.userId}
                            </span>
                            <span className="text-sm text-gray-900">
                              {ticket.tripId}
                            </span>
                            <span className="text-sm text-gray-900">
                              {ticket.travelDate ? new Date(ticket.travelDate).toLocaleDateString('pl-PL') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
      </div>

              {/* Pagination */}
              {ticketTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Strona <span className="font-medium">{ticketCurrentPage}</span> z <span className="font-medium">{ticketTotalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTicketCurrentPage(1)}
                      disabled={ticketCurrentPage === 1}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Pierwsza strona"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setTicketCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={ticketCurrentPage === 1}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Poprzednia strona"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setTicketCurrentPage(prev => Math.min(ticketTotalPages, prev + 1))}
                      disabled={ticketCurrentPage === ticketTotalPages}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Następna strona"
                    >
                      →
                    </button>
                    <button
                      onClick={() => setTicketCurrentPage(ticketTotalPages)}
                      disabled={ticketCurrentPage === ticketTotalPages}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Ostatnia strona"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Brak biletów</h4>
              <p className="text-gray-600">
                {ticketFilters.ticketNumber || ticketFilters.userId || ticketFilters.tripId || ticketFilters.travelDate
                  ? 'Obecnie nie ma biletów spełniających kryteria wyszukiwania.'
                  : 'Obecnie nie ma biletów w bazie danych.'}
              </p>
            </div>
          )}
        </div>
    </div>
  );

  const renderUsersSection = () => (
    <div className="space-y-8">
        {/* Users Management */}
        <div className="card max-w-7xl mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Lista użytkowników</h3>
          </div>

          {/* Filter */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="label">ID użytkownika</label>
              <input
                type="text"
                name="userId"
                value={userFilters.userId}
                onChange={handleUserFilterChange}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
          ) : getFilteredUsers().length > 0 ? (
            <>
              <div className="overflow-x-auto">
                    <div className="bg-gray-100 rounded-lg border border-gray-200 mb-3">
                      <div className="grid grid-cols-[80px_1fr_150px_150px] items-center gap-3 px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Imię</span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nazwisko</span>
                      </div>
                    </div>
                    
                    {/* Users List */}
                    <div className="space-y-2">
                      {getPaginatedUsers().map((user) => (
                        <div key={user.id} className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-[80px_1fr_150px_150px] items-center gap-3 px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.id}
                            </div>
                            <div className="text-sm text-gray-700 truncate">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-900">
                              {user.firstName}
                            </div>
                            <div className="text-sm text-gray-900">
                              {user.lastName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
      </div>

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Strona <span className="font-medium">{userCurrentPage}</span> z <span className="font-medium">{userTotalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUserCurrentPage(1)}
                      disabled={userCurrentPage === 1}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Pierwsza strona"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={userCurrentPage === 1}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Poprzednia strona"
                    >
                      «
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      {userCurrentPage} / {userTotalPages}
                    </span>
                    <button
                      onClick={() => setUserCurrentPage(prev => Math.min(userTotalPages, prev + 1))}
                      disabled={userCurrentPage === userTotalPages}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Następna strona"
                    >
                      »
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(userTotalPages)}
                      disabled={userCurrentPage === userTotalPages}
                      className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Ostatnia strona"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Brak użytkowników</h4>
              <p className="text-gray-600">
                {userFilters.userId || userFilters.email || userFilters.role
                  ? 'Obecnie nie ma użytkowników spełniających kryteria wyszukiwania.'
                  : 'Obecnie nie ma użytkowników w bazie danych.'}
              </p>
            </div>
          )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Panel Admin</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} lg:block lg:w-64 bg-white shadow-lg min-h-screen`}>
          <div className="p-6">
            <nav className="space-y-2">
              {adminSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-gray-500">{section.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === 'gtfs' && renderGTFSSection()}
          {activeSection === 'delays' && renderDelaysSection()}
          {activeSection === 'cancellations' && renderCancellationsSection()}
          {activeSection === 'tickets' && renderTicketsSection()}
          {activeSection === 'users' && renderUsersSection()}
        </div>
      </div>

      {/* Delay Edit Modal */}
      <DelayEditModal
        delay={editingDelay}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveDelay}
      />

      {/* Resolve Delay Confirmation Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Rozwiązać opóźnienie?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Czy na pewno chcesz rozwiązać to opóźnienie?
              </p>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700">
                  <strong>UWAGA:</strong> Rozwiązanie opóźnienia spowoduje usunięcie opóźnień na wszystkich przystankach poniżej na tej trasie.
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={cancelResolveDelay}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={confirmResolveDelay}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Rozwiązywanie...' : 'Rozwiąż'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reinstate Cancellation Confirmation Modal */}
      {isReinstateModalOpen && cancellationToReinstate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Przywrócić pociąg?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Czy na pewno chcesz przywrócić pociąg <strong>{cancellationToReinstate.tripId}</strong> do rozkładu jazdy?
              </p>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700">
                  Pociąg będzie ponownie dostępny w wyszukiwarce połączeń i użytkownicy będą mogli kupować na niego bilety.
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={cancelReinstateCancellation}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Anuluj
                </button>
                <button
                  onClick={confirmReinstateCancellation}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Przywracanie...' : 'Przywróć'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
