
CREATE TABLE public.medical_guides_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid,
  operation text NOT NULL,
  changed_by uuid,
  changed_by_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medical_guides_audit TO authenticated;
GRANT ALL ON public.medical_guides_audit TO service_role;

ALTER TABLE public.medical_guides_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit"
ON public.medical_guides_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE OR REPLACE FUNCTION public.log_medical_guides_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.medical_guides_audit(guide_id, operation, changed_by, changed_by_email, new_data)
    VALUES (NEW.id, TG_OP, auth.uid(), NULLIF(_email,''), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.medical_guides_audit(guide_id, operation, changed_by, changed_by_email, old_data, new_data)
    VALUES (NEW.id, TG_OP, auth.uid(), NULLIF(_email,''), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.medical_guides_audit(guide_id, operation, changed_by, changed_by_email, old_data)
    VALUES (OLD.id, TG_OP, auth.uid(), NULLIF(_email,''), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_medical_guides_audit ON public.medical_guides;
CREATE TRIGGER trg_medical_guides_audit
AFTER INSERT OR UPDATE ON public.medical_guides
FOR EACH ROW EXECUTE FUNCTION public.log_medical_guides_audit();

-- DELETE trigger fires BEFORE the block trigger to still capture attempts
DROP TRIGGER IF EXISTS trg_medical_guides_audit_delete ON public.medical_guides;
CREATE TRIGGER trg_medical_guides_audit_delete
BEFORE DELETE ON public.medical_guides
FOR EACH ROW EXECUTE FUNCTION public.log_medical_guides_audit();
