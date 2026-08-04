-- Update patient visibility policy to include professionals
DROP POLICY IF EXISTS "Professionals can view own registered patients" ON public.patients;
DROP POLICY IF EXISTS "Admin staff can view all patients" ON public.patients;

CREATE POLICY "Allow staff to view all patients" ON public.patients
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'administrador') OR 
  has_role(auth.uid(), 'recepcao') OR 
  has_role(auth.uid(), 'financeiro') OR
  has_role(auth.uid(), 'profissional')
);
