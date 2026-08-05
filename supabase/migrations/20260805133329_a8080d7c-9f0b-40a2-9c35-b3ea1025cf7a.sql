
CREATE OR REPLACE FUNCTION public.get_professional_insurances(_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT hi.id, hi.name
  FROM public.professionals p
  INNER JOIN public.professional_insurances pi ON pi.professional_id = p.id
  INNER JOIN public.health_insurances hi ON hi.id = pi.health_insurance_id
  WHERE p.id = _id
    AND p.active = true
    AND hi.active = true
  ORDER BY hi.name;
$$;
