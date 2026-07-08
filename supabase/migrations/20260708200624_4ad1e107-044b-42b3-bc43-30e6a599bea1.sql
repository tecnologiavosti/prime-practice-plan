CREATE OR REPLACE FUNCTION public.get_professional_insurances(_id uuid)
 RETURNS TABLE(id uuid, name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT hi.id, hi.name
  FROM public.professionals p
  LEFT JOIN public.professional_insurances pi ON pi.professional_id = p.id
  LEFT JOIN public.specialty_health_insurances shi ON shi.specialty_id = p.specialty_id
  JOIN public.health_insurances hi
    ON hi.id = COALESCE(pi.health_insurance_id, shi.health_insurance_id)
  WHERE p.id = _id
    AND p.active = true
    AND p.show_on_landing = true
    AND hi.active = true
  ORDER BY hi.name;
$function$;