
-- 1. Atualizar provision_current_user_signup para respeitar role do convite
CREATE OR REPLACE FUNCTION public.provision_current_user_signup(p_email text, p_full_name text, p_cpf text DEFAULT NULL::text)
 RETURNS app_role
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(trim(COALESCE(p_email, '')));
  _full_name text := COALESCE(NULLIF(trim(p_full_name), ''), 'Sem nome');
  _cpf text := NULLIF(trim(COALESCE(p_cpf, '')), '');
  _jwt_email text := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
  _invite RECORD;
  _prof_id uuid;
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

  -- Buscar convite (independente de used, para não reprovisionar errado)
  SELECT * INTO _invite
  FROM public.authorized_admins
  WHERE lower(email) = _email
  ORDER BY used ASC, created_at DESC
  LIMIT 1;

  -- Atualizar profile
  UPDATE public.profiles
  SET full_name = _full_name, email = _email, updated_at = now()
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (_uid, _full_name, _email);
  END IF;

  IF _invite IS NOT NULL THEN
    -- PRIORIDADE: usar a role do convite (administrador, profissional, recepcao, financeiro)
    INSERT INTO public.user_roles (user_id, role)
    SELECT _uid, _invite.role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = _invite.role
    );

    -- Se o convite for para profissional, vincular/criar em professionals
    IF _invite.role = 'profissional'::app_role THEN
      SELECT id INTO _prof_id
      FROM public.professionals
      WHERE lower(email) = _email
      LIMIT 1;

      IF _prof_id IS NULL THEN
        INSERT INTO public.professionals (full_name, email, user_id, active, service_type)
        VALUES (_invite.full_name, _email, _uid, true, 'ambos'::service_type);
      ELSE
        UPDATE public.professionals
        SET user_id = _uid, updated_at = now()
        WHERE id = _prof_id;
      END IF;
    END IF;

    -- Marcar convite como usado
    UPDATE public.authorized_admins
    SET used = true, used_at = now(), updated_at = now()
    WHERE id = _invite.id AND used = false;

    RETURN _invite.role;
  END IF;

  -- Fluxo de paciente (sem convite)
  IF _cpf IS NULL THEN
    RAISE EXCEPTION 'CPF_REQUIRED';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT _uid, 'paciente'::public.app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'paciente'::public.app_role
  );

  UPDATE public.patients
  SET full_name = _full_name, email = _email, cpf = COALESCE(cpf, _cpf),
      active = true, updated_at = now()
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    INSERT INTO public.patients (user_id, full_name, email, cpf, active)
    VALUES (_uid, _full_name, _email, _cpf, true);
  END IF;

  RETURN 'paciente'::public.app_role;
END;
$function$;

-- 2. Corrigir o registro do Carlos
DO $$
DECLARE
  _uid uuid := '356fa80a-76da-4ee3-b121-7198876ce807';
  _email text := 'carlos@gmail.com';
  _full_name text;
  _prof_id uuid;
BEGIN
  SELECT full_name INTO _full_name FROM public.authorized_admins WHERE lower(email) = _email LIMIT 1;
  _full_name := COALESCE(_full_name, 'Carlos');

  -- Remover role administrador
  DELETE FROM public.user_roles WHERE user_id = _uid AND role = 'administrador'::app_role;

  -- Adicionar role profissional
  INSERT INTO public.user_roles (user_id, role)
  SELECT _uid, 'profissional'::app_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'profissional'::app_role);

  -- Criar/vincular em professionals
  SELECT id INTO _prof_id FROM public.professionals WHERE lower(email) = _email LIMIT 1;
  IF _prof_id IS NULL THEN
    INSERT INTO public.professionals (full_name, email, user_id, active, service_type)
    VALUES (_full_name, _email, _uid, true, 'ambos'::service_type);
  ELSE
    UPDATE public.professionals SET user_id = _uid, updated_at = now() WHERE id = _prof_id;
  END IF;
END $$;
