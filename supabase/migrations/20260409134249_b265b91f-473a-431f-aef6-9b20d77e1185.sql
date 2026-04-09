
-- Change default value of active to true
ALTER TABLE public.patients ALTER COLUMN active SET DEFAULT true;

-- Update the signup trigger to create patients with active = true
CREATE OR REPLACE FUNCTION public.handle_new_patient_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _cpf text;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sem nome');
  _cpf := NEW.raw_user_meta_data->>'cpf';

  IF _cpf IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, _full_name, NEW.email)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.patients (user_id, full_name, email, cpf, active)
    VALUES (NEW.id, _full_name, NEW.email, _cpf, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'paciente')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
