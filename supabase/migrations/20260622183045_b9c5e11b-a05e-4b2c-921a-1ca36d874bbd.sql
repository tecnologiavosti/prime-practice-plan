
ALTER TABLE public.professionals 
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS show_on_landing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_bio text;

CREATE OR REPLACE FUNCTION public.get_landing_professionals()
RETURNS TABLE(id uuid, full_name text, photo_url text, landing_bio text, specialty_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.photo_url, p.landing_bio, s.name
  FROM public.professionals p
  LEFT JOIN public.specialties s ON s.id = p.specialty_id
  WHERE p.active = true AND p.show_on_landing = true
  ORDER BY p.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_professionals() TO anon, authenticated;
