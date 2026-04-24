-- Adicionar coluna role nos convites
ALTER TABLE public.authorized_admins
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'administrador';

-- Atualizar trigger de signup admin para respeitar role
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _prof_id uuid;
BEGIN
  -- Bootstrap: primeiro usuário do sistema vira admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador');
    RETURN NEW;
  END IF;

  -- Verificar convite
  SELECT * INTO _invite
  FROM public.authorized_admins
  WHERE lower(email) = lower(NEW.email)
    AND used = false
  LIMIT 1;

  IF _invite IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _invite.role)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', _invite.full_name), NEW.email)
    ON CONFLICT DO NOTHING;

    -- Se for profissional, vincula/cria o registro
    IF _invite.role = 'profissional'::app_role THEN
      SELECT id INTO _prof_id
      FROM public.professionals
      WHERE lower(email) = lower(NEW.email)
      LIMIT 1;

      IF _prof_id IS NULL THEN
        INSERT INTO public.professionals (full_name, email, user_id, active, service_type)
        VALUES (_invite.full_name, NEW.email, NEW.id, true, 'ambos'::service_type);
      ELSE
        UPDATE public.professionals
        SET user_id = NEW.id, updated_at = now()
        WHERE id = _prof_id;
      END IF;
    END IF;

    UPDATE public.authorized_admins
    SET used = true, used_at = now()
    WHERE id = _invite.id;
  END IF;

  RETURN NEW;
END;
$$;