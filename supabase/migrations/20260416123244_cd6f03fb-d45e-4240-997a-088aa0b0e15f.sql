
-- =============================================
-- 1. PROFESSIONALS: Restrict patient access
-- =============================================

-- Drop the patient policy that exposes full row
DROP POLICY IF EXISTS "Patients can view active professionals" ON public.professionals;

-- Recreate: patients can only SELECT if they go through the view,
-- but the view needs underlying table access. We grant minimal access
-- by keeping the policy but it still exposes full row.
-- Better approach: remove direct patient access entirely.
-- The professionals_public VIEW with SECURITY INVOKER won't help.
-- Instead, we create a security definer function for patient queries.

-- Actually, Supabase views use the caller's RLS. So we need a SELECT
-- policy for patients on the base table for the view to work.
-- The view already restricts columns, so this is architecturally safe.
-- But the scanner flags it. Let's use a different approach:
-- Grant patients access ONLY through a security definer function.

-- For now, let's NOT re-add the patient policy on professionals table.
-- Instead, we'll create a security definer function that patients use.

CREATE OR REPLACE FUNCTION public.get_professionals_for_patients()
RETURNS TABLE (
  id uuid,
  full_name text,
  active boolean,
  service_type public.service_type,
  specialty_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.active, p.service_type, p.specialty_id
  FROM public.professionals p
  WHERE p.active = true;
$$;

-- =============================================
-- 2. STORAGE: Remove ALL old policies, recreate strict ones
-- =============================================

-- Drop every known policy on storage.objects for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage documents" ON storage.objects;

-- INSERT: Staff only
CREATE POLICY "Staff can upload documents"
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

-- UPDATE: Staff only
CREATE POLICY "Staff can update documents"
ON storage.objects
FOR UPDATE
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

-- DELETE: Admin only
CREATE POLICY "Only admins can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'administrador')
);

-- SELECT: Staff sees all, patients see only own files
CREATE POLICY "Staff can view all documents"
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

CREATE POLICY "Patients can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND owner = auth.uid()
  AND public.has_role(auth.uid(), 'paciente')
);

-- =============================================
-- 3. PROFESSIONAL_FEES: Restrict to admin/financeiro
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can view professional_fees" ON public.professional_fees;

CREATE POLICY "Admin and financial can view professional_fees"
ON public.professional_fees
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador') OR
  public.has_role(auth.uid(), 'financeiro')
);

-- =============================================
-- 4. Ensure RLS is enabled on all sensitive tables
-- =============================================

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_fees ENABLE ROW LEVEL SECURITY;
