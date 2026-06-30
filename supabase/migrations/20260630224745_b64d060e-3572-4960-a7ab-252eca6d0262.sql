CREATE TABLE public.anamnesis_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anamnesis_id uuid NOT NULL REFERENCES public.anamnesis(id) ON DELETE CASCADE,
  section text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnesis_attachments TO authenticated;
GRANT ALL ON public.anamnesis_attachments TO service_role;

ALTER TABLE public.anamnesis_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view attachments"
ON public.anamnesis_attachments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
  OR public.has_role(auth.uid(), 'recepcao')
  OR public.has_role(auth.uid(), 'financeiro')
  OR EXISTS (
    SELECT 1 FROM public.anamnesis a
    WHERE a.id = anamnesis_id
      AND a.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Staff can insert attachments"
ON public.anamnesis_attachments FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador')
  OR public.has_role(auth.uid(), 'recepcao')
  OR EXISTS (
    SELECT 1 FROM public.anamnesis a
    WHERE a.id = anamnesis_id
      AND a.professional_id = public.current_professional_id()
  )
);

CREATE POLICY "Staff can delete attachments"
ON public.anamnesis_attachments FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
  OR EXISTS (
    SELECT 1 FROM public.anamnesis a
    WHERE a.id = anamnesis_id
      AND a.professional_id = public.current_professional_id()
  )
);

CREATE INDEX idx_anamnesis_attachments_anamnesis ON public.anamnesis_attachments(anamnesis_id);