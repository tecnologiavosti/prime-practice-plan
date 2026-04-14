
-- Recreate the view with security_invoker = false so it bypasses RLS on professionals
DROP VIEW IF EXISTS public.professionals_public;
CREATE VIEW public.professionals_public
WITH (security_invoker = false)
AS
SELECT id, full_name, specialty_id, service_type, active
FROM public.professionals
WHERE active = true;

-- Grant SELECT to authenticated and anon roles
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT SELECT ON public.professionals_public TO anon;
