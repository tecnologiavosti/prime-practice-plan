
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip check for cancelled/missed appointments
  IF NEW.status IN ('cancelado', 'faltou') THEN
    RETURN NEW;
  END IF;

  -- Check professional overlap
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

  -- Check patient overlap
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

CREATE TRIGGER trg_check_appointment_overlap
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_overlap();
