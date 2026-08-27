import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card } from '../common/Card.tsx';
import { Input } from '../common/Input.tsx';
import { Button } from '../common/Button.tsx';

type AuthMode = 'login' | 'register';

export const AuthView: React.FC = () => {
  const { login, registerOwner, isLoading, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration Form States
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('BDT');
  const [currencySymbol, setCurrencySymbol] = useState('৳');

  const [localError, setLocalError] = useState<string | null>(null);

  const handleTabSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    clearAuthError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    setLocalError(null);
    clearAuthError();
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      // Error handled by AuthContext
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !regBusinessName.trim() ||
      !regOwnerName.trim() ||
      !regEmail.trim() ||
      !regPassword
    ) {
      setLocalError('Please fill in all required fields to register the Owner account.');
      return;
    }

    if (regPassword.length < 6) {
      setLocalError('Password must be at least 6 characters in length.');
      return;
    }

    setLocalError(null);
    clearAuthError();
    try {
      await registerOwner({
        businessName: regBusinessName.trim(),
        ownerName: regOwnerName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        currencyCode: currencyCode.trim() || 'BDT',
        currencySymbol: currencySymbol.trim() || '৳',
      });
    } catch (err: any) {
      // Error handled by AuthContext
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 text-white items-center justify-center shadow-sm font-bold text-xl">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Shop Management System
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Step 2 &bull; Authentication & Multi-Shop Foundation
          </p>
        </div>

        {/* Authentication Card */}
        <Card padding="lg" className="shadow-sm border-slate-200">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Owner</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to Owner Workspace' : 'Register New Business Owner'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login'
                ? 'Enter your credentials to access your business branches.'
                : 'Create your master account. A new owner starts with zero branches.'}
            </p>
          </div>

          {/* Error Message Display */}
          {displayedError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {displayedError}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                type="email"
                label="Owner Email Address"
                placeholder="e.g. owner@business.com"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (displayedError) {
                    setLocalError(null);
                    clearAuthError();
                  }
                }}
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <Input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (displayedError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Workspace
              </Button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Input
                label="Business / Enterprise Name"
                placeholder="e.g. Metro Retail Corporation"
                value={regBusinessName}
                onChange={(e) => setRegBusinessName(e.target.value)}
                required
              />

              <Input
                label="Owner / Administrator Full Name"
                placeholder="e.g. Md. Shahin"
                value={regOwnerName}
                onChange={(e) => setRegOwnerName(e.target.value)}
                required
              />

              <Input
                type="email"
                label="Primary Business Email"
                placeholder="e.g. owner@metroretail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Password (6+ characters) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {showRegPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <Input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Currency Code"
                  placeholder="BDT"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  required
                />
                <Input
                  label="Currency Symbol"
                  placeholder="৳"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Owner Account
              </Button>
            </form>
          )}
        </Card>

        {/* Security & Multi-Platform Assurance */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Trust Multi-Tenant Isolation</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Every Owner operates in complete data isolation. One backend supports Web, Android APK, and Windows EXE.
          </p>
        </div>
      </div>
    </div>
  );
};
