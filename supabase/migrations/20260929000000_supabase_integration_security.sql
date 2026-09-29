-- Secure public customer access while preserving authenticated admin/owner workflows.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Public can view active businesses by slug" ON public.businesses;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Owners can view reviews for their businesses" ON public.reviews;
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Owners can view their business analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Public can record analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins have full access to review sessions" ON public.review_sessions;
DROP POLICY IF EXISTS "Public can create and update review sessions" ON public.review_sessions;
DROP POLICY IF EXISTS "Admins have full access to AI generations" ON public.ai_generations;
DROP POLICY IF EXISTS "Owners can view AI generations for their business" ON public.ai_generations;
DROP POLICY IF EXISTS "Public can create AI generation records" ON public.ai_generations;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System and admins can write audit logs" ON public.audit_logs;

CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'active')
  WITH CHECK (user_id = auth.uid() AND status = 'active');
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (name, phone) ON public.profiles TO authenticated;

CREATE POLICY "Admins manage businesses"
  ON public.businesses FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners read own businesses"
  ON public.businesses FOR SELECT TO authenticated
  USING (public.is_active_owner() AND owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Owners update own businesses"
  ON public.businesses FOR UPDATE TO authenticated
  USING (public.is_active_owner() AND owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND status = 'active'))
  WITH CHECK (public.is_active_owner() AND owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND status = 'active'));
REVOKE ALL ON public.businesses FROM anon, authenticated;
GRANT SELECT, INSERT ON public.businesses TO authenticated;
GRANT UPDATE (name, slug, logo_url, description, category, address, phone, website, google_review_url)
  ON public.businesses TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_business_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  description TEXT,
  category TEXT,
  address TEXT,
  google_review_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.id, b.name, b.slug, b.logo_url, b.description, b.category, b.address, b.google_review_url
  FROM public.businesses AS b
  WHERE lower(b.slug) = lower(p_slug) AND b.status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_business_by_slug(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_public_customer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.start_public_review_session(p_business_id UUID, p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_public_customer() THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id AND status = 'active'
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.review_sessions (business_id, session_id, status)
  VALUES (p_business_id, p_session_id, 'started')
  ON CONFLICT (session_id) DO NOTHING;

  RETURN EXISTS (
    SELECT 1 FROM public.review_sessions
    WHERE session_id = p_session_id AND business_id = p_business_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_public_review_session(UUID, TEXT) TO anon;

CREATE OR REPLACE FUNCTION public.is_active_review_session(p_business_id UUID, p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.review_sessions AS s
    JOIN public.businesses AS b ON b.id = s.business_id
    WHERE s.business_id = p_business_id
      AND s.session_id = p_session_id
      AND b.status = 'active'
        AND public.is_public_customer()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_active_review_session(UUID, TEXT) TO anon;

CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners read own reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.is_active_owner() AND business_id IN (
    SELECT b.id FROM public.businesses AS b
    JOIN public.profiles AS p ON p.id = b.owner_id
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  ));
CREATE POLICY "Customers submit reviews for active sessions"
  ON public.reviews FOR INSERT TO anon
  WITH CHECK (public.is_public_customer() AND public.is_active_review_session(business_id, session_id));
REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT ON public.reviews TO authenticated;
GRANT INSERT ON public.reviews TO anon;

CREATE POLICY "Admins manage analytics"
  ON public.analytics_events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners read own analytics"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_active_owner() AND business_id IN (
    SELECT b.id FROM public.businesses AS b
    JOIN public.profiles AS p ON p.id = b.owner_id
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  ));
CREATE POLICY "Customers record active business events"
  ON public.analytics_events FOR INSERT TO anon
  WITH CHECK (public.is_public_customer() AND EXISTS (
    SELECT 1 FROM public.businesses AS b WHERE b.id = business_id AND b.status = 'active'
  ));
REVOKE ALL ON public.analytics_events FROM anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon;

CREATE POLICY "Admins manage review sessions"
  ON public.review_sessions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners read own review sessions"
  ON public.review_sessions FOR SELECT TO authenticated
  USING (public.is_active_owner() AND business_id IN (
    SELECT b.id FROM public.businesses AS b
    JOIN public.profiles AS p ON p.id = b.owner_id
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  ));
REVOKE ALL ON public.review_sessions FROM anon, authenticated;
GRANT SELECT ON public.review_sessions TO authenticated;

CREATE OR REPLACE FUNCTION public.update_public_review_session(
  p_session_id TEXT,
  p_rating INTEGER,
  p_feedback TEXT,
  p_status TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.review_sessions AS s
  SET rating = COALESCE(p_rating, s.rating),
      feedback = COALESCE(p_feedback, s.feedback),
      status = COALESCE(p_status, s.status)
  WHERE s.session_id = p_session_id
    AND public.is_public_customer()
    AND EXISTS (
      SELECT 1 FROM public.businesses AS b
      WHERE b.id = s.business_id AND b.status = 'active'
    );
$$;
GRANT EXECUTE ON FUNCTION public.update_public_review_session(TEXT, INTEGER, TEXT, TEXT) TO anon;

CREATE POLICY "Admins manage AI generations"
  ON public.ai_generations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Owners read own AI generations"
  ON public.ai_generations FOR SELECT TO authenticated
  USING (public.is_active_owner() AND business_id IN (
    SELECT b.id FROM public.businesses AS b
    JOIN public.profiles AS p ON p.id = b.owner_id
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  ));
REVOKE ALL ON public.ai_generations FROM anon, authenticated;
GRANT SELECT ON public.ai_generations TO authenticated;

CREATE POLICY "Admins read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admins insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  product_name TEXT NOT NULL DEFAULT 'Feedora',
  primary_color TEXT NOT NULL DEFAULT '#0F917D',
  ai_provider TEXT NOT NULL DEFAULT 'gemini' CHECK (ai_provider IN ('gemini', 'openai', 'hybrid_synthesizer')),
  ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  ai_temperature NUMERIC NOT NULL DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 1),
  max_output_length INTEGER NOT NULL DEFAULT 350 CHECK (max_output_length > 0),
  enable_audit_logging BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings"
  ON public.platform_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.platform_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
INSERT INTO public.platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.mark_google_review_clicked(p_session_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.reviews AS r
  SET clicked_google = TRUE
  WHERE r.session_id = p_session_id
    AND public.is_public_customer()
    AND EXISTS (SELECT 1 FROM public.review_sessions AS s WHERE s.session_id = p_session_id);
$$;
GRANT EXECUTE ON FUNCTION public.mark_google_review_clicked(TEXT) TO anon;
