import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  Truck,
  Home,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Profile, UserRole } from '../lib/types';
import {
  signUpUser,
  signInUser,
  signOutUser,
  switchLocalUser,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: Profile | null;
  onClose: () => void;
  onUserChanged: (user: Profile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'resident' | 'collector'>('resident');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpUser(email, password, fullName, role, phone);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          setSuccess('Account created successfully!');
          onUserChanged(res.user);
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        const res = await signInUser(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          setSuccess('Logged in successfully!');
          onUserChanged(res.user);
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    setLoading(true);
    const user = await switchLocalUser(userId);
    if (user) {
      onUserChanged(user);
      onClose();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOutUser();
    onUserChanged(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {currentUser ? 'User Account Management' : mode === 'signin' ? 'Sign In to EcoTrack' : 'Register Citizen Account'}
              </h3>
              <p className="text-xs text-emerald-200">
                Supabase Authentication & Role Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Active user status banner */}
          {currentUser && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Logged in as:
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{currentUser.full_name}</h4>
                  <span className="text-xs text-slate-500 font-mono">{currentUser.email}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-emerald-100 text-emerald-800">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          {/* Quick Profile Switching for Testing */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Quick Switch Profile (Test Roles):
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSwitch('res-101')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <Home className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-slate-900 block truncate">Ananya S.</span>
                <span className="text-[10px] text-slate-500 block">Resident</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('col-201')}
                className="p-2.5 bg-slate-50 hover:bg-teal-50 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <Truck className="w-4 h-4 text-teal-600 mb-1" />
                <span className="font-bold text-slate-900 block truncate">Ramesh K.</span>
                <span className="text-[10px] text-slate-500 block">Collector</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('adm-301')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <Shield className="w-4 h-4 text-purple-600 mb-1" />
                <span className="font-bold text-slate-900 block truncate">Dr. Priya V.</span>
                <span className="text-[10px] text-slate-500 block">Admin</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">
                Or authenticate with credentials
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g., Rajesh Patel"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('resident')}
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        role === 'resident'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Resident Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('collector')}
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        role === 'collector'
                          ? 'bg-teal-50 border-teal-500 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Sanitation Collector
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    * Admin roles must be assigned via central administration.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" /> Sign In with Supabase
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Register Account
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center pt-2">
            {mode === 'signin' ? (
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
