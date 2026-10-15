-- ====================================================================
-- EcoTrack India — PostgreSQL Supabase Database Schema
-- Production-ready migration script with Tables, Foreign Keys,
-- Indexes, Constraints, Triggers, and Row-Level Security (RLS) Policies
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Roles Enum or Constraint
-- Roles: 'resident', 'collector', 'admin'

-- 3. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('resident', 'collector', 'admin')) DEFAULT 'resident',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index on role & email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Resident Addresses Table
CREATE TABLE IF NOT EXISTS public.resident_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    house_id TEXT NOT NULL, -- e.g. "House 42, Block C"
    street_address TEXT NOT NULL,
    area_locality TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    pincode TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_resident ON public.resident_addresses(resident_id);

-- 5. Collector Attendance Table
CREATE TABLE IF NOT EXISTS public.collector_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    check_out_time TIMESTAMPTZ,
    check_in_latitude DOUBLE PRECISION,
    check_in_longitude DOUBLE PRECISION,
    check_out_latitude DOUBLE PRECISION,
    check_out_longitude DOUBLE PRECISION,
    status TEXT NOT NULL CHECK (status IN ('present', 'completed', 'half_day', 'on_duty')) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_collector_daily_attendance UNIQUE (collector_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_collector ON public.collector_attendance(collector_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.collector_attendance(attendance_date);

-- 6. Waste Pickups Table
CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_id UUID REFERENCES public.resident_addresses(id) ON DELETE SET NULL,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'missed', 'cancelled')) DEFAULT 'pending',
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    total_weight_kg NUMERIC(6, 2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pickups_resident ON public.pickups(resident_id);
CREATE INDEX IF NOT EXISTS idx_pickups_collector ON public.pickups(collector_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON public.pickups(status);
CREATE INDEX IF NOT EXISTS idx_pickups_scheduled_date ON public.pickups(scheduled_date);

-- 7. Waste Scans Table (Camera AI Captures)
CREATE TABLE IF NOT EXISTS public.waste_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID REFERENCES public.pickups(id) ON DELETE SET NULL,
    collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    image_storage_path TEXT,
    detected_category TEXT NOT NULL CHECK (detected_category IN (
        'Plastic',
        'Metal',
        'Paper and cardboard',
        'Glass',
        'Organic/wet waste',
        'Electronic waste',
        'General/mixed waste',
        'Unknown or uncertain'
    )),
    confirmed_category TEXT NOT NULL CHECK (confirmed_category IN (
        'Plastic',
        'Metal',
        'Paper and cardboard',
        'Glass',
        'Organic/wet waste',
        'Electronic waste',
        'General/mixed waste',
        'Unknown or uncertain'
    )),
    specific_label TEXT,
    confidence_score NUMERIC(5, 4),
    is_uncertain BOOLEAN DEFAULT FALSE,
    quantity_count INTEGER DEFAULT 1,
    estimated_weight_kg NUMERIC(6, 2) DEFAULT 0.0,
    disposal_recommendation TEXT,
    recycling_guidelines TEXT,
    hazard_warning TEXT,
    scan_latitude DOUBLE PRECISION,
    scan_longitude DOUBLE PRECISION,
    scan_address TEXT,
    scanned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_collector ON public.waste_scans(collector_id);
CREATE INDEX IF NOT EXISTS idx_scans_pickup ON public.waste_scans(pickup_id);
CREATE INDEX IF NOT EXISTS idx_scans_category ON public.waste_scans(confirmed_category);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.waste_scans(scanned_at);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pickup_scheduled', 'pickup_completed', 'waste_scanned', 'attendance', 'system', 'alert')),
    pickup_id UUID REFERENCES public.pickups(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);

-- ====================================================================
-- Helper Functions & Role Enforcement
-- ====================================================================

-- Function to get the current requesting user's role from public.profiles
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Trigger to create profile upon Supabase auth sign-up
-- Prevents users from assigning themselves 'admin' role directly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- Default to 'resident' unless explicitly marked as 'collector' in user_metadata
  -- Admin role can NEVER be granted during public sign-up
  IF (NEW.raw_user_meta_data->>'role' = 'collector') THEN
    default_role := 'collector';
  ELSE
    default_role := 'resident';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addresses_timestamp BEFORE UPDATE ON public.resident_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pickups_timestamp BEFORE UPDATE ON public.pickups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Everyone can read their own profile; admins can read all profiles; collectors can view resident profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_current_role() = 'admin' OR (public.get_current_role() = 'collector' AND role = 'resident'));

CREATE POLICY "Users can update own basic profile (role locked)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.get_current_role() = 'admin')
  WITH CHECK (
    -- If not admin, the role cannot be changed
    (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.get_current_role() = 'admin'
  );

-- 2. Resident Addresses Policies
CREATE POLICY "Residents can view own addresses"
  ON public.resident_addresses FOR SELECT
  USING (auth.uid() = resident_id OR public.get_current_role() IN ('collector', 'admin'));

CREATE POLICY "Residents can insert own addresses"
  ON public.resident_addresses FOR INSERT
  WITH CHECK (auth.uid() = resident_id OR public.get_current_role() = 'admin');

CREATE POLICY "Residents can update own addresses"
  ON public.resident_addresses FOR UPDATE
  USING (auth.uid() = resident_id OR public.get_current_role() = 'admin');

-- 3. Collector Attendance Policies
CREATE POLICY "Collectors can view own attendance"
  ON public.collector_attendance FOR SELECT
  USING (auth.uid() = collector_id OR public.get_current_role() = 'admin');

CREATE POLICY "Collectors can mark own attendance"
  ON public.collector_attendance FOR INSERT
  WITH CHECK (auth.uid() = collector_id AND public.get_current_role() IN ('collector', 'admin'));

CREATE POLICY "Collectors can update own attendance"
  ON public.collector_attendance FOR UPDATE
  USING (auth.uid() = collector_id OR public.get_current_role() = 'admin');

-- 4. Pickups Policies
CREATE POLICY "Users can view pickups"
  ON public.pickups FOR SELECT
  USING (
    auth.uid() = resident_id
    OR auth.uid() = collector_id
    OR public.get_current_role() IN ('collector', 'admin')
  );

CREATE POLICY "Residents or Admins can create pickups"
  ON public.pickups FOR INSERT
  WITH CHECK (
    auth.uid() = resident_id
    OR public.get_current_role() = 'admin'
  );

CREATE POLICY "Assigned collector or Admin can update pickups"
  ON public.pickups FOR UPDATE
  USING (
    auth.uid() = collector_id
    OR public.get_current_role() IN ('collector', 'admin')
    OR (auth.uid() = resident_id AND status = 'pending')
  );

-- 5. Waste Scans Policies
CREATE POLICY "Scans view policy"
  ON public.waste_scans FOR SELECT
  USING (
    auth.uid() = collector_id
    OR auth.uid() = resident_id
    OR public.get_current_role() = 'admin'
  );

CREATE POLICY "Collectors can insert waste scans"
  ON public.waste_scans FOR INSERT
  WITH CHECK (
    auth.uid() = collector_id
    AND public.get_current_role() IN ('collector', 'admin')
  );

-- 6. Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service or triggers can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- ====================================================================
-- Supabase Storage Bucket Setup (waste-scans)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-images', 'waste-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload waste scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-images');

CREATE POLICY "Authenticated users can view waste scans"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'waste-images');
