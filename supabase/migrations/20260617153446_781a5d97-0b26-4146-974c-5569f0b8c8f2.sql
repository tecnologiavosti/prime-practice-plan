CREATE POLICY "Professionals can view own medical_guides"
ON public.medical_guides
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
);

CREATE POLICY "Professionals can insert own medical_guides"
ON public.medical_guides
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_id
        AND p.created_by = auth.uid()
    )
    OR public.professional_treats_patient(patient_id)
  )
);

CREATE POLICY "Professionals can update own medical_guides"
ON public.medical_guides
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_id
        AND p.created_by = auth.uid()
    )
    OR public.professional_treats_patient(patient_id)
  )
);

CREATE POLICY "Professionals can delete own medical_guides"
ON public.medical_guides
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
);

CREATE POLICY "Professionals can view own medical_guide_items"
ON public.medical_guide_items
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can insert own medical_guide_items"
ON public.medical_guide_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can update own medical_guide_items"
ON public.medical_guide_items
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can delete own medical_guide_items"
ON public.medical_guide_items
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND professional_id = public.current_professional_id()
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can view own medical_guide_documents"
ON public.medical_guide_documents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can insert own medical_guide_documents"
ON public.medical_guide_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Professionals can delete own medical_guide_documents"
ON public.medical_guide_documents
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'profissional'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.medical_guides mg
    WHERE mg.id = medical_guide_id
      AND mg.professional_id = public.current_professional_id()
  )
);