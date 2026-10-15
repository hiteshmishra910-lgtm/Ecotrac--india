import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Profile,
  ResidentAddress,
  Pickup,
  WasteScan,
  CollectorAttendance,
  NotificationItem,
  UserRole,
} from './types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawUrl &&
    rawKey &&
    !rawUrl.includes('your-project') &&
    !rawKey.includes('your-supabase-anon-key') &&
    rawUrl.startsWith('https://')
  );
};

export const getSupabaseConfig = () => {
  return {
    configured: isSupabaseConfigured(),
    url: rawUrl,
    hasKey: Boolean(rawKey && !rawKey.includes('your-supabase-anon-key')),
  };
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// =====================================================================
// Local Storage Persistence Cache & Demo Fallback Store
// Used when Supabase credentials have not yet been provided in .env,
// guaranteeing zero crashes and full interactivity out-of-the-box!
// =====================================================================

const LOCAL_STORAGE_KEY = 'ecotrack_india_store_v1';

interface LocalStoreState {
  profiles: Profile[];
  addresses: ResidentAddress[];
  attendance: CollectorAttendance[];
  pickups: Pickup[];
  scans: WasteScan[];
  notifications: NotificationItem[];
  currentUserId: string | null;
}

const initialSeedProfiles: Profile[] = [
  {
    id: 'res-101',
    email: 'resident.sharma@example.com',
    full_name: 'Ananya Sharma',
    role: 'resident',
    phone: '+91 98450 12345',
    is_active: true,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'col-201',
    email: 'collector.ramesh@ecotrack.in',
    full_name: 'Ramesh Kumar',
    role: 'collector',
    phone: '+91 94480 67890',
    is_active: true,
    created_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'adm-301',
    email: 'admin.priya@ecotrack.in',
    full_name: 'Dr. Priya Varma',
    role: 'admin',
    phone: '+91 98860 99887',
    is_active: true,
    created_at: '2026-01-10T10:00:00Z',
  },
];

const initialSeedAddresses: ResidentAddress[] = [
  {
    id: 'addr-1',
    resident_id: 'res-101',
    house_id: 'Flat 402, Block Orchid',
    street_address: '14th Main, 4th Sector, HSR Layout',
    area_locality: 'HSR Layout',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
    latitude: 12.9121,
    longitude: 77.6446,
    is_primary: true,
    created_at: '2026-03-01T08:30:00Z',
  },
];

const initialSeedAttendance: CollectorAttendance[] = [
  {
    id: 'att-1',
    collector_id: 'col-201',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    check_in_latitude: 12.9135,
    check_in_longitude: 77.6432,
    status: 'on_duty',
    notes: 'Morning ward collection shift started at HSR Layout Depot',
  },
];

const initialSeedPickups: Pickup[] = [
  {
    id: 'pick-1',
    resident_id: 'res-101',
    address_id: 'addr-1',
    collector_id: 'col-201',
    status: 'in_progress',
    scheduled_date: new Date().toISOString().split('T')[0],
    pickup_latitude: 12.9121,
    pickup_longitude: 77.6446,
    total_weight_kg: 2.8,
    notes: 'Segregated dry plastic and wet organic waste ready for morning pickup',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'pick-2',
    resident_id: 'res-101',
    address_id: 'addr-1',
    collector_id: 'col-201',
    status: 'completed',
    scheduled_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    completed_at: new Date(Date.now() - 82800000).toISOString(),
    pickup_latitude: 12.9121,
    pickup_longitude: 77.6446,
    total_weight_kg: 4.2,
    notes: 'Recyclable cardboard boxes and metal cans picked up successfully',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const initialSeedScans: WasteScan[] = [
  {
    id: 'scan-1',
    pickup_id: 'pick-1',
    collector_id: 'col-201',
    resident_id: 'res-101',
    image_url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=600&q=80',
    detected_category: 'Plastic',
    confirmed_category: 'Plastic',
    specific_label: 'PET Plastic Water Bottle',
    confidence_score: 0.965,
    is_uncertain: false,
    quantity_count: 3,
    estimated_weight_kg: 0.12,
    disposal_recommendation: 'Crushed flat and sorted into Blue Recyclables bin.',
    recycling_guidelines: 'Swachh Bharat Blue Bin (Dry Recyclables)',
    hazard_warning: 'None',
    scan_latitude: 12.9121,
    scan_longitude: 77.6446,
    scan_address: '14th Main, HSR Layout, Bengaluru',
    scanned_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'scan-2',
    pickup_id: 'pick-2',
    collector_id: 'col-201',
    resident_id: 'res-101',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    detected_category: 'Metal',
    confirmed_category: 'Metal',
    specific_label: 'Aluminum Beverage Cans',
    confidence_score: 0.942,
    is_uncertain: false,
    quantity_count: 5,
    estimated_weight_kg: 0.45,
    disposal_recommendation: 'Rinsed and placed in dry bin for metal recycling scrap recovery.',
    recycling_guidelines: 'Swachh Bharat Blue Bin (Dry Recyclables)',
    hazard_warning: 'None',
    scan_latitude: 12.9121,
    scan_longitude: 77.6446,
    scan_address: '14th Main, HSR Layout, Bengaluru',
    scanned_at: new Date(Date.now() - 82800000).toISOString(),
  },
];

const initialSeedNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'res-101',
    title: 'Waste Collector Assigned',
    message: 'Collector Ramesh Kumar has been assigned to your scheduled morning pickup.',
    type: 'pickup_scheduled',
    pickup_id: 'pick-1',
    is_read: false,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'res-101',
    title: 'Waste Collection Verified',
    message: 'Yesterday pickup verified: 4.2 kg dry recyclables saved from landfill.',
    type: 'pickup_completed',
    pickup_id: 'pick-2',
    is_read: true,
    created_at: new Date(Date.now() - 80000000).toISOString(),
  },
];

function getLocalStore(): LocalStoreState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return {
    profiles: initialSeedProfiles,
    addresses: initialSeedAddresses,
    attendance: initialSeedAttendance,
    pickups: initialSeedPickups,
    scans: initialSeedScans,
    notifications: initialSeedNotifications,
    currentUserId: 'col-201', // Default to collector for instant testing of camera scanning
  };
}

