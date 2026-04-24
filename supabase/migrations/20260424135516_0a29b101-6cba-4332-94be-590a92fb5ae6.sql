-- Função security definer: profissional logado atende este paciente?
CREATE OR REPLACE FUNCTION public.professional_treats_patient(_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.patient_id = _patient_id
      AND a.professional_id = public.current_professional_id()
  );
$$;

-- Função security definer: este paciente pertence ao usuário logado?
CREATE OR REPLACE FUNCTION public.is_own_patient(_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = _patient_id AND user_id = auth.uid()
  );
$$;

-- Refatorar política de profissionais sobre pacientes (sem subquery direta)
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.patients;
CREATE POLICY "Professionals can view their patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND public.professional_treats_patient(id)
);

-- Refatorar política de pacientes sobre seus appointments (sem subquery direta em patients)
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
USING (public.is_own_patient(patient_id));

DROP POLICY IF EXISTS "Patients can create own appointments" ON public.appointments;
CREATE POLICY "Patients can create own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (public.is_own_patient(patient_id));
