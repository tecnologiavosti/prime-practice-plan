
-- 1. Remove broad policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

-- 2. Ensure staff-only upload policy exists
DROP POLICY IF EXISTS "Authenticated staff can upload documents" ON storage.objects;
CREATE POLICY "Authenticated staff can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'recepcao') OR
    public.has_role(auth.uid(), 'profissional') OR
    public.has_role(auth.uid(), 'financeiro')
  )
);

-- 3. Ensure staff-only view policy exists
DROP POLICY IF EXISTS "Authenticated staff can view documents" ON storage.objects;
CREATE POLICY "Authenticated staff can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'recepcao') OR
    public.has_role(auth.uid(), 'profissional') OR
    public.has_role(auth.uid(), 'financeiro')
  )
);

-- 4. Patient-scoped SELECT: patient can only view files they own
CREATE POLICY "Patients can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND owner = auth.uid()
  AND public.has_role(auth.uid(), 'paciente')
);
