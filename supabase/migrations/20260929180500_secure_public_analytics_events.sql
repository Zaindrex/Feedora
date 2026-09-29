DROP POLICY IF EXISTS "Customers record active business events" ON public.analytics_events;

CREATE POLICY "Customers record active business events"
  ON public.analytics_events FOR INSERT TO anon
  WITH CHECK (public.is_active_review_session(business_id, session_id));
