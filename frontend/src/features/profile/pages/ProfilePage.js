import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { handleApiError } from '../../../shared/services/api';
import { profileService } from '../services/profileService';

const ProfilePage = () => {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailValidation, setEmailValidation] = useState({ isValid: null, touched: false });
  const [fieldValidation, setFieldValidation] = useState({
    firstName: { touched: false, isValid: true },
    lastName: { touched: false, isValid: true },
    email: { touched: false, isValid: true }
  });
  const [passwordValidation, setPasswordValidation] = useState({
    currentPassword: { touched: false, isValid: true },
    newPassword: { touched: false, isValid: true },
    confirmPassword: { touched: false, isValid: true }
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [showNameConfirmModal, setShowNameConfirmModal] = useState(false);
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };
  
  const getPasswordValidationMessage = (password) => {
    if (!password) return null;
    const errors = [];
    if (password.length < 8) errors.push('minimum 8 znaków');
    if (!/[A-Z]/.test(password)) errors.push('jedna wielka litera');
    if (!/[a-z]/.test(password)) errors.push('jedna mała litera');
    if (!/[0-9]/.test(password)) errors.push('jedna cyfra');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('jeden znak specjalny');
    return errors.length > 0 ? `Hasło musi zawierać: ${errors.join(', ')}` : null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate fields on change
    if (name === 'firstName' || name === 'lastName') {
      setFieldValidation(prev => ({
        ...prev,
        [name]: {
          touched: true,
          isValid: value.trim().length > 0
        }
      }));
    }

    // Validate email on change
    if (name === 'email') {
      const isValidEmail = value.length > 0 ? validateEmail(value) : false;
      setEmailValidation({
        isValid: isValidEmail,
        touched: true
      });
      setFieldValidation(prev => ({
        ...prev,
        email: {
          touched: true,
          isValid: isValidEmail
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profileForm.firstName || !profileForm.lastName || !profileForm.email) {
      setError({ message: 'Proszę wypełnić wszystkie wymagane pola' });
      return;
    }

    // Check if email is valid (validate current value if not already validated)
    const isEmailValid = emailValidation.isValid !== null 
      ? emailValidation.isValid 
      : validateEmail(profileForm.email);
      
    if (!isEmailValid) {
      setError({ message: 'Proszę podać prawidłowy adres email' });
      return;
    }

    const emailChanged = profileForm.email !== user.email;
    const nameChanged = profileForm.firstName !== user.firstName || profileForm.lastName !== user.lastName;

    // Check if email has changed (email change takes priority as it requires logout)
    if (emailChanged) {
      // Show confirmation modal for email change
      setPendingProfileUpdate(profileForm);
      setShowEmailConfirmModal(true);
      return;
    }

    // Check if name has changed
    if (nameChanged) {
      // Show confirmation modal for name change
      setPendingProfileUpdate(profileForm);
      setShowNameConfirmModal(true);
      return;
    }

    // If nothing important changed, proceed with update
    try {
      setLoading(true);
      await profileService.updateProfile(profileForm);
      
      // Refresh user data
      await checkAuth();
      
      setSuccess({ message: 'Profil został zaktualizowany pomyślnie!' });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const confirmEmailChange = async () => {
    setShowEmailConfirmModal(false);
    
    try {
      setLoading(true);
      await profileService.updateProfile(pendingProfileUpdate);
      
      setSuccess({ message: 'Profil został zaktualizowany pomyślnie! Za chwilę zostaniesz wylogowany...' });
      
      // Logout after 2 seconds
      setTimeout(async () => {
        await logout();
        navigate('/auth');
      }, 2000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setPendingProfileUpdate(null);
    }
  };

  const confirmNameChange = async () => {
    setShowNameConfirmModal(false);
    
    try {
      setLoading(true);
      await profileService.updateProfile(pendingProfileUpdate);
      
      // Refresh user data
      await checkAuth();
      
      setSuccess({ message: 'Profil został zaktualizowany pomyślnie!' });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setPendingProfileUpdate(null);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password fields on change
    if (name === 'currentPassword') {
      setPasswordValidation(prev => ({
        ...prev,
        currentPassword: {
          touched: true,
          isValid: value.trim().length > 0
        }
      }));
    }

    if (name === 'newPassword') {
      const isValid = value.trim().length > 0 && validatePassword(value);
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: {
          touched: true,
          isValid: isValid
        }
      }));
    }

    if (name === 'confirmPassword') {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: {
          touched: true,
          isValid: value.trim().length > 0 && value === passwordForm.newPassword
        }
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError({ message: 'Proszę wypełnić wszystkie pola' });
      return;
    }

    const passwordError = getPasswordValidationMessage(passwordForm.newPassword);
    if (passwordError) {
      setPasswordError({ message: passwordError });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError({ message: 'Nowe hasło i potwierdzenie nie są identyczne' });
      return;
    }

    try {
      setLoading(true);
      await profileService.changePassword(passwordForm);
      
      setPasswordSuccess({ message: 'Hasło zostało zmienione pomyślnie!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordValidation({
        currentPassword: { touched: false, isValid: true },
        newPassword: { touched: false, isValid: true },
        confirmPassword: { touched: false, isValid: true }
      });
      setShowPasswordForm(false);
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    } catch (err) {
      setPasswordError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleDeleteAccount = async () => {
    // Validate confirmation - user must enter their email
    if (deleteConfirmation !== user.email) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userId = user.id || user.userId;
      
      await profileService.deleteAccount(userId);
      
      // Clear local storage and state immediately
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      
      // Navigate to home without trying to logout (session is already gone)
      navigate('/');
      window.location.reload(); // Force reload to clear all state
    } catch (err) {
      console.error('Error deleting account:', err);
      const apiError = handleApiError(err);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Musisz być zalogowany</h2>
        <p className="text-gray-600">Zaloguj się, aby zobaczyć i edytować swój profil.</p>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Profil Pasażera</h1>
        <p className="mt-2 text-gray-600">Zarządzaj swoimi danymi osobowymi</p>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="card max-w-2xl mx-auto bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Konto administratora</h3>
              <p className="text-sm text-amber-700">Administratorzy nie mogą edytować swoich danych z poziomu tego panelu.</p>
            </div>
          </div>
        </div>
      )}

      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dane osobowe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Imię {!isAdmin && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleInputChange}
                  className={`input-field ${
                    !isAdmin && fieldValidation.firstName.touched && !fieldValidation.firstName.isValid
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  required={!isAdmin}
                  disabled={isAdmin}
                />
                {!isAdmin && fieldValidation.firstName.touched && !fieldValidation.firstName.isValid && (
                  <p className="text-xs text-red-600 mt-1">To pole jest wymagane</p>
                )}
              </div>

              <div>
                <label className="label">
                  Nazwisko {!isAdmin && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleInputChange}
                  className={`input-field ${
                    !isAdmin && fieldValidation.lastName.touched && !fieldValidation.lastName.isValid
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  required={!isAdmin}
                  disabled={isAdmin}
                />
                {!isAdmin && fieldValidation.lastName.touched && !fieldValidation.lastName.isValid && (
                  <p className="text-xs text-red-600 mt-1">To pole jest wymagane</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="label">
                Email {!isAdmin && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleInputChange}
                className={`input-field ${
                  emailValidation.touched && emailValidation.isValid === false
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : ''
                }`}
                required={!isAdmin}
                disabled={isAdmin}
              />
              {!isAdmin && fieldValidation.email.touched && !fieldValidation.email.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  {profileForm.email.trim().length === 0 ? 'To pole jest wymagane' : 'Nieprawidłowy format email'}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-700">{error.message}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-700">{success.message}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!isAdmin && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span>Zapisywanie...</span>
                </>
              ) : (
                <span>Zapisz zmiany</span>
              )}
            </button>
          )}
        </form>
      </div>

      {/* Change Password Section - Hidden for Admin */}
      {!isAdmin && (
        <div className="card max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Zmiana hasła</h3>
            <p className="text-sm text-gray-600">Zaktualizuj swoje hasło dostępu</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="btn-secondary"
          >
            {showPasswordForm ? 'Anuluj' : 'Zmień hasło'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label className="label">
                Obecne hasło <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={`input-field pr-10 ${
                    passwordValidation.currentPassword.touched && !passwordValidation.currentPassword.isValid
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  placeholder="Wpisz obecne hasło"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordValidation.currentPassword.touched && !passwordValidation.currentPassword.isValid && (
                <p className="text-xs text-red-600 mt-1">To pole jest wymagane</p>
              )}
            </div>

            <div>
              <label className="label">
                Nowe hasło <span className="text-red-500">*</span> <span className="text-xs text-gray-500 font-normal">(min. 8 znaków, 1 wielka litera, 1 cyfra, 1 znak specjalny)</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={`input-field pr-10 ${
                    passwordValidation.newPassword.touched && !passwordValidation.newPassword.isValid
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  placeholder="Wpisz nowe hasło"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordValidation.newPassword.touched && !passwordValidation.newPassword.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  {passwordForm.newPassword.trim().length === 0 
                    ? 'To pole jest wymagane' 
                    : 'Hasło musi zawierać min. 8 znaków, 1 wielką literę, 1 cyfrę i 1 znak specjalny'}
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Potwierdź nowe hasło <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`input-field pr-10 ${
                    passwordValidation.confirmPassword.touched && !passwordValidation.confirmPassword.isValid
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  placeholder="Powtórz nowe hasło"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordValidation.confirmPassword.touched && !passwordValidation.confirmPassword.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  {passwordForm.confirmPassword.trim().length === 0 
                    ? 'To pole jest wymagane' 
                    : 'Hasła nie są identyczne'}
                </p>
              )}
            </div>

            {/* Password Error Message */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-700">{passwordError.message}</span>
                </div>
              </div>
            )}

            {/* Password Success Message */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-700">{passwordSuccess.message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Zmiana hasła...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Zmień hasło</span>
                </>
              )}
            </button>
          </form>
        )}
        </div>
      )}

      {/* Delete Account Section - Hidden for Admin */}
      {!isAdmin && (
        <div className="card max-w-2xl mx-auto border-red-200 bg-red-50">
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Usuń konto</h3>
            <p className="text-sm text-red-800 mb-4">
              Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane, w tym zakupione bilety i historia podróży, zostaną trwale usunięte.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-red-900 mb-2">
                Aby potwierdzić, wpisz swój adres email
              </label>
              <input
                type="email"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="input-field"
                placeholder="Wpisz swój email"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={loading || deleteConfirmation !== user.email}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Usuwanie...
                </div>
              ) : (
                'Usuń konto'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Email Change Confirmation Modal */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Potwierdzenie zmiany danych</h3>
            
            <p className="text-gray-700 mb-4">
              Po zmianie adresu email zostaniesz automatycznie wylogowany i będziesz musiał zalogować się ponownie przy użyciu nowego adresu email.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              {pendingProfileUpdate?.firstName !== user.firstName && (
                <>
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Stare imię:</span> {user.firstName}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Nowe imię:</span> {pendingProfileUpdate?.firstName}
                  </p>
                </>
              )}
              {pendingProfileUpdate?.lastName !== user.lastName && (
                <>
                  <p className="text-sm text-blue-900 mt-2">
                    <span className="font-semibold">Stare nazwisko:</span> {user.lastName}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Nowe nazwisko:</span> {pendingProfileUpdate?.lastName}
                  </p>
                </>
              )}
              {pendingProfileUpdate?.email !== user.email && (
                <>
                  <p className="text-sm text-blue-900 mt-2">
                    <span className="font-semibold">Stary email:</span> {user.email}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Nowy email:</span> {pendingProfileUpdate?.email}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  setPendingProfileUpdate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={loading}
              >
                Anuluj
              </button>
              <button
                onClick={confirmEmailChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  'Potwierdź'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Change Confirmation Modal */}
      {showNameConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Potwierdzenie zmiany danych</h3>
            
            <p className="text-gray-700 mb-4">
              Czy na pewno chcesz zmienić swoje dane osobowe?
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              {pendingProfileUpdate?.firstName !== user.firstName && (
                <>
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Stare imię:</span> {user.firstName}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Nowe imię:</span> {pendingProfileUpdate?.firstName}
                  </p>
                </>
              )}
              {pendingProfileUpdate?.lastName !== user.lastName && (
                <>
                  <p className="text-sm text-blue-900 mt-2">
                    <span className="font-semibold">Stare nazwisko:</span> {user.lastName}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Nowe nazwisko:</span> {pendingProfileUpdate?.lastName}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNameConfirmModal(false);
                  setPendingProfileUpdate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={loading}
              >
                Anuluj
              </button>
              <button
                onClick={confirmNameChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  'Potwierdź'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

