
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS landing_whatsapp text;

DROP FUNCTION IF EXISTS public.get_landing_professional(uuid);

CREATE OR REPLACE FUNCTION public.get_landing_professional(_id uuid)
 RETURNS TABLE(id uuid, full_name text, photo_url text, landing_bio text, landing_about text, landing_curriculum text, specialty_name text, landing_whatsapp text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name, p.photo_url, p.landing_bio,
         p.landing_about, p.landing_curriculum, s.name, p.landing_whatsapp
  FROM public.professionals p
  LEFT JOIN public.specialties s ON s.id = p.specialty_id
  WHERE p.id = _id AND p.active = true AND p.show_on_landing = true;
$function$;