function saveLocalStore(state: LocalStoreState) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not write to localStorage', e);
  }
}

// =====================================================================
// Unified Data API (Routes to Supabase or Persistent Store)
// =====================================================================

export async function getCurrentProfile(): Promise<Profile | null> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) return profile as Profile;
    } catch (err) {
      console.warn('Supabase profile fetch error, falling back to local session:', err);
    }
  }

  const store = getLocalStore();
  const found = store.profiles.find((p) => p.id === store.currentUserId);
  return found || store.profiles[1]; // Ramesh Kumar (collector) by default
}

export async function switchLocalUser(userId: string): Promise<Profile | null> {
  const store = getLocalStore();
  const profile = store.profiles.find((p) => p.id === userId);
  if (profile) {
    store.currentUserId = userId;
    saveLocalStore(store);
    return profile;
  }
  return null;
}

export async function signUpUser(
  email: string,
  pass: string,
  fullName: string,
  role: UserRole,
  phone?: string
): Promise<{ user: Profile | null; error: string | null }> {
  // If user tries to self-assign admin via public registration, prevent it!
  const safeRole: UserRole = role === 'admin' ? 'resident' : role;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            role: safeRole,
            phone: phone || '',
          },
        },
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        // Wait a tick or fetch created profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        return {
          user: (profile as Profile) || {
            id: data.user.id,
            email,
            full_name: fullName,
            role: safeRole,
            phone,
          },
          error: null,
        };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Registration failed' };
    }
  }

  // Local fallback registration
  const store = getLocalStore();
  const existing = store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { user: null, error: 'A user with this email address already exists.' };
  }

  const newProfile: Profile = {
    id: `usr-${Date.now()}`,
    email,
    full_name: fullName,
    role: safeRole,
    phone,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.profiles.push(newProfile);
  store.currentUserId = newProfile.id;

  // Add default address if resident
  if (safeRole === 'resident') {
    store.addresses.push({
      id: `addr-${Date.now()}`,
      resident_id: newProfile.id,
      house_id: 'House 1',
      street_address: '1st Cross Road',
      area_locality: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9716,
      longitude: 77.5946,
      is_primary: true,
      created_at: new Date().toISOString(),
    });
  }

  saveLocalStore(store);
  return { user: newProfile, error: null };
}

