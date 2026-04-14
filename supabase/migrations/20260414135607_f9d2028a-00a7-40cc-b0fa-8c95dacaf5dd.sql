
-- Revert to security_invoker = true (default safe behavior)
DROP VIEW IF EXISTS public.professionals_public;
CREATE VIEW public.professionals_public
WITH (security_invoker = true)
AS
SELECT id, full_name, specialty_id, service_type, active
FROM public.professionals
WHERE active = true;

GRANT SELECT ON public.professionals_public TO authenticated;
GRANT SELECT ON public.professionals_public TO anon;

-- Add RLS policy so patients can read professionals (the view only exposes safe columns)
CREATE POLICY "Patients can view active professionals"
ON public.professionals
FOR SELECT
TO authenticated
USING (
  active = true
  AND has_role(auth.uid(), 'paciente'::app_role)
);
