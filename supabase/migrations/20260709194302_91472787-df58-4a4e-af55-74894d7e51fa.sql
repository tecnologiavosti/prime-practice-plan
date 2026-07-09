
-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id) WHERE read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Helper: broadcast to admin/recepcao + a specific user
CREATE OR REPLACE FUNCTION public.notify_staff(_title text, _message text, _link text, _extra_user uuid DEFAULT NULL, _type text DEFAULT 'info')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, link)
  SELECT DISTINCT ur.user_id, _type, _title, _message, _link
  FROM public.user_roles ur
  WHERE ur.role IN ('administrador'::app_role, 'recepcao'::app_role);

  IF _extra_user IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link)
    VALUES (_extra_user, _type, _title, _message, _link);
  END IF;
END;
$$;

-- Trigger on appointments
CREATE OR REPLACE FUNCTION public.notify_on_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pname text;
  _prof_uid uuid;
  _prof_name text;
  _title text;
  _msg text;
BEGIN
  SELECT full_name INTO _pname FROM public.patients WHERE id = NEW.patient_id;
  SELECT user_id, full_name INTO _prof_uid, _prof_name FROM public.professionals WHERE id = NEW.professional_id;

  IF TG_OP = 'INSERT' THEN
    _title := 'Novo agendamento';
    _msg := COALESCE(_pname,'Paciente') || ' com ' || COALESCE(_prof_name,'Profissional') ||
            ' em ' || to_char(NEW.appointment_date,'DD/MM/YYYY') || ' às ' || to_char(NEW.start_time,'HH24:MI');
    PERFORM public.notify_staff(_title, _msg, '/admin/agendamentos', _prof_uid, 'appointment');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    _title := 'Agendamento ' || NEW.status;
    _msg := COALESCE(_pname,'Paciente') || ' — ' || to_char(NEW.appointment_date,'DD/MM/YYYY') || ' ' || to_char(NEW.start_time,'HH24:MI');
    PERFORM public.notify_staff(_title, _msg, '/admin/agendamentos', _prof_uid,
      CASE WHEN NEW.status = 'cancelado' THEN 'warning' ELSE 'appointment' END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment ON public.appointments;
CREATE TRIGGER trg_notify_appointment
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_change();

-- Daily reminder function (24h before)
CREATE OR REPLACE FUNCTION public.create_daily_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec RECORD;
  _pname text;
  _prof_uid uuid;
  _prof_name text;
  _msg text;
BEGIN
  FOR _rec IN
    SELECT id, patient_id, professional_id, appointment_date, start_time
    FROM public.appointments
    WHERE appointment_date = (CURRENT_DATE + 1)
      AND status NOT IN ('cancelado','faltou','finalizado')
    UNION ALL
    SELECT a.id, a.patient_id, a.professional_id, s.session_date, s.start_time
    FROM public.appointment_sessions s
    JOIN public.appointments a ON a.id = s.appointment_id
    WHERE s.session_date = (CURRENT_DATE + 1)
      AND COALESCE(s.status,'agendado') NOT IN ('cancelado','faltou','finalizado')
  LOOP
    SELECT full_name INTO _pname FROM public.patients WHERE id = _rec.patient_id;
    SELECT user_id, full_name INTO _prof_uid, _prof_name FROM public.professionals WHERE id = _rec.professional_id;
    _msg := COALESCE(_pname,'Paciente') || ' com ' || COALESCE(_prof_name,'Profissional') ||
            ' amanhã às ' || to_char(_rec.start_time,'HH24:MI');
    PERFORM public.notify_staff('Lembrete: consulta amanhã', _msg, '/admin/agendamentos', _prof_uid, 'reminder');
  END LOOP;
END;
$$;

-- Schedule daily at 08:00 (server UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  PERFORM cron.unschedule('daily-appointment-reminders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule('daily-appointment-reminders', '0 11 * * *', $$SELECT public.create_daily_appointment_reminders();$$);
