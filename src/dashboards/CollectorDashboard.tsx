import React, { useState, useEffect } from 'react';
import {
  Profile,
  CollectorAttendance,
  Pickup,
  WasteScan,
  CATEGORY_COLORS,
  WasteCategory,
} from '../lib/types';
import {
  getCollectorData,
  markCollectorAttendance,
  completePickup,
} from '../lib/supabase';
import { CameraScanner } from '../components/CameraScanner';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  UserCheck,
  Calendar,
  Scale,
  RefreshCw,
  LogOut,
  AlertCircle,
  Home,
  Check,
} from 'lucide-react';

interface CollectorDashboardProps {
  user: Profile;
}

export const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [attendance, setAttendance] = useState<CollectorAttendance[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [scans, setScans] = useState<WasteScan[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState<string>('');

  // Attendance state
  const [isMarkingAttendance, setIsMarkingAttendance] = useState<boolean>(false);
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

  // Active GPS for attendance
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getCollectorData(user.id);
    setAttendance(data.attendance);
    setPickups(data.pickups);
    setScans(data.scans);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => null
      );
    }
  }, [user.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find((a) => a.attendance_date === todayStr);

  const handleCheckIn = async () => {
    setIsMarkingAttendance(true);
    try {
      await markCollectorAttendance(
        user.id,
        true,
        coords || { latitude: 12.9135, longitude: 77.6432 },
        'Checked in via field mobile portal'
      );
      setAttendanceMsg('Checked in successfully! You are now ON DUTY.');
      await loadData();
      setTimeout(() => setAttendanceMsg(null), 3000);
    } catch (err: any) {
      alert('Check-in error: ' + (err?.message || 'Error'));
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    setIsMarkingAttendance(true);
    try {
      await markCollectorAttendance(
        user.id,
        false,
        coords || { latitude: 12.9135, longitude: 77.6432 },
        'Shift completed'
      );
      setAttendanceMsg('Shift check-out recorded. Great work today!');
      await loadData();
      setTimeout(() => setAttendanceMsg(null), 3000);
    } catch (err: any) {
      alert('Check-out error: ' + (err?.message || 'Error'));
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const handleCompletePickup = async (pickupId: string) => {
    try {
      await completePickup(pickupId, user.id, coords || undefined);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Collector metrics
  const todayScans = scans.filter((s) => s.scanned_at.startsWith(todayStr));
  const todayKg = todayScans.reduce((sum, s) => sum + (s.estimated_weight_kg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Collector Header & Shift Status */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                Collector Field Terminal
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Ward #174 (HSR & Koramangala Zone)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Officer {user.full_name}
            </h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              Equipped with live camera computer vision scanner and Swachh Bharat segregation rules.
            </p>
          </div>

          {/* Attendance Action Button */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                Shift Status:
              </span>
              <span className="text-sm font-bold">
                {!todayAttendance
                  ? 'Not Checked In'
                  : todayAttendance.status === 'completed'
                  ? 'Shift Completed'
                  : 'On Duty (Active)'}
              </span>
              {todayAttendance?.check_in_time && (
                <span className="text-[11px] text-slate-300 block font-mono">
                  In: {new Date(todayAttendance.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {!todayAttendance ? (
              <button
                onClick={handleCheckIn}
                disabled={isMarkingAttendance}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                {isMarkingAttendance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Mark Attendance
              </button>
            ) : todayAttendance.status !== 'completed' ? (
              <button
                onClick={handleCheckOut}
                disabled={isMarkingAttendance}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                {isMarkingAttendance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Check Out Shift
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-400/30">
                Duty Finished
              </span>
            )}
          </div>
        </div>

        {/* Collector KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Scans Today</span>
            <span className="text-xl sm:text-2xl font-bold">{todayScans.length} items</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Total Weight Logged</span>
            <span className="text-xl sm:text-2xl font-bold">{todayKg.toFixed(1)} kg</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Pending Pickups</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-300">
              {pickups.filter((p) => p.status === 'pending' || p.status === 'in_progress').length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Total Shift Lifetime</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-300">
              {attendance.length} Days
            </span>
          </div>
        </div>
      </div>

      {attendanceMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{attendanceMsg}</span>
        </div>
      )}

      {/* Core Feature: Real Camera AI Scanner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <Camera className="w-6 h-6 text-emerald-600" />
              Real-Time AI Waste Camera Scanner
            </h3>
            <p className="text-xs text-slate-500">
              Captures high-resolution frame, transmits to Gemini 3.8 Flash Vision, and records verified classification
            </p>
          </div>
        </div>

        <CameraScanner
          collectorId={user.id}
          activePickups={pickups}
          selectedPickupId={selectedPickupId}
          onScanSaved={loadData}
        />
      </div>

      {/* Grid: Pickups Queue & Scan Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pickups in Ward */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" /> Household Pickup Queue
              </h4>
              <p className="text-xs text-slate-500">
                Scheduled collections assigned for today
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {pickups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active pickups scheduled.
              </div>
            ) : (
              pickups.map((pick) => {
                const isSelected = selectedPickupId === pick.id;
                return (
                  <div
                    key={pick.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {pick.address?.house_id || 'Household'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              pick.status === 'completed'
                                ? 'bg-teal-100 text-teal-800'
                                : pick.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pick.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {pick.address?.street_address}, {pick.address?.area_locality}
                        </p>
                        {pick.resident?.full_name && (
                          <p className="text-[11px] text-slate-500">
                            Resident: {pick.resident.full_name} ({pick.resident.phone || 'Contact provided'})
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {pick.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => setSelectedPickupId(pick.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              {isSelected ? 'Selected in Camera' : 'Scan for House'}
                            </button>

                            <button
                              onClick={() => handleCompletePickup(pick.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Complete
                            </button>
                          </>
                        )}
                        {pick.status === 'completed' && (
                          <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Picked Up
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Collector Scan Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Scans Logged by You ({scans.length})
            </h4>
            <p className="text-xs text-slate-500">
              Audit trail of items detected and logged in the field
            </p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {scans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No items scanned yet. Use the camera above to capture waste items.
              </div>
            ) : (
              scans.map((scan) => {
                const style =
                  CATEGORY_COLORS[scan.confirmed_category as WasteCategory] ||
                  CATEGORY_COLORS['Plastic'];

                return (
                  <div key={scan.id} className="p-3.5 hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                      <img
                        src={scan.image_url}
                        alt="Scanned item"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}
                        >
                          {scan.confirmed_category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                        {scan.specific_label || scan.confirmed_category}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{scan.quantity_count}x</span>
                        <span>•</span>
                        <span>~{scan.estimated_weight_kg} kg</span>
                        <span>•</span>
                        <span className="truncate">{scan.scan_address || 'Field Location'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
