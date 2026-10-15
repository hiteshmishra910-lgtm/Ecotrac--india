import React, { useState } from 'react';
import {
  MapPin,
  Navigation as NavIcon,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  User,
  Scale,
} from 'lucide-react';
import { Pickup, WasteScan, CollectorAttendance } from '../lib/types';

interface MapViewProps {
  pickups?: Pickup[];
  scans?: WasteScan[];
  attendance?: CollectorAttendance[];
  centerCoordinates?: { latitude: number; longitude: number };
  title?: string;
  subtitle?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  pickups = [],
  scans = [],
  attendance = [],
  centerCoordinates = { latitude: 12.9121, longitude: 77.6446 },
  title = 'Geographic Pickup & Waste Scan Tracking',
  subtitle = 'Interactive field coordinates mapped across urban collection zones',
}) => {
  const [filter, setFilter] = useState<'all' | 'pickups' | 'scans' | 'attendance'>('all');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'pickup' | 'scan' | 'attendance';
    title: string;
    details: string;
    category?: string;
    status?: string;
    latitude: number;
    longitude: number;
    time: string;
  } | null>(null);

  // Collect all points with valid coordinates
  const pickupPoints = pickups
    .filter((p) => (p.pickup_latitude && p.pickup_longitude) || (p.address?.latitude && p.address?.longitude))
    .map((p) => {
      const lat = p.pickup_latitude || p.address?.latitude || centerCoordinates.latitude;
      const lng = p.pickup_longitude || p.address?.longitude || centerCoordinates.longitude;
      return {
        id: p.id,
        type: 'pickup' as const,
        title: p.address?.house_id || 'Household Pickup',
        details: `${p.address?.street_address || ''}, ${p.address?.area_locality || 'Urban Zone'}`,
        status: p.status,
        latitude: lat,
        longitude: lng,
        time: p.scheduled_date || '',
        weight: p.total_weight_kg,
      };
    });

  const scanPoints = scans
    .filter((s) => s.scan_latitude && s.scan_longitude)
    .map((s) => ({
      id: s.id,
      type: 'scan' as const,
      title: `${s.confirmed_category} (${s.specific_label || 'Scanned Item'})`,
      details: s.scan_address || 'Field Camera Inspection',
      category: s.confirmed_category,
      latitude: s.scan_latitude!,
      longitude: s.scan_longitude!,
      time: new Date(s.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weight: s.estimated_weight_kg,
      collector: s.collector?.full_name,
    }));

  const attendancePoints = attendance
    .filter((a) => a.check_in_latitude && a.check_in_longitude)
    .map((a) => ({
      id: a.id,
      type: 'attendance' as const,
      title: `${a.collector?.full_name || 'Sanitation Collector'} Check-In`,
      details: a.notes || 'Depot Shift Start',
      latitude: a.check_in_latitude!,
      longitude: a.check_in_longitude!,
      time: new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: a.status,
    }));

  const allPoints = [
    ...(filter === 'all' || filter === 'pickups' ? pickupPoints : []),
    ...(filter === 'all' || filter === 'scans' ? scanPoints : []),
    ...(filter === 'all' || filter === 'attendance' ? attendancePoints : []),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <NavIcon className="w-4 h-4 text-emerald-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({pickupPoints.length + scanPoints.length + attendancePoints.length})
          </button>
          <button
            onClick={() => setFilter('pickups')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'pickups' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pickups ({pickupPoints.length})
          </button>
          <button
            onClick={() => setFilter('scans')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'scans' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scans ({scanPoints.length})
          </button>
          <button
            onClick={() => setFilter('attendance')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'attendance' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance ({attendancePoints.length})
          </button>
        </div>
      </div>

      {/* Grid Layout: Visual Map View + Pin List */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Visual Map Canvas / Coordinate Grid */}
        <div className="lg:col-span-8 bg-slate-900 min-h-[380px] relative p-6 flex flex-col justify-between overflow-hidden">
          {/* Subtle cartographic grid background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Map Status Overlay */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bengaluru Urban Ward Grid (HSR & Indiranagar Sector)</span>
            </div>

            <div className="text-right text-[11px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Center: 12.9121° N, 77.6446° E
            </div>
          </div>

          {/* Pins Simulation Layout */}
          <div className="relative z-10 my-auto py-12 flex flex-wrap justify-around items-center gap-6">
            {allPoints.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                No GPS coordinates logged for this category yet.
              </div>
            ) : (
              allPoints.map((pt, idx) => {
                const isSelected = selectedItem?.id === pt.id;
                let pinColor = 'bg-blue-500 text-white';
                if (pt.type === 'scan') pinColor = 'bg-emerald-500 text-white';
                if (pt.type === 'attendance') pinColor = 'bg-purple-500 text-white';
                if (pt.type === 'pickup' && pt.status === 'completed') pinColor = 'bg-teal-500 text-white';

                return (
                  <div
                    key={`${pt.type}-${pt.id}-${idx}`}
                    onClick={() => setSelectedItem(pt)}
                    className="group cursor-pointer flex flex-col items-center transition-transform hover:scale-110"
                  >
                    <div
                      className={`relative p-2.5 rounded-full shadow-lg transition-all ${pinColor} ${
                        isSelected ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-125' : ''
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      {pt.type === 'scan' && (
                        <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-300" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] font-medium text-slate-200 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 max-w-[130px] truncate">
                      {pt.title}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Map Legend */}
          <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-400 text-[10px] uppercase">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Waste AI Scan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pickup Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Pickup Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Collector Attendance
            </span>
          </div>
        </div>

        {/* Coords & Details Side Panel */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h4 className="font-semibold text-slate-800 text-sm">Coordinates & Location Data</h4>
            <p className="text-xs text-slate-500">
              Click any location to inspect field telemetry
            </p>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {selectedItem ? (
              <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {selectedItem.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{selectedItem.time}</span>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{selectedItem.title}</h5>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedItem.details}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
                  <span className="block text-[10px] text-slate-400 font-sans uppercase">GPS Fix</span>
                  {selectedItem.latitude.toFixed(5)}° N, {selectedItem.longitude.toFixed(5)}° E
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {allPoints.slice(0, 5).map((pt, i) => (
                  <div
                    key={`side-${pt.type}-${pt.id}-${i}`}
                    onClick={() => setSelectedItem(pt)}
                    className="p-3 bg-white hover:bg-emerald-50/40 rounded-xl border border-slate-200 cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="truncate">{pt.title}</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">
                        {pt.latitude.toFixed(3)}°, {pt.longitude.toFixed(3)}°
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{pt.details}</p>
                  </div>
                ))}
                {allPoints.length > 5 && (
                  <p className="text-center text-[11px] text-slate-400 pt-1">
                    + {allPoints.length - 5} more coordinates in ward
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
