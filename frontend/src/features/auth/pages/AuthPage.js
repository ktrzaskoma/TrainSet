import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../../../shared/services/api';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(true);

  const hasSelectedConnection = localStorage.getItem('selectedConnection') !== null;
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [emailValidation, setEmailValidation] = useState({
    login: { isValid: null, touched: false },
    register: { isValid: null, touched: false }
  });
  const [passwordValidation, setPasswordValidation] = useState({
    register: { isValid: null, touched: false },
    registerConfirm: { isValid: null, touched: false }
  });
  const [showPasswords, setShowPasswords] = useState({
    login: false,
    registerPassword: false,
    registerConfirm: false
  });

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLoginFormChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'email') {
      setEmailValidation(prev => ({
        ...prev,
        login: {
          isValid: value.length > 0 ? validateEmail(value) : null,
          touched: true
        }
      }));
    }
  };

  const handleRegisterFormChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'email') {
      setEmailValidation(prev => ({
        ...prev,
        register: {
          isValid: value.length > 0 ? validateEmail(value) : null,
          touched: true
        }
      }));
    }

    if (name === 'password') {
      setPasswordValidation(prev => ({
        ...prev,
        register: {
          isValid: value.length > 0 ? validatePassword(value) : null,
          touched: true
        }
      }));
    }

    if (name === 'confirmPassword') {
      setPasswordValidation(prev => ({
        ...prev,
        registerConfirm: {
          isValid: value.length > 0 ? (value === registerForm.password && validatePassword(value)) : null,
          touched: true
        }
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginForm.email && !loginForm.password) {
      setError({ message: 'Proszę wypełnić wszystkie pola' });
      return;
    }
    
    if (!loginForm.email) {
      setError({ message: 'Proszę podać adres email' });
      return;
    }
    
    if (!loginForm.password) {
      setError({ message: 'Proszę podać hasło' });
      return;
    }

    if (!emailValidation.login.isValid) {
      setError({ message: 'Proszę podać prawidłowy adres email' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await login(loginForm.email, loginForm.password);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      // Redirect to the page they came from or tickets page
      const from = location.state?.from?.pathname || '/tickets';
      navigate(from, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
      setError({ message: 'Proszę wypełnić wszystkie wymagane pola' });
      return;
    }

    if (!emailValidation.register.isValid) {
      setError({ message: 'Proszę podać prawidłowy adres email' });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError({ message: 'Hasła nie są identyczne' });
      return;
    }

    const passwordError = getPasswordValidationMessage(registerForm.password);
    if (passwordError) {
      setError({ message: passwordError });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userData = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password
      };

      const result = await registerUser(userData);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      // Redirect to the page they came from or tickets page
      const from = location.state?.from?.pathname || '/tickets';
      navigate(from, { replace: true });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="card max-w-md w-full mx-auto">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showLoginForm ? 'Zaloguj się' : 'Zarejestruj się'}
            </h2>
            <p className="text-gray-600">
              {showLoginForm 
                ? (hasSelectedConnection ? 'Zaloguj się by kupić bilet' : 'Zaloguj się, aby korzystać ze wszystkich funkcji')
                : 'Utwórz konto, aby korzystać ze wszystkich funkcji'
              }
            </p>
          </div>

          {/* Toggle between login and register */}
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => {
                setShowLoginForm(true);
                setError(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showLoginForm 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Logowanie
            </button>
            <button
              onClick={() => {
                setShowLoginForm(false);
                setError(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showLoginForm 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejestracja
            </button>
          </div>

          {showLoginForm ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginFormChange}
                  className={`input-field ${
                    emailValidation.login.touched && emailValidation.login.isValid === false
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  required
                />
                {emailValidation.login.touched && emailValidation.login.isValid === false && (
                  <p className="text-xs text-red-600 mt-1">Nieprawidłowy format email</p>
                )}
              </div>
              
              <div>
                <label className="label">Hasło</label>
                <div className="relative">
                  <input
                    type={showPasswords.login ? "text" : "password"}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginFormChange}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('login')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.login ? (
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
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-700">{error.message}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Imię</label>
                  <input
                    type="text"
                    name="firstName"
                    value={registerForm.firstName}
                    onChange={handleRegisterFormChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nazwisko</label>
                  <input
                    type="text"
                    name="lastName"
                    value={registerForm.lastName}
                    onChange={handleRegisterFormChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterFormChange}
                  className={`input-field ${
                    emailValidation.register.touched && emailValidation.register.isValid === false
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : ''
                  }`}
                  required
                />
                {emailValidation.register.touched && emailValidation.register.isValid === false && (
                  <p className="text-xs text-red-600 mt-1">Nieprawidłowy format email</p>
                )}
              </div>

              <div>
                <label className="label">Hasło <span className="text-xs text-gray-500 font-normal">(min. 8 znaków, 1 wielka litera, 1 cyfra, 1 znak specjalny)</span></label>
                <div className="relative">
                  <input
                    type={showPasswords.registerPassword ? "text" : "password"}
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterFormChange}
                    className={`input-field pr-10 ${
                      passwordValidation.register.touched && passwordValidation.register.isValid === false
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : ''
                    }`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('registerPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.registerPassword ? (
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
                {passwordValidation.register.touched && passwordValidation.register.isValid === false && (
                  <p className="text-xs text-red-600 mt-1">
                    {getPasswordValidationMessage(registerForm.password) || 'Hasło nie spełnia wymagań'}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Potwierdź hasło</label>
                <div className="relative">
                  <input
                    type={showPasswords.registerConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterFormChange}
                    className={`input-field pr-10 ${
                      passwordValidation.registerConfirm.touched && passwordValidation.registerConfirm.isValid === false
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('registerConfirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.registerConfirm ? (
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
                {passwordValidation.registerConfirm.touched && passwordValidation.registerConfirm.isValid === false && (
                  <p className="text-xs text-red-600 mt-1">Hasła nie są identyczne lub są za krótkie</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-700">{error.message}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Rejestracja...' : 'Zarejestruj się'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