export async function signInUser(
  email: string,
  pass: string
): Promise<{ user: Profile | null; error: string | null }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        return { user: profile as Profile, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign in failed' };
    }
  }

  // Local fallback sign in
  const store = getLocalStore();
  const profile = store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (!profile) {
    return { user: null, error: 'Invalid credentials or user not found. (Use seed accounts or register)' };
  }

  store.currentUserId = profile.id;
  saveLocalStore(store);
  return { user: profile, error: null };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error', e);
    }
  }
  const store = getLocalStore();
  store.currentUserId = null;
  saveLocalStore(store);
}

// ---------------------------------------------------------------------
// Resident Services
// ---------------------------------------------------------------------

export async function getResidentData(residentId: string) {
  if (supabase) {
    try {
      const [addrRes, pickRes, scanRes, notifRes] = await Promise.all([
        supabase.from('resident_addresses').select('*').eq('resident_id', residentId),
        supabase.from('pickups').select('*, collector:profiles!collector_id(*)').eq('resident_id', residentId).order('created_at', { ascending: false }),
        supabase.from('waste_scans').select('*').eq('resident_id', residentId).order('scanned_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', residentId).order('created_at', { ascending: false }),
      ]);

      return {
        addresses: (addrRes.data as ResidentAddress[]) || [],
        pickups: (pickRes.data as Pickup[]) || [],
        scans: (scanRes.data as WasteScan[]) || [],
        notifications: (notifRes.data as NotificationItem[]) || [],
      };
    } catch (e) {
      console.warn('Supabase resident fetch fallback', e);
    }
  }

  const store = getLocalStore();
  const addresses = store.addresses.filter((a) => a.resident_id === residentId);
  const pickups = store.pickups
    .filter((p) => p.resident_id === residentId)
    .map((p) => ({
      ...p,
      collector: store.profiles.find((pr) => pr.id === p.collector_id),
      address: store.addresses.find((a) => a.id === p.address_id),
    }));
  const scans = store.scans.filter((s) => s.resident_id === residentId);
  const notifications = store.notifications.filter((n) => n.user_id === residentId);

  return { addresses, pickups, scans, notifications };
}

export async function updateResidentAddress(address: Partial<ResidentAddress> & { id: string }) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resident_addresses')
        .update(address)
        .eq('id', address.id)
        .select()
        .single();
      if (!error && data) return data as ResidentAddress;
    } catch (e) {
      console.warn('Supabase update address fallback', e);
    }
  }

  const store = getLocalStore();
  const idx = store.addresses.findIndex((a) => a.id === address.id);
  if (idx !== -1) {
    store.addresses[idx] = { ...store.addresses[idx], ...address };
    saveLocalStore(store);
    return store.addresses[idx];
  }
  return null;
}

export async function createPickupRequest(
  residentId: string,
  addressId: string,
  scheduledDate: string,
  notes?: string
): Promise<Pickup> {
  const newPickupData = {
    resident_id: residentId,
    address_id: addressId,
    scheduled_date: scheduledDate,
    status: 'pending' as const,
    notes: notes || 'Standard household waste pickup request',
    total_weight_kg: 0,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .insert(newPickupData)
        .select('*, collector:profiles!collector_id(*)')
        .single();
      if (!error && data) return data as Pickup;
    } catch (e) {
      console.warn('Supabase create pickup fallback', e);
    }
  }

  const store = getLocalStore();
  const newPickup: Pickup = {
    id: `pick-${Date.now()}`,
    ...newPickupData,
    created_at: new Date().toISOString(),
    address: store.addresses.find((a) => a.id === addressId),
  };
  store.pickups.unshift(newPickup);

  // Notify resident
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: residentId,
    title: 'Pickup Scheduled',
    message: `Your pickup request for ${scheduledDate} has been confirmed. A collector will be assigned shortly.`,
    type: 'pickup_scheduled',
    pickup_id: newPickup.id,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return newPickup;
}

// ---------------------------------------------------------------------
// Collector Services
// ---------------------------------------------------------------------

