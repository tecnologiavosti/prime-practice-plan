
-- Storage RLS policies for the 'documents' bucket
CREATE POLICY "Authenticated staff can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
    OR public.has_role(auth.uid(), 'profissional'::public.app_role)
  )
);

CREATE POLICY "Authenticated staff can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
    OR public.has_role(auth.uid(), 'profissional'::public.app_role)
  )
);

CREATE POLICY "Authenticated staff can update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'recepcao'::public.app_role)
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'administrador'::public.app_role)
);
