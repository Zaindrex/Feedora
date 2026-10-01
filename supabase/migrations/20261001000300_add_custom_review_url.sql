ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS custom_review_url TEXT;

DROP FUNCTION public.get_public_business_by_slug(TEXT);

CREATE FUNCTION public.get_public_business_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  description TEXT,
  category TEXT,
  address TEXT,
  google_review_url TEXT,
  custom_review_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.id, b.name, b.slug, b.logo_url, b.description, b.category, b.address,
         b.google_review_url, b.custom_review_url
  FROM public.businesses AS b
  WHERE lower(b.slug) = lower(p_slug) AND b.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_business_by_slug(TEXT) TO anon, authenticated;