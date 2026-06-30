CREATE OR REPLACE FUNCTION public.ensure_anamnesis_on_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'finalizado'::appointment_status
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.anamnesis (patient_id, appointment_id, professional_id)
    SELECT NEW.patient_id, NEW.id, NEW.professional_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.anamnesis WHERE appointment_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_anamnesis_on_finish ON public.appointments;
CREATE TRIGGER trg_ensure_anamnesis_on_finish
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.ensure_anamnesis_on_finish();

-- Preencher para agendamentos já finalizados sem prontuário
INSERT INTO public.anamnesis (patient_id, appointment_id, professional_id)
SELECT a.patient_id, a.id, a.professional_id
FROM public.appointments a
WHERE a.status = 'finalizado'::appointment_status
  AND NOT EXISTS (SELECT 1 FROM public.anamnesis x WHERE x.appointment_id = a.id);