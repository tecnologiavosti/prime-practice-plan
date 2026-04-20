CREATE OR REPLACE FUNCTION public.is_authorized_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorized_admins
    WHERE lower(email) = lower(trim(_email))
      AND used = false
  );
$$;

CREATE OR REPLACE FUNCTION public.provision_current_user_signup(
  p_email text,
  p_full_name text,
  p_cpf text DEFAULT NULL
)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(trim(COALESCE(p_email, '')));
  _full_name text := COALESCE(NULLIF(trim(p_full_name), ''), 'Sem nome');
  _cpf text := NULLIF(trim(COALESCE(p_cpf, '')), '');
  _jwt_email text := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
  _is_authorized_admin boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF _email = '' THEN
    _email := _jwt_email;
  END IF;

  IF _email = '' THEN
    RAISE EXCEPTION 'EMAIL_REQUIRED';
  END IF;

  IF _jwt_email <> '' AND _email <> _jwt_email THEN
    RAISE EXCEPTION 'EMAIL_MISMATCH';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.authorized_admins
    WHERE lower(email) = _email
      AND used = false
  ) INTO _is_authorized_admin;

  UPDATE public.profiles
  SET full_name = _full_name,
      email = _email,
      updated_at = now()
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (_uid, _full_name, _email);
  END IF;

  IF _is_authorized_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _uid, 'administrador'::public.app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'administrador'::public.app_role
    );

    UPDATE public.authorized_admins
    SET used = true,
        used_at = now(),
        updated_at = now()
    WHERE lower(email) = _email
      AND used = false;

    RETURN 'administrador'::public.app_role;
  END IF;

  IF _cpf IS NULL THEN
    RAISE EXCEPTION 'CPF_REQUIRED';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT _uid, 'paciente'::public.app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'paciente'::public.app_role
  );

  UPDATE public.patients
  SET full_name = _full_name,
      email = _email,
      cpf = COALESCE(cpf, _cpf),
      active = true,
      updated_at = now()
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    INSERT INTO public.patients (user_id, full_name, email, cpf, active)
    VALUES (_uid, _full_name, _email, _cpf, true);
  END IF;

  RETURN 'paciente'::public.app_role;
END;
$$;

DROP POLICY IF EXISTS "Anyone can check authorization" ON public.authorized_admins;