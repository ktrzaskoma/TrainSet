import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const DelayEditModal = ({ delay, isOpen, onClose, onSave }) => {
  const getDelayTypeLabel = (type) => {
    const types = {
      'DEPARTURE': 'Odjazd',
      'ARRIVAL': 'Przyjazd'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'ACTIVE': 'Aktywne',
      'RESOLVED': 'Rozwiązane'
    };
    return statuses[status] || status;
  };
  const [formData, setFormData] = useState({
    delayMinutes: '',
    reason: '',
    delayType: 'DEPARTURE',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (delay && isOpen) {
      setFormData({
        delayMinutes: delay.delayMinutes || '',
        reason: delay.reason || '',
        delayType: delay.delayType || 'DEPARTURE',
        status: delay.status || 'ACTIVE'
      });
    }
  }, [delay, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminService.updateDelay(delay.id, formData);
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd podczas aktualizacji opóźnienia');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edytuj Opóźnienie</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
          <div className="text-sm text-gray-600">
            <strong>Pociąg:</strong> {delay?.tripId}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Stacja:</strong> {delay?.stopId}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Powód:</strong> {delay?.reason || 'Brak'}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Typ:</strong> {getDelayTypeLabel(delay?.delayType)}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Status:</strong> {getStatusLabel(delay?.status)}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opóźnienie (minuty)
            </label>
            <input
              type="number"
              value={formData.delayMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, delayMinutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm font-medium"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default DelayEditModal;

