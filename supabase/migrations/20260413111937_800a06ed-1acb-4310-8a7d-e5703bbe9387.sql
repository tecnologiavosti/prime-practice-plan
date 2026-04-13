
-- 1. Fix professionals: remove the overly permissive patient policy and create a safe view
DROP POLICY IF EXISTS "Patients can view active professionals" ON public.professionals;

-- Create a public view with only safe columns for patient booking
CREATE OR REPLACE VIEW public.professionals_public
WITH (security_invoker = on) AS
SELECT id, full_name, specialty_id, service_type, active
FROM public.professionals
WHERE active = true;

-- Allow patients to read the safe view via a new policy on the base table
-- that only exposes rows when accessed through the view context
-- Actually, security_invoker views use the caller's permissions, so we need a policy for patients
CREATE POLICY "Patients can view active professionals limited"
ON public.professionals
FOR SELECT TO authenticated
USING (
  active = true AND has_role(auth.uid(), 'paciente'::app_role)
);

-- 2. Fix patients: replace overly broad SELECT with role-specific
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

CREATE POLICY "Staff can view all patients"
ON public.patients
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'profissional'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- 3. Fix medical_guides: restrict to staff only
DROP POLICY IF EXISTS "Authenticated users can view medical_guides" ON public.medical_guides;

CREATE POLICY "Staff can view medical_guides"
ON public.medical_guides
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'recepcao'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- 4. Fix professional_payouts: restrict to admin/financial only
DROP POLICY IF EXISTS "Authenticated users can view professional_payouts" ON public.professional_payouts;

CREATE POLICY "Financial staff can view professional_payouts"
ON public.professional_payouts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- 5. Fix financial_transactions: restrict to admin/financial only
DROP POLICY IF EXISTS "Authenticated users can view financial_transactions" ON public.financial_transactions;

CREATE POLICY "Financial staff can view financial_transactions"
ON public.financial_transactions
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);
