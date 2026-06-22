
ALTER TABLE public.professionals 
  ADD COLUMN IF NOT EXISTS landing_about text,
  ADD COLUMN IF NOT EXISTS landing_curriculum text;

CREATE OR REPLACE FUNCTION public.get_landing_professional(_id uuid)
RETURNS TABLE(
  id uuid, full_name text, photo_url text, landing_bio text,
  landing_about text, landing_curriculum text, specialty_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.photo_url, p.landing_bio,
         p.landing_about, p.landing_curriculum, s.name
  FROM public.professionals p
  LEFT JOIN public.specialties s ON s.id = p.specialty_id
  WHERE p.id = _id AND p.active = true AND p.show_on_landing = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_professional(uuid) TO anon, authenticated;
