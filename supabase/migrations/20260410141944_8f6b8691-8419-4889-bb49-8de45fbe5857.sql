
DROP POLICY IF EXISTS "Staff can delete documents" ON storage.objects;

CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND public.has_any_role(auth.uid())
);
