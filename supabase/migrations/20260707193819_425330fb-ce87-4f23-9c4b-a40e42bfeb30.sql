-- Prevent patient deletion from cascading into medical guide deletion
ALTER TABLE public.medical_guides
  DROP CONSTRAINT IF EXISTS medical_guides_patient_id_fkey;

ALTER TABLE public.medical_guides
  ADD CONSTRAINT medical_guides_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES public.patients(id)
  ON DELETE RESTRICT;

-- Remove direct hard-delete permissions for medical guides
DROP POLICY IF EXISTS "Professionals can delete own medical_guides" ON public.medical_guides;
DROP POLICY IF EXISTS "Staff can manage medical_guides" ON public.medical_guides;

CREATE POLICY "Staff can insert medical_guides"
ON public.medical_guides
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador'::public.app_role)
  OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

CREATE POLICY "Staff can update medical_guides"
ON public.medical_guides
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador'::public.app_role)
  OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'administrador'::public.app_role)
  OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

-- Database-level safety net: no one can hard-delete medical guides through the app or cascades
CREATE OR REPLACE FUNCTION public.prevent_medical_guide_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'MEDICAL_GUIDE_DELETE_BLOCKED: Guias médicas não podem ser excluídas definitivamente. Altere o status ou mantenha o registro para auditoria.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_medical_guide_hard_delete ON public.medical_guides;
CREATE TRIGGER trg_prevent_medical_guide_hard_delete
BEFORE DELETE ON public.medical_guides
FOR EACH ROW
EXECUTE FUNCTION public.prevent_medical_guide_hard_delete();