export async function getCollectorData(collectorId: string) {
  if (supabase) {
    try {
      const [attRes, pickRes, scanRes] = await Promise.all([
        supabase.from('collector_attendance').select('*').eq('collector_id', collectorId).order('attendance_date', { ascending: false }),
        supabase.from('pickups').select('*, resident:profiles!resident_id(*), address:resident_addresses!address_id(*)').order('created_at', { ascending: false }),
        supabase.from('waste_scans').select('*').eq('collector_id', collectorId).order('scanned_at', { ascending: false }),
      ]);

      return {
        attendance: (attRes.data as CollectorAttendance[]) || [],
        pickups: (pickRes.data as Pickup[]) || [],
        scans: (scanRes.data as WasteScan[]) || [],
      };
    } catch (e) {
      console.warn('Supabase collector fetch fallback', e);
    }
  }

  const store = getLocalStore();
  const attendance = store.attendance.filter((a) => a.collector_id === collectorId);
  const pickups = store.pickups.map((p) => ({
    ...p,
    resident: store.profiles.find((pr) => pr.id === p.resident_id),
    address: store.addresses.find((a) => a.id === p.address_id),
  }));
  const scans = store.scans.filter((s) => s.collector_id === collectorId);

  return { attendance, pickups, scans };
}

export async function saveWasteScanRecord(scanData: Omit<WasteScan, 'id' | 'scanned_at'>): Promise<WasteScan> {
  const timestamp = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('waste_scans')
        .insert({
          ...scanData,
          scanned_at: timestamp,
        })
        .select()
        .single();

      if (!error && data) {
        // If tied to a pickup, update pickup total weight and status
        if (scanData.pickup_id) {
          try {
            await supabase.rpc('increment_pickup_weight', {
              p_pickup_id: scanData.pickup_id,
              p_weight: scanData.estimated_weight_kg || 0,
            });
          } catch {
            // Ignore optional RPC increment error if function not created yet
          }
        }
        return data as WasteScan;
      }
    } catch (e) {
      console.warn('Supabase scan insert fallback', e);
    }
  }

  const store = getLocalStore();
  const newScan: WasteScan = {
    id: `scan-${Date.now()}`,
    ...scanData,
    scanned_at: timestamp,
    collector: store.profiles.find((p) => p.id === scanData.collector_id),
    resident: store.profiles.find((p) => p.id === scanData.resident_id),
  };

  store.scans.unshift(newScan);

  // If associated with a pickup, update pickup stats
  if (scanData.pickup_id) {
    const pickup = store.pickups.find((p) => p.id === scanData.pickup_id);
    if (pickup) {
      pickup.total_weight_kg = (pickup.total_weight_kg || 0) + (scanData.estimated_weight_kg || 0.1);
      pickup.status = 'in_progress';

      // Send notification to the resident
      if (pickup.resident_id) {
        store.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: pickup.resident_id,
          title: `Waste Item Scanned: ${scanData.confirmed_category}`,
          message: `Collector logged ${scanData.quantity_count}x ${scanData.specific_label || scanData.confirmed_category} (~${scanData.estimated_weight_kg} kg).`,
          type: 'waste_scanned',
          pickup_id: pickup.id,
          is_read: false,
          created_at: timestamp,
        });
      }
    }
  }

  saveLocalStore(store);
  return newScan;
}

export async function markCollectorAttendance(
  collectorId: string,
  isCheckIn: boolean,
  coords?: { latitude: number; longitude: number },
  notes?: string
): Promise<CollectorAttendance> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  if (supabase) {
    try {
      if (isCheckIn) {
        const { data, error } = await supabase
          .from('collector_attendance')
          .insert({
            collector_id: collectorId,
            attendance_date: today,
            check_in_time: now,
            check_in_latitude: coords?.latitude,
            check_in_longitude: coords?.longitude,
            status: 'present',
            notes: notes || 'Checked in via mobile app',
          })
          .select()
          .single();
        if (!error && data) return data as CollectorAttendance;
      } else {
        const { data, error } = await supabase
          .from('collector_attendance')
          .update({
            check_out_time: now,
            check_out_latitude: coords?.latitude,
            check_out_longitude: coords?.longitude,
            status: 'completed',
            notes,
          })
          .eq('collector_id', collectorId)
          .eq('attendance_date', today)
          .select()
          .single();
        if (!error && data) return data as CollectorAttendance;
      }
    } catch (e) {
      console.warn('Supabase attendance fallback', e);
    }
  }

  const store = getLocalStore();
  let existing = store.attendance.find(
    (a) => a.collector_id === collectorId && a.attendance_date === today
  );

  if (isCheckIn) {
    if (!existing) {
      existing = {
        id: `att-${Date.now()}`,
        collector_id: collectorId,
        attendance_date: today,
        check_in_time: now,
        check_in_latitude: coords?.latitude,
        check_in_longitude: coords?.longitude,
        status: 'on_duty',
        notes: notes || 'On-duty shift started',
      };
      store.attendance.unshift(existing);
    }
  } else {
    if (existing) {
      existing.check_out_time = now;
      existing.check_out_latitude = coords?.latitude;
      existing.check_out_longitude = coords?.longitude;
      existing.status = 'completed';
      if (notes) existing.notes = notes;
    }
  }

  saveLocalStore(store);
  return (
    existing || {
      id: `att-${Date.now()}`,
      collector_id: collectorId,
      attendance_date: today,
      check_in_time: now,
      status: 'present',
    }
  );
}

