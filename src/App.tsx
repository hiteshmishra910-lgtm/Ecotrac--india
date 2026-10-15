import React, { useState, useEffect } from 'react';
import { Profile, UserRole } from './lib/types';
import { getCurrentProfile, isSupabaseConfigured } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { ResidentDashboard } from './dashboards/ResidentDashboard';
import { CollectorDashboard } from './dashboards/CollectorDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AuthModal } from './components/AuthModal';
import {
  Database,
  Leaf,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('collector');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Backend Health state
  const [backendStatus, setBackendStatus] = useState<{
    geminiConfigured: boolean;
    supabaseConfigured: boolean;
    geminiModel: string;
  } | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const profile = await getCurrentProfile();
        if (profile) {
          setCurrentUser(profile);
          setCurrentRole(profile.role);
        }

        // Fetch backend health
        const res = await fetch('/api/health');
        if (res.ok) {
          const health = await res.json();
          setBackendStatus(health);
        }
      } catch (err) {
        console.warn('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const handleUserChanged = (user: Profile | null) => {
    setCurrentUser(user);
    if (user) {
      setCurrentRole(user.role);
    }
  };

  const supabaseLive = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navigation
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={() => handleUserChanged(null)}
      />

      {/* Database / AI Banner Notification if needed */}
      {!supabaseLive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Supabase Setup:</strong> Running in local persistent mode. To link your remote Supabase PostgreSQL project, paste your keys in <code>.env</code> and run the migration.
              </span>
            </div>
            <button
              onClick={() => setIsSetupOpen(true)}
              className="text-amber-800 hover:text-amber-950 font-bold underline"
            >
              View SQL Schema &amp; Keys Guide &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Initializing EcoTrack India Platform...</p>
          </div>
        ) : (
          <>
            {currentRole === 'resident' && (
              <ResidentDashboard
                user={
                  currentUser || {
                    id: 'res-101',
                    email: 'resident@example.com',
                    full_name: 'Resident Citizen',
                    role: 'resident',
                  }
                }
              />
            )}

            {currentRole === 'collector' && (
              <CollectorDashboard
                user={
                  currentUser || {
                    id: 'col-201',
                    email: 'collector@ecotrack.in',
                    full_name: 'Sanitation Officer Ramesh',
                    role: 'collector',
                  }
                }
              />
            )}

            {currentRole === 'admin' && (
              <AdminDashboard
                currentUser={
                  currentUser || {
                    id: 'adm-301',
                    email: 'admin@ecotrack.in',
                    full_name: 'Operations Admin Priya',
                    role: 'admin',
                  }
                }
              />
            )}
          </>
        )}
      </main>

      {/* Platform Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">EcoTrack India</span>
                <p className="text-[11px] text-slate-500">
                  Swachh Bharat Solid Waste Management &amp; AI Vision Classification System
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Vision: {backendStatus?.geminiModel || 'Gemini 3.8 Flash'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5" />
                Storage: Supabase PostgreSQL (RLS)
              </span>
              <button
                onClick={() => setIsSetupOpen(true)}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Database Schema SQL
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>
              Built for Municipal Corporations, Waste Collectors &amp; Residents. Segregate at source: Blue (Dry), Green (Wet), Red (Hazardous).
            </p>
            <p>
              Active Role View: <strong className="text-slate-300 capitalize">{currentRole}</strong>
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthOpen(false)}
        onUserChanged={handleUserChanged}
      />
    </div>
  );
}
