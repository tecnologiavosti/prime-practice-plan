
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS TABLE (
  patients_count integer,
  specialties_count integer,
  professionals_count integer,
  appointments_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.patients WHERE active = true),
    (SELECT COUNT(*)::int FROM public.specialties WHERE active = true),
    (SELECT COUNT(*)::int FROM public.professionals WHERE active = true),
    (SELECT COUNT(*)::int FROM public.appointments WHERE status = 'finalizado'::appointment_status);
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated;
