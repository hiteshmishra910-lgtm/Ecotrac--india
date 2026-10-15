import React, { useState, useEffect } from 'react';
import {
  Profile,
  ResidentAddress,
  Pickup,
  WasteScan,
  NotificationItem,
  CATEGORY_COLORS,
  WasteCategory,
} from '../lib/types';
import {
  getResidentData,
  createPickupRequest,
  updateResidentAddress,
} from '../lib/supabase';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  Bell,
  Scale,
  Home,
  User,
  Phone,
  Edit2,
  Check,
  RefreshCw,
} from 'lucide-react';

interface ResidentDashboardProps {
  user: Profile;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<ResidentAddress[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [scans, setScans] = useState<WasteScan[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Request Pickup Form State
  const [showPickupForm, setShowPickupForm] = useState<boolean>(false);
  const [pickupDate, setPickupDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [pickupNotes, setPickupNotes] = useState<string>('Segregated dry and wet waste ready for morning pickup');
  const [isSubmittingPickup, setIsSubmittingPickup] = useState<boolean>(false);
  const [pickupSuccess, setPickupSuccess] = useState<string | null>(null);

  // Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [editHouseId, setEditHouseId] = useState<string>('');
  const [editStreet, setEditStreet] = useState<string>('');
  const [editLocality, setEditLocality] = useState<string>('');
  const [editPincode, setEditPincode] = useState<string>('');
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getResidentData(user.id);
    setAddresses(data.addresses);
    setPickups(data.pickups);
    setScans(data.scans);
    setNotifications(data.notifications);

    if (data.addresses.length > 0) {
      const primary = data.addresses[0];
      setEditHouseId(primary.house_id);
      setEditStreet(primary.street_address);
      setEditLocality(primary.area_locality);
      setEditPincode(primary.pincode);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addresses.length === 0) {
      alert('Please add your household address first.');
      return;
    }

    setIsSubmittingPickup(true);
    try {
      await createPickupRequest(user.id, addresses[0].id, pickupDate, pickupNotes);
      setPickupSuccess('Waste collection pickup scheduled successfully!');
      setShowPickupForm(false);
      await loadData();
      setTimeout(() => setPickupSuccess(null), 3000);
    } catch (err: any) {
      alert('Failed to schedule pickup: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmittingPickup(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addresses.length === 0) return;

    setIsSavingAddress(true);
    try {
      await updateResidentAddress({
        id: addresses[0].id,
        house_id: editHouseId,
        street_address: editStreet,
        area_locality: editLocality,
        pincode: editPincode,
      });
      setIsEditingAddress(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to update address: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const primaryAddress = addresses[0];
  const totalRecycledKg = scans.reduce((acc, s) => acc + (s.estimated_weight_kg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
              Resident Sustainability Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {user.full_name}
            </h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              {primaryAddress
                ? `${primaryAddress.house_id}, ${primaryAddress.area_locality}, ${primaryAddress.city}`
                : 'Manage your household waste collection and view AI verified recycling history.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPickupForm(true)}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold rounded-2xl shadow-lg flex items-center gap-2 transition-all text-sm"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              Schedule Waste Pickup
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Total Pickups</span>
            <span className="text-xl sm:text-2xl font-bold">{pickups.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Waste Segregated</span>
            <span className="text-xl sm:text-2xl font-bold">{totalRecycledKg.toFixed(1)} kg</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Active Status</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-300">
              {pickups.some((p) => p.status === 'in_progress' || p.status === 'pending')
                ? 'Scheduled'
                : 'Up to Date'}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 block">Segregation Rating</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-300">5-Star Green</span>
          </div>
        </div>
      </div>

      {pickupSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{pickupSuccess}</span>
        </div>
      )}

      {/* Schedule Pickup Modal / Form */}
      {showPickupForm && (
        <div className="p-6 bg-white rounded-3xl border border-emerald-200 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" /> Schedule Doorstep Waste Pickup
            </h3>
            <button
              onClick={() => setShowPickupForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreatePickup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Date
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Address
                </label>
                <div className="text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 truncate">
                  {primaryAddress
                    ? `${primaryAddress.house_id}, ${primaryAddress.area_locality}`
                    : 'No address set'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waste Notes (Segregated dry, wet, electronic, or bulky items)
              </label>
              <textarea
                rows={2}
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="E.g., 2 bags of clean cardboard and plastic bottles, 1 organic food waste bin"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPickupForm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPickup}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2"
              >
                {isSubmittingPickup && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Pickups History & Address / Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Collection History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Waste Collection History
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time status updates, assigned collectors, and weight tracking
                </p>
              </div>
              <button
                onClick={loadData}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading collection history...
              </div>
            ) : pickups.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No collection records found. Click &quot;Schedule Waste Pickup&quot; to book your first collection visit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pickups.map((pickup) => {
                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Pending Assignment
                    </span>
                  );
                  if (pickup.status === 'in_progress') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                        Collector On the Way
                      </span>
                    );
                  } else if (pickup.status === 'completed') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Collection Completed
                      </span>
                    );
                  }

                  return (
                    <div key={pickup.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900">
                              Pickup Scheduled: {pickup.scheduled_date}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              {pickup.address?.house_id || 'Household'}, {pickup.address?.area_locality}
                            </span>
                          </div>
                        </div>

                        <div>{statusBadge}</div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Assigned Collector
                          </span>
                          <span className="font-medium text-slate-800">
                            {pickup.collector?.full_name ? (
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Truck className="w-3.5 h-3.5" />
                                {pickup.collector.full_name}
                              </span>
                            ) : (
                              'Sanitation Ward Unit Pending'
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Total Collected
                          </span>
                          <span className="font-medium text-slate-800">
                            {pickup.total_weight_kg ? `${pickup.total_weight_kg} kg` : 'To be weighed on site'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Completed At
                          </span>
                          <span className="font-medium text-slate-800">
                            {pickup.completed_at
                              ? new Date(pickup.completed_at).toLocaleString([], {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : 'Pending pickup'}
                          </span>
                        </div>
                      </div>

                      {pickup.notes && (
                        <p className="text-xs text-slate-600 italic">
                          &quot;{pickup.notes}&quot;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waste Scans Log */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AI Verified Waste Items
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized computer vision records logged by collectors at your residence
                </p>
              </div>
            </div>

            {scans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No items scanned yet. Scanned waste items with AI labels will appear here.
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scans.map((scan) => {
                  const style = CATEGORY_COLORS[scan.confirmed_category as WasteCategory] || CATEGORY_COLORS['Plastic'];
                  return (
                    <div
                      key={scan.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                        <img
                          src={scan.image_url}
                          alt="Waste item"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}
                          >
                            {scan.confirmed_category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(scan.scanned_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs truncate mt-1">
                          {scan.specific_label || scan.confirmed_category}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Qty: {scan.quantity_count}</span>
                          <span>•</span>
                          <span>~{scan.estimated_weight_kg} kg</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 truncate mt-1">
                          {scan.recycling_guidelines || 'Blue Bin Recyclable'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Address Details & Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Household Address Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" /> Household Address
              </h4>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {isEditingAddress ? 'Close' : 'Edit'}
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    House / Flat ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editHouseId}
                    onChange={(e) => setEditHouseId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g., Flat 402, Block Orchid"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g., 14th Main Road"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      required
                      value={editLocality}
                      onChange={(e) => setEditLocality(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g., HSR Layout"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="560102"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  {isSavingAddress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Address
                </button>
              </form>
            ) : primaryAddress ? (
              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{primaryAddress.house_id}</div>
                <div className="text-slate-600">{primaryAddress.street_address}</div>
                <div className="text-slate-600">
                  {primaryAddress.area_locality}, {primaryAddress.city} - {primaryAddress.pincode}
                </div>
                <div className="pt-2 text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  GPS: {primaryAddress.latitude?.toFixed(4) || '12.9121'}°N, {primaryAddress.longitude?.toFixed(4) || '77.6446'}°E
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No address saved. Click Edit to add.</p>
            )}

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact: {user.phone || '+91 98450 12345'}</span>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" /> Collection Notifications
            </h4>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400">No notifications at this moment.</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{notif.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
