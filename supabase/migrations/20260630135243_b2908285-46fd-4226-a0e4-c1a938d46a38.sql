
CREATE OR REPLACE FUNCTION public.get_professional_insurances(_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hi.id, hi.name
  FROM public.professional_insurances pi
  JOIN public.health_insurances hi ON hi.id = pi.health_insurance_id
  JOIN public.professionals p ON p.id = pi.professional_id
  WHERE pi.professional_id = _id
    AND hi.active = true
    AND p.active = true
    AND p.show_on_landing = true
  ORDER BY hi.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_insurances(uuid) TO anon, authenticated;
