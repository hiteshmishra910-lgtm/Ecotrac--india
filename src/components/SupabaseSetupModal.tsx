import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  X,
  AlertCircle,
  FileCode,
  Terminal,
} from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const config = getSupabaseConfig();

  if (!isOpen) return null;

  const copyMigrationSql = () => {
    // Read the migration SQL or copy the essential schema
    const migrationUrl = '/supabase/migrations/001_ecotrack_schema.sql';
    fetch(migrationUrl)
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        // Fallback: copy path
        navigator.clipboard.writeText('supabase/migrations/001_ecotrack_schema.sql');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Supabase PostgreSQL Configuration</h3>
              <p className="text-xs text-emerald-200">
                EcoTrack India Database & Authentication Status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700">
          {/* Current Status Card */}
          <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Connection Status:</span>
              {config.configured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected to Supabase
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Local Persistence Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-sans">
                  VITE_SUPABASE_URL
                </span>
                <span className="truncate block font-medium text-slate-800">
                  {config.url || 'Not set in .env'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-sans">
                  VITE_SUPABASE_PUBLISHABLE_KEY
                </span>
                <span className="truncate block font-medium text-slate-800">
                  {config.hasKey ? '••••••••••••••••' : 'Not set in .env'}
                </span>
              </div>
            </div>

            {!config.configured && (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                The application is running in local persistent mode with fully functional auth, camera vision scanning, and pickups. To sync with your remote Supabase PostgreSQL project, follow the 3 steps below.
              </p>
            )}
          </div>

          {/* Setup Guide */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" /> 3-Step Setup Instructions
            </h4>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Create or Open your Supabase Project</p>
                  <p className="text-xs text-slate-600">
                    Visit the Supabase Dashboard and go to <strong>Project Settings &gt; API</strong> to find your Project URL and anon public key.
                  </p>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium pt-1"
                  >
                    Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Add credentials to .env file</p>
                  <pre className="text-[11px] bg-slate-900 text-emerald-300 p-2.5 rounded-lg font-mono overflow-x-auto">
{`VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"`}
                  </pre>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-slate-900">Run the Database Migration Script</p>
                  <p className="text-xs text-slate-600">
                    Execute the complete PostgreSQL schema (creates tables: <code>profiles</code>, <code>resident_addresses</code>, <code>collector_attendance</code>, <code>pickups</code>, <code>waste_scans</code>, <code>notifications</code>, and RLS policies).
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={copyMigrationSql}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Copied Migration SQL!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Migration SQL
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-500 self-center">
                      File: <code>supabase/migrations/001_ecotrack_schema.sql</code>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security details */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Row-Level Security & Role Enforcement</strong>
              PostgreSQL RLS ensures residents only see their own pickups and addresses, collectors can update assigned pickups and log scans, and only admins can manage roles and view overall analytics.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