export async function completePickup(
  pickupId: string,
  collectorId: string,
  coords?: { latitude: number; longitude: number }
): Promise<Pickup | null> {
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .update({
          status: 'completed',
          completed_at: now,
          collector_id: collectorId,
          pickup_latitude: coords?.latitude,
          pickup_longitude: coords?.longitude,
        })
        .eq('id', pickupId)
        .select()
        .single();
      if (!error && data) return data as Pickup;
    } catch (e) {
      console.warn('Supabase complete pickup fallback', e);
    }
  }

  const store = getLocalStore();
  const pickup = store.pickups.find((p) => p.id === pickupId);
  if (pickup) {
    pickup.status = 'completed';
    pickup.completed_at = now;
    pickup.collector_id = collectorId;
    if (coords) {
      pickup.pickup_latitude = coords.latitude;
      pickup.pickup_longitude = coords.longitude;
    }

    if (pickup.resident_id) {
      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: pickup.resident_id,
        title: 'Waste Collection Completed',
        message: `Your waste pickup has been completed successfully. Thank you for segregating!`,
        type: 'pickup_completed',
        pickup_id: pickup.id,
        is_read: false,
        created_at: now,
      });
    }

    saveLocalStore(store);
    return pickup;
  }
  return null;
}

// ---------------------------------------------------------------------
// Admin Services
// ---------------------------------------------------------------------

export async function getAdminData() {
  if (supabase) {
    try {
      const [profRes, pickRes, scanRes, attRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('pickups').select('*, resident:profiles!resident_id(*), collector:profiles!collector_id(*), address:resident_addresses!address_id(*)').order('created_at', { ascending: false }),
        supabase.from('waste_scans').select('*, collector:profiles!collector_id(*), resident:profiles!resident_id(*)').order('scanned_at', { ascending: false }),
        supabase.from('collector_attendance').select('*, collector:profiles!collector_id(*)').order('check_in_time', { ascending: false }),
      ]);

      return {
        profiles: (profRes.data as Profile[]) || [],
        pickups: (pickRes.data as Pickup[]) || [],
        scans: (scanRes.data as WasteScan[]) || [],
        attendance: (attRes.data as CollectorAttendance[]) || [],
      };
    } catch (e) {
      console.warn('Supabase admin fetch fallback', e);
    }
  }

  const store = getLocalStore();
  const pickups = store.pickups.map((p) => ({
    ...p,
    resident: store.profiles.find((pr) => pr.id === p.resident_id),
    collector: store.profiles.find((pr) => pr.id === p.collector_id),
    address: store.addresses.find((a) => a.id === p.address_id),
  }));

  const scans = store.scans.map((s) => ({
    ...s,
    collector: store.profiles.find((pr) => pr.id === s.collector_id),
    resident: store.profiles.find((pr) => pr.id === s.resident_id),
  }));

  const attendance = store.attendance.map((a) => ({
    ...a,
    collector: store.profiles.find((pr) => pr.id === a.collector_id),
  }));

  return {
    profiles: store.profiles,
    pickups,
    scans,
    attendance,
  };
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase update role fallback', e);
    }
  }

  const store = getLocalStore();
  const profile = store.profiles.find((p) => p.id === userId);
  if (profile) {
    profile.role = newRole;
    saveLocalStore(store);
    return true;
  }
  return false;
}
