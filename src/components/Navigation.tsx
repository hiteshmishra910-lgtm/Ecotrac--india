import React, { useState } from 'react';
import {
  Leaf,
  Database,
  User,
  Shield,
  Truck,
  Home,
  LogOut,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Profile, UserRole } from '../lib/types';
import { isSupabaseConfigured, switchLocalUser } from '../lib/supabase';

interface NavigationProps {
  currentUser: Profile | null;
  currentRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  onOpenSetup: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  currentRole,
  onRoleSwitch,
  onOpenSetup,
  onOpenAuth,
  onSignOut,
}) => {
  const supabaseConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  EcoTrack <span className="text-emerald-600">India</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SWM 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                AI Vision Waste Management & Segregation
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => onRoleSwitch('resident')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentRole === 'resident'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Citizen /</span> Resident
            </button>

            <button
              onClick={() => onRoleSwitch('collector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentRole === 'collector'
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-600" />
              Collector <span className="hidden md:inline font-mono text-[10px] px-1 bg-teal-50 text-teal-700 rounded">(Camera)</span>
            </button>

            <button
              onClick={() => onRoleSwitch('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-white text-purple-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              Admin
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase status badge / button */}
            <button
              onClick={onOpenSetup}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to view Supabase database setup guide and migration"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {supabaseConnected ? 'Supabase Live' : 'Supabase Config'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* User Profile / Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[130px]">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize block">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                  title="Switch or manage account"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Login / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
