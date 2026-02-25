import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import Layout from './shared/components/Layout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import SearchPage from './features/search/pages/SearchPage';
import TicketsPage from './features/tickets/pages/TicketsPage';
import AdminPage from './features/admin/pages/AdminPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import AuthPage from './features/auth/pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route 
              path="/tickets" 
              element={
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute noAdmin={true}>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;