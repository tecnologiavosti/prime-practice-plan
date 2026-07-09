
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view rooms" ON public.rooms FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'recepcao') OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'profissional'));
CREATE POLICY "Admin/reception manage rooms" ON public.rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'recepcao'))
  WITH CHECK (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'recepcao'));

CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_room_date ON public.appointments(room_id, appointment_date);

-- Update overlap trigger to also block room conflicts
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF NEW.room_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND room_id = NEW.room_id
      AND appointment_date = NEW.appointment_date
      AND status NOT IN ('cancelado', 'faltou')
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT_ROOM: Esta sala já está ocupada neste horário.';
  END IF;

  RETURN NEW;
END;
$function$;
