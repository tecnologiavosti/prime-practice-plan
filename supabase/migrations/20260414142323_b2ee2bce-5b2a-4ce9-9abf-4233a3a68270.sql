
-- Fix administrators: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view administrators" ON public.administrators;
CREATE POLICY "Staff can view administrators"
ON public.administrators FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'profissional'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix billing_batch_guides: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view billing_batch_guides" ON public.billing_batch_guides;
CREATE POLICY "Staff can view billing_batch_guides"
ON public.billing_batch_guides FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix billing_batches: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view billing_batches" ON public.billing_batches;
CREATE POLICY "Staff can view billing_batches"
ON public.billing_batches FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix insurance_reimbursements: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view insurance_reimbursements" ON public.insurance_reimbursements;
CREATE POLICY "Staff can view insurance_reimbursements"
ON public.insurance_reimbursements FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix medical_guide_documents: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Staff can manage medical_guide_documents" ON public.medical_guide_documents;
CREATE POLICY "Staff can manage medical_guide_documents"
ON public.medical_guide_documents FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix patient_documents: replace has_any_role with staff-only for management
DROP POLICY IF EXISTS "Staff can manage patient_documents" ON public.patient_documents;
CREATE POLICY "Staff can manage patient_documents"
ON public.patient_documents FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'profissional'::app_role)
);

-- Fix patient_packages: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view patient_packages" ON public.patient_packages;
CREATE POLICY "Staff can view patient_packages"
ON public.patient_packages FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix anamnesis: replace has_any_role with staff-only
DROP POLICY IF EXISTS "Authenticated users can view anamnesis" ON public.anamnesis;
CREATE POLICY "Staff can view anamnesis"
ON public.anamnesis FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'profissional'::app_role)
);

-- Fix appointments: replace has_any_role with staff-only for the general view policy
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
CREATE POLICY "Staff can view all appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'profissional'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);
