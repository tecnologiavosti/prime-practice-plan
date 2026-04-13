
-- 1. Drop the overly broad SELECT policy on professionals
DROP POLICY IF EXISTS "Authenticated users can view professionals" ON public.professionals;
DROP POLICY IF EXISTS "Patients can view active professionals limited" ON public.professionals;

-- 2. Create a restrictive SELECT policy: only staff roles (not paciente) can read the full table
CREATE POLICY "Staff can view all professionals"
  ON public.professionals
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador'::app_role)
    OR has_role(auth.uid(), 'recepcao'::app_role)
    OR has_role(auth.uid(), 'financeiro'::app_role)
    OR has_role(auth.uid(), 'profissional'::app_role)
  );

-- 3. Grant SELECT on the public view so patients can still book appointments
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT SELECT ON public.professionals_public TO anon;

-- 4. Make check_appointment_overlap a SECURITY DEFINER so it can validate
-- overlaps server-side without the caller needing full table access
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('cancelado', 'faltou') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND professional_id = NEW.professional_id
      AND appointment_date = NEW.appointment_date
      AND status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT_PROFESSIONAL: Este profissional já possui um atendimento neste horário.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND patient_id = NEW.patient_id
      AND appointment_date = NEW.appointment_date
      AND status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT_PATIENT: Este paciente já possui um atendimento neste horário.';
  END IF;

  RETURN NEW;
END;
$$;
