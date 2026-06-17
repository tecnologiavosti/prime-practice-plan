ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "Professionals can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.patients;
CREATE POLICY "Professionals can view own registered patients" ON public.patients
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND (created_by = auth.uid() OR professional_treats_patient(id))
);