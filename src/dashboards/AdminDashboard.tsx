import React, { useState, useEffect } from 'react';
import {
  Profile,
  Pickup,
  WasteScan,
  CollectorAttendance,
  WASTE_CATEGORIES,
  CATEGORY_COLORS,
  WasteCategory,
  UserRole,
} from '../lib/types';
import { getAdminData, updateUserRole } from '../lib/supabase';
import { MapView } from '../components/MapView';
import {
  BarChart3,
  Users,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Filter,
  ShieldCheck,
  Search,
  Scale,
  RefreshCw,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: Profile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [scans, setScans] = useState<WasteScan[]>([]);
  const [attendance, setAttendance] = useState<CollectorAttendance[]>([]);

  // Filters
  const [activeTab, setActiveTab] = useState<'scans' | 'pickups' | 'attendance' | 'users' | 'map'>('scans');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uncertainOnly, setUncertainOnly] = useState<boolean>(false);

  // User role modification
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getAdminData();
    setProfiles(data.profiles);
    setPickups(data.pickups);
    setScans(data.scans);
    setAttendance(data.attendance);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserRole(userId);
    try {
      await updateUserRole(userId, newRole);
      await loadData();
    } catch (err: any) {
      alert('Failed to update role: ' + (err?.message || 'Error'));
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Metrics calculations
  const totalWeightKg = scans.reduce((acc, s) => acc + (s.estimated_weight_kg || 0), 0);
  const totalCollectors = profiles.filter((p) => p.role === 'collector').length;
  const totalResidents = profiles.filter((p) => p.role === 'resident').length;
  const uncertainCount = scans.filter((s) => s.is_uncertain).length;

  // Category counts
  const categoryStats: Record<string, number> = {};
  WASTE_CATEGORIES.forEach((cat) => {
    categoryStats[cat] = scans.filter((s) => s.confirmed_category === cat).length;
  });

  // Filtered scans
  const filteredScans = scans.filter((scan) => {
    if (categoryFilter !== 'all' && scan.confirmed_category !== categoryFilter) return false;
    if (uncertainOnly && !scan.is_uncertain) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchLabel = scan.specific_label?.toLowerCase().includes(q);
      const matchCat = scan.confirmed_category.toLowerCase().includes(q);
      const matchCollector = scan.collector?.full_name.toLowerCase().includes(q);
      const matchAddr = scan.scan_address?.toLowerCase().includes(q);
      if (!matchLabel && !matchCat && !matchCollector && !matchAddr) return false;
    }
    return true;
  });

  // Filtered pickups
  const filteredPickups = pickups.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHouse = p.address?.house_id?.toLowerCase().includes(q);
      const matchLocality = p.address?.area_locality?.toLowerCase().includes(q);
      const matchResident = p.resident?.full_name?.toLowerCase().includes(q);
      const matchCollector = p.collector?.full_name?.toLowerCase().includes(q);
      if (!matchHouse && !matchLocality && !matchResident && !matchCollector) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                EcoTrack Central Command
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Admin Privilege Active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Municipal Waste Operations & AI Audit
            </h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              Inspect live collections, audit computer vision classification precision, monitor field sanitation staff, and manage role security.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-colors border border-white/10"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </button>
          </div>
        </div>

        {/* High-Level KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[11px] text-emerald-200 block">Total Waste Diverted</span>
            <span className="text-2xl font-bold">{totalWeightKg.toFixed(1)} kg</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">Across {scans.length} logged scans</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[11px] text-emerald-200 block">Registered Citizens</span>
            <span className="text-2xl font-bold">{totalResidents} Residents</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{pickups.length} scheduled pickups</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[11px] text-emerald-200 block">Active Collectors</span>
            <span className="text-2xl font-bold">{totalCollectors} On Field</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              {attendance.length} shift records
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[11px] text-amber-200 block">Uncertain AI Classifications</span>
            <span className="text-2xl font-bold text-amber-300">{uncertainCount} Flagged</span>
            <span className="text-[10px] text-amber-200 block mt-0.5">
              {((uncertainCount / (scans.length || 1)) * 100).toFixed(1)}% verification rate
            </span>
          </div>
        </div>
      </div>

      {/* Waste Category Breakdown Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Waste Composition by Swachh Bharat Category
          </h4>
          <span className="text-xs text-slate-500">{scans.length} Total Inspections</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {WASTE_CATEGORIES.map((cat) => {
            const count = categoryStats[cat] || 0;
            const style = CATEGORY_COLORS[cat];
            return (
              <div
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat === categoryFilter ? 'all' : cat);
                  setActiveTab('scans');
                }}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  categoryFilter === cat
                    ? 'ring-2 ring-emerald-600 shadow-sm ' + style.bg
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 block truncate">{cat}</span>
                <span className="text-lg font-bold text-slate-900">{count}</span>
                <span className="text-[9px] text-slate-400 block">
                  {scans.length > 0 ? ((count / scans.length) * 100).toFixed(0) : 0}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scans')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'scans'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Waste Scans & AI Audits ({filteredScans.length})
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pickups'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Household Pickups ({pickups.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Collector Attendance ({attendance.length})
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Geographic GPS Map
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            User Roles & RBAC ({profiles.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, locations, labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white w-64"
          />
        </div>
      </div>

      {/* Tab 1: Waste Scans Table */}
      {activeTab === 'scans' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="all">All Categories</option>
                {WASTE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uncertainOnly}
                  onChange={(e) => setUncertainOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-amber-800 font-medium">Show Uncertain AI Flags Only</span>
              </label>
            </div>

            <span className="text-slate-500">
              Showing {filteredScans.length} of {scans.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Photo</th>
                  <th className="p-3.5">Detected Item & Label</th>
                  <th className="p-3.5">Confirmed Category</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Weight / Qty</th>
                  <th className="p-3.5">Collector & Location</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No waste scan records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((scan) => {
                    const style =
                      CATEGORY_COLORS[scan.confirmed_category as WasteCategory] ||
                      CATEGORY_COLORS['Plastic'];
                    return (
                      <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                            <img
                              src={scan.image_url}
                              alt="Scan"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">
                            {scan.specific_label || scan.detected_category}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            {scan.disposal_recommendation}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${style.bg} ${style.text}`}
                          >
                            {scan.confirmed_category}
                          </span>
                          {scan.detected_category !== scan.confirmed_category && (
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              (AI predicted: {scan.detected_category})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {((scan.confidence_score || 0.85) * 100).toFixed(0)}%
                            </span>
                            {scan.is_uncertain && (
                              <span
                                title="Uncertain AI prediction corrected by collector"
                                className="p-1 rounded-full bg-amber-100 text-amber-700"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          {scan.quantity_count}x (~{scan.estimated_weight_kg} kg)
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-slate-900 block">
                            {scan.collector?.full_name || 'Sanitation Worker'}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            {scan.scan_address || 'Field Telemetry'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(scan.scanned_at).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pickups Management */}
      {activeTab === 'pickups' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Status Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <span className="text-slate-500">{filteredPickups.length} Pickups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Address & Locality</th>
                  <th className="p-3.5">Assigned Collector</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Weight (kg)</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPickups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No pickups found.
                    </td>
                  </tr>
                ) : (
                  filteredPickups.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-medium text-slate-900">{p.scheduled_date}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{p.resident?.full_name || 'Resident'}</span>
                        <span className="text-[10px] text-slate-500">{p.resident?.phone || 'No phone'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 block">{p.address?.house_id}</span>
                        <span className="text-[10px] text-slate-500">{p.address?.area_locality}, {p.address?.city}</span>
                      </td>
                      <td className="p-3.5">
                        {p.collector?.full_name ? (
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> {p.collector.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-700 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'completed'
                              ? 'bg-teal-100 text-teal-800'
                              : p.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {p.total_weight_kg ? `${p.total_weight_kg} kg` : '0 kg'}
                      </td>
                      <td className="p-3.5 text-slate-500 italic max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Collector Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <h4 className="font-bold text-slate-800">Field Collector Attendance & Shifts</h4>
            <span className="text-slate-500">{attendance.length} Total Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Collector</th>
                  <th className="p-3.5">Check-In Time</th>
                  <th className="p-3.5">Check-Out Time</th>
                  <th className="p-3.5">GPS Fix</th>
                  <th className="p-3.5">Shift Status</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No attendance records logged yet.
                    </td>
                  </tr>
                ) : (
                  attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-medium text-slate-900">{att.attendance_date}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {att.collector?.full_name || 'Collector Officer'}
                      </td>
                      <td className="p-3.5 text-emerald-800 font-mono">
                        {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {att.check_out_time
                          ? new Date(att.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'On duty (active)'}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {att.check_in_latitude?.toFixed(4)}°N, {att.check_in_longitude?.toFixed(4)}°E
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            att.status === 'completed'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 italic">{att.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Interactive GPS Map */}
      {activeTab === 'map' && (
        <MapView
          pickups={pickups}
          scans={scans}
          attendance={attendance}
          title="Bengaluru Sanitation Ward Coverage"
          subtitle="Real-time geographic distribution of waste collections, camera AI scans, and collector visits"
        />
      )}

      {/* Tab 5: User Roles & RBAC Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-slate-800">User Role Administration</h4>
              <p className="text-slate-500 text-[11px]">
                Assign verified role privileges (resident, collector, admin)
              </p>
            </div>
            <span className="text-slate-500">{profiles.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Current Role</th>
                  <th className="p-3.5">Role Authorization Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{p.full_name}</td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">{p.email}</td>
                    <td className="p-3.5 text-slate-600">{p.phone || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          p.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : p.role === 'collector'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {p.id === currentUser.id ? (
                          <span className="text-[11px] text-slate-400 italic">Current User</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRoleChange(p.id, 'resident')}
                              disabled={updatingUserRole === p.id || p.role === 'resident'}
                              className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            >
                              Set Resident
                            </button>
                            <button
                              onClick={() => handleRoleChange(p.id, 'collector')}
                              disabled={updatingUserRole === p.id || p.role === 'collector'}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 disabled:opacity-40 font-semibold"
                            >
                              Set Collector
                            </button>
                            <button
                              onClick={() => handleRoleChange(p.id, 'admin')}
                              disabled={updatingUserRole === p.id || p.role === 'admin'}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 disabled:opacity-40 font-semibold"
                            >
                              Set Admin
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
