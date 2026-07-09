
-- Sessions table for appointments (multiple dates/times per appointment)
CREATE TABLE public.appointment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_sessions TO authenticated;
GRANT ALL ON public.appointment_sessions TO service_role;

ALTER TABLE public.appointment_sessions ENABLE ROW LEVEL SECURITY;

-- Mirror the parent appointment access
CREATE POLICY "Staff manage sessions"
ON public.appointment_sessions FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador'::app_role)
  OR public.has_role(auth.uid(), 'recepcao'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_sessions.appointment_id
      AND a.professional_id = public.current_professional_id()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'administrador'::app_role)
  OR public.has_role(auth.uid(), 'recepcao'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_sessions.appointment_id
      AND a.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Patients view own sessions"
ON public.appointment_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_sessions.appointment_id
      AND public.is_own_patient(a.patient_id)
  )
);

CREATE INDEX idx_appointment_sessions_appt ON public.appointment_sessions(appointment_id);
CREATE INDEX idx_appointment_sessions_date ON public.appointment_sessions(session_date, start_time);

CREATE TRIGGER update_appointment_sessions_updated_at
BEFORE UPDATE ON public.appointment_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Overlap check for sessions (professional, patient, room)
CREATE OR REPLACE FUNCTION public.check_session_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prof uuid;
  _patient uuid;
  _room uuid;
BEGIN
  IF NEW.status IN ('cancelado', 'faltou') THEN
    RETURN NEW;
  END IF;

  SELECT professional_id, patient_id, room_id
    INTO _prof, _patient, _room
  FROM public.appointments WHERE id = NEW.appointment_id;

  -- Professional conflict (other appointments same slot)
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id <> NEW.appointment_id
      AND professional_id = _prof
      AND appointment_date = NEW.session_date
      AND status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) OR EXISTS (
    SELECT 1 FROM public.appointment_sessions s
    JOIN public.appointments a ON a.id = s.appointment_id
    WHERE s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND s.appointment_id <> NEW.appointment_id
      AND a.professional_id = _prof
      AND s.session_date = NEW.session_date
      AND s.status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < s.end_time
      AND NEW.end_time > s.start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT_PROFESSIONAL: Este profissional já possui um atendimento neste horário.';
  END IF;

  -- Patient conflict
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id <> NEW.appointment_id
      AND patient_id = _patient
      AND appointment_date = NEW.session_date
      AND status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT_PATIENT: Este paciente já possui um atendimento neste horário.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_session_overlap
BEFORE INSERT OR UPDATE ON public.appointment_sessions
FOR EACH ROW EXECUTE FUNCTION public.check_session_overlap();
