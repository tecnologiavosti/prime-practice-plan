-- 1) Trigger: ao criar usuário no auth, se o email casar com um professionals.email, vincula user_id e atribui role 'profissional'
CREATE OR REPLACE FUNCTION public.handle_new_professional_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prof_id uuid;
BEGIN
  SELECT id INTO _prof_id
  FROM public.professionals
  WHERE lower(email) = lower(NEW.email)
    AND (user_id IS NULL OR user_id = NEW.id)
  LIMIT 1;

  IF _prof_id IS NOT NULL THEN
    UPDATE public.professionals
    SET user_id = NEW.id, updated_at = now()
    WHERE id = _prof_id;

    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', (SELECT full_name FROM public.professionals WHERE id = _prof_id)),
      NEW.email
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'profissional'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_professional ON auth.users;
CREATE TRIGGER on_auth_user_created_professional
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_professional_signup();

-- 2) Função utilitária: retorna o professional.id do usuário logado
CREATE OR REPLACE FUNCTION public.current_professional_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.professionals WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 3) RLS APPOINTMENTS: profissional só vê os próprios
DROP POLICY IF EXISTS "Professionals can view own appointments" ON public.appointments;
CREATE POLICY "Professionals can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND professional_id = public.current_professional_id()
);

-- Remover SELECT amplo que dava visão a todos os profissionais
DROP POLICY IF EXISTS "Staff can view all appointments" ON public.appointments;
CREATE POLICY "Admin staff can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 4) RLS PROFESSIONAL_PAYOUTS: profissional só vê os próprios
DROP POLICY IF EXISTS "Professionals can view own payouts" ON public.professional_payouts;
CREATE POLICY "Professionals can view own payouts"
ON public.professional_payouts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND professional_id = public.current_professional_id()
);

-- 5) RLS PATIENTS: profissional só vê pacientes que tiveram consulta com ele
DROP POLICY IF EXISTS "Professionals can view their patients" ON public.patients;
CREATE POLICY "Professionals can view their patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND id IN (
    SELECT patient_id FROM public.appointments
    WHERE professional_id = public.current_professional_id()
  )
);

-- Remover policy ampla anterior e recriar restrita a admin/recepcao/financeiro
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;
CREATE POLICY "Admin staff can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 6) RLS PROFESSIONALS: profissional só vê o próprio cadastro
DROP POLICY IF EXISTS "Staff can view all professionals" ON public.professionals;
CREATE POLICY "Admin staff can view all professionals"
ON public.professionals
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Professionals can view own record"
ON public.professionals
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND user_id = auth.uid()
);

-- 7) Permitir profissional alterar status do próprio agendamento (já existia policy similar, garantir)
DROP POLICY IF EXISTS "Professionals can update own appointments" ON public.appointments;
CREATE POLICY "Professionals can update own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'profissional'::app_role)
  AND professional_id = public.current_professional_id()
)
WITH CHECK (
  has_role(auth.uid(), 'profissional'::app_role)
  AND professional_id = public.current_professional_id()
);