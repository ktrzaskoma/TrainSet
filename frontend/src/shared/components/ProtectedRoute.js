import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, noAdmin = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Brak dostępu</h2>
          <p className="text-red-700">Nie masz uprawnień do przeglądania tej strony.</p>
          <p className="text-red-700 mt-2">Ta strona jest dostępna tylko dla administratorów.</p>
        </div>
      </div>
    );
  }

  if (noAdmin && user.role === 'ADMIN') {
    // Redirect admin to admin page if they try to access profile
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;

