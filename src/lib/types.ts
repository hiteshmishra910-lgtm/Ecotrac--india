export type UserRole = 'resident' | 'collector' | 'admin';

export type WasteCategory =
  | 'Plastic'
  | 'Metal'
  | 'Paper and cardboard'
  | 'Glass'
  | 'Organic/wet waste'
  | 'Electronic waste'
  | 'General/mixed waste'
  | 'Unknown or uncertain';

export const WASTE_CATEGORIES: WasteCategory[] = [
  'Plastic',
  'Metal',
  'Paper and cardboard',
  'Glass',
  'Organic/wet waste',
  'Electronic waste',
  'General/mixed waste',
  'Unknown or uncertain',
];

export const CATEGORY_COLORS: Record<WasteCategory, { bg: string; text: string; border: string; binColor: string; binName: string }> = {
  'Plastic': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    binColor: '#2563eb',
    binName: 'Blue Bin (Dry Recyclable)',
  },
  'Metal': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    binColor: '#d97706',
    binName: 'Blue Bin (Metal & Dry)',
  },
  'Paper and cardboard': {
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-300',
    binColor: '#78716c',
    binName: 'Blue Bin (Paper & Cardboard)',
  },
  'Glass': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    binColor: '#0891b2',
    binName: 'Blue Bin (Glass / Handle Carefully)',
  },
  'Organic/wet waste': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    binColor: '#059669',
    binName: 'Green Bin (Wet / Compostable)',
  },
  'Electronic waste': {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    binColor: '#7c3aed',
    binName: 'Red Bin / E-Waste Drop-off',
  },
  'General/mixed waste': {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    binColor: '#4b5563',
    binName: 'Black Bin (Non-recyclable / Residual)',
  },
  'Unknown or uncertain': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
    binColor: '#e11d48',
    binName: 'Manual Sorting Required',
  },
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ResidentAddress {
  id: string;
  resident_id: string;
  house_id: string;
  street_address: string;
  area_locality: string;
  city: string;
  state?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
  created_at?: string;
}

export interface CollectorAttendance {
  id: string;
  collector_id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_out_latitude?: number;
  check_out_longitude?: number;
  status: 'present' | 'completed' | 'half_day' | 'on_duty';
  notes?: string;
  collector?: Profile;
}

export type PickupStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'missed' | 'cancelled';

export interface Pickup {
  id: string;
  resident_id: string;
  address_id?: string;
  collector_id?: string;
  status: PickupStatus;
  scheduled_date: string;
  completed_at?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  total_weight_kg?: number;
  notes?: string;
  created_at?: string;
  resident?: Profile;
  collector?: Profile;
  address?: ResidentAddress;
  scans?: WasteScan[];
}

export interface WasteScan {
  id: string;
  pickup_id?: string;
  collector_id: string;
  resident_id?: string;
  image_url: string;
  image_storage_path?: string;
  detected_category: WasteCategory;
  confirmed_category: WasteCategory;
  specific_label?: string;
  confidence_score?: number;
  is_uncertain?: boolean;
  quantity_count: number;
  estimated_weight_kg: number;
  disposal_recommendation?: string;
  recycling_guidelines?: string;
  hazard_warning?: string;
  scan_latitude?: number;
  scan_longitude?: number;
  scan_address?: string;
  scanned_at: string;
  collector?: Profile;
  resident?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'pickup_scheduled' | 'pickup_completed' | 'waste_scanned' | 'attendance' | 'system' | 'alert';
  pickup_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AIClassificationResult {
  category: WasteCategory;
  specificLabel: string;
  confidence: number;
  isUncertain: boolean;
  recommendedDisposal: string;
  recyclingGuidelines: string;
  estimatedWeightKg: number;
  hazardWarning: string;
  visualCues: string;
}
