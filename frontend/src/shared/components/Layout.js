import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout: handleLogout } = useAuth();

  const allNavigation = [
    { name: 'Wyszukiwarka połączeń', href: '/' },
    { name: 'Bilety', href: '/tickets', hideForAdmin: true },
    { name: 'Profil', href: '/profile', requiresAuth: true },
    { name: 'Panel Administracyjny', href: '/admin', adminOnly: true },
  ];

  const navigation = allNavigation.filter(item => {

    if (item.adminOnly) {
      return user && user.role === 'ADMIN';
    }
    if (item.hideForAdmin) {
      return !user || user.role !== 'ADMIN';
    }
    if (item.requiresAuth) {
      return isAuthenticated && user && user.role !== 'ADMIN';
    }
    return true;
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-4xl font-bold">
                  <span className="text-gray-900">Train</span>
                  <span className="text-primary-600">set</span>
                </span>
              </Link>
            </div>
            
            <nav className="flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center space-x-3">
                    {user.role === 'ADMIN' ? (
                      <span className="px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                        Admin
                      </span>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Wyloguj
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Zaloguj się
                </Link>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

    </div>
  );
};

export default Layout;
