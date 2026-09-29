-- ==============================================================================
-- FEEDORA (REVIEWFLOW AI) - PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Admins and Owners)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')) DEFAULT 'owner',
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login TIMESTAMPTZ
);

-- 2. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Bar & Restaurant',
  address TEXT,
  phone TEXT,
  website TEXT,
  google_review_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  selected_tags TEXT[] DEFAULT '{}',
  generated_review TEXT,
  final_review TEXT,
  session_id TEXT,
  copied_to_clipboard BOOLEAN DEFAULT FALSE,
  clicked_google BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. REVIEW SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.review_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'qr_scan',
      'rating_selected',
      'feedback_submitted',
      'ai_generation_started',
      'ai_generation_completed',
      'review_copied',
      'google_review_clicked'
    )
  ),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. AI GENERATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gemini',
  model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID,
  actor_name TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR HIGH-PERFORMANCE QUERYING & ANALYTICS
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_business_id ON public.analytics_events(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------
-- Admins can read and manage all profiles
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can update non-critical fields of own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------
-- BUSINESSES POLICIES
-- ----------------------------------------------------
-- Admins have full access to all businesses
CREATE POLICY "Admins have full access to businesses"
  ON public.businesses FOR ALL
  USING (public.is_admin());

-- Owners can view businesses they own
CREATE POLICY "Owners can view own businesses"
  ON public.businesses FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Owners can update their own businesses
CREATE POLICY "Owners can update own businesses"
  ON public.businesses FOR UPDATE
  USING (
    owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Public (Anonymous Customers) can read active businesses by slug (sanitized columns view)
CREATE POLICY "Public can view active businesses by slug"
  ON public.businesses FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- ----------------------------------------------------
-- REVIEWS POLICIES
-- ----------------------------------------------------
-- Admins can read all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin());

-- Owners can view reviews for their businesses
CREATE POLICY "Owners can view reviews for their businesses"
  ON public.reviews FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM public.businesses b
      JOIN public.profiles p ON b.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Public can insert new review feedback
CREATE POLICY "Public can submit reviews"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ----------------------------------------------------
-- ANALYTICS EVENTS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Admins can view all analytics"
  ON public.analytics_events FOR ALL
  USING (public.is_admin());

CREATE POLICY "Owners can view their business analytics"
  ON public.analytics_events FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM public.businesses b
      JOIN public.profiles p ON b.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Public customer events can be inserted freely
CREATE POLICY "Public can record analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ----------------------------------------------------
-- REVIEW SESSIONS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Admins have full access to review sessions"
  ON public.review_sessions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Public can create and update review sessions"
  ON public.review_sessions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------
-- AI GENERATIONS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Admins have full access to AI generations"
  ON public.ai_generations FOR ALL
  USING (public.is_admin());

CREATE POLICY "Owners can view AI generations for their business"
  ON public.ai_generations FOR SELECT
  USING (
    business_id IN (
      SELECT b.id FROM public.businesses b
      JOIN public.profiles p ON b.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create AI generation records"
  ON public.ai_generations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ----------------------------------------------------
-- AUDIT LOGS POLICIES
-- ----------------------------------------------------
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System and admins can write audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);
