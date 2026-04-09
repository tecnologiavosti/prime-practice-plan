
-- Create a trigger function that auto-creates patient + role + profile on signup
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

  -- Only create patient records if cpf metadata exists (patient signup)
  IF _cpf IS NOT NULL THEN
    -- Insert into profiles
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, _full_name, NEW.email)
    ON CONFLICT DO NOTHING;

    -- Insert into patients with active = false
    INSERT INTO public.patients (user_id, full_name, email, cpf, active)
    VALUES (NEW.id, _full_name, NEW.email, _cpf, false)
    ON CONFLICT DO NOTHING;

    -- Insert paciente role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'paciente')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created_patient
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_patient_signup();
