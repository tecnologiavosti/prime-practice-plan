CREATE TABLE public.authorized_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  invited_by uuid,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_authorized_admins_email ON public.authorized_admins(lower(email));

ALTER TABLE public.authorized_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage authorized_admins"
ON public.authorized_admins FOR ALL
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Anyone can check authorization"
ON public.authorized_admins FOR SELECT
USING (true);

CREATE TRIGGER update_authorized_admins_updated_at
BEFORE UPDATE ON public.authorized_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update signup trigger: only assign 'administrador' role for first user OR if email is in authorized_admins
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- First user in system: becomes admin automatically (bootstrap)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador');
    RETURN NEW;
  END IF;

  -- Otherwise, check if email is in authorized_admins
  IF EXISTS (
    SELECT 1 FROM public.authorized_admins
    WHERE lower(email) = lower(NEW.email)
      AND used = false
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', (SELECT full_name FROM public.authorized_admins WHERE lower(email) = lower(NEW.email) LIMIT 1)),
      NEW.email
    )
    ON CONFLICT DO NOTHING;

    UPDATE public.authorized_admins
    SET used = true, used_at = now()
    WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END;
$function$